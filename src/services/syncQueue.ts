import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { isAxiosError } from 'axios';
import { sincronizarLecturaGPS } from './readings';
import { uploadMeterPhoto } from './storage';
import { NuevaLectura, PendingSyncItem } from '@/types/medidor';

/** Clave persistente que contiene lecturas locales pendientes o enviadas. */
const SYNC_QUEUE_KEY = '@sync_queue';

let queueStorageOperation: Promise<void> = Promise.resolve();
let queueRunPromise: Promise<void> | null = null;
let processQueueRequested = false;
let retryBlockedItemsRequested = false;

/** Describe el fallo HTTP sin incluir query strings ni datos de configuración. */
function describeSyncError(error: unknown): { message: string; isNotFound: boolean } {
  if (isAxiosError(error)) {
    const method = error.config?.method?.toUpperCase();
    const route = error.config?.url?.split('?')[0];
    const request = [method, route].filter(Boolean).join(' ');
    const status = error.response?.status;

    if (status === 404) {
      return {
        message: `HTTP 404${request ? ` en ${request}` : ''}: el recurso no existe en la API configurada. Verifica EXPO_PUBLIC_MOCK_API_URL y que existan las rutas /lecturas y /medidores.`,
        isNotFound: true,
      };
    }

    return {
      message: `${status ? `HTTP ${status}` : error.message}${request ? ` en ${request}` : ''}`,
      isNotFound: false,
    };
  }

  return {
    message: error instanceof Error ? error.message : 'Error desconocido al sincronizar la lectura.',
    isNotFound: false,
  };
}

/**
 * Serializa operaciones de lectura y escritura de la cola para evitar que
 * dos actualizaciones concurrentes sobrescriban los cambios entre sí.
 */
function withQueueStorageLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = queueStorageOperation.then(operation, operation);
  queueStorageOperation = result.then(() => undefined, () => undefined);
  return result;
}

/** Lee y valida que el contenido persistido de la cola tenga forma de lista. */
async function readQueue(): Promise<PendingSyncItem[]> {
  const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  if (!queueJson) return [];

  const parsedQueue: unknown = JSON.parse(queueJson);
  if (!Array.isArray(parsedQueue)) {
    throw new Error('La cola local de lecturas tiene un formato inválido.');
  }

  return parsedQueue as PendingSyncItem[];
}

/**
 * Agrega una lectura a la cola local y solicita un intento de sincronización.
 * @param nuevaLectura Datos de lectura antes de recibir un identificador remoto.
 * @param fotoLocalUri URI opcional de evidencia aún almacenada en el dispositivo.
 */
export async function enqueuePendingReading(
  nuevaLectura: NuevaLectura,
  fotoLocalUri?: string
): Promise<void> {
  const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const newItem: PendingSyncItem = {
    localId,
    creadaEn: new Date().toISOString(),
    intentos: 0,
    sincronizado: false,
    fotoLocalUri: fotoLocalUri,
    lectura: {
      ...nuevaLectura,
      fotoUrl: fotoLocalUri || nuevaLectura.fotoUrl,
    },
  };

  // Persistir primero permite conservar la captura aunque no haya red disponible.
  try {
    await withQueueStorageLock(async () => {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const parsedQueue: unknown = queueJson ? JSON.parse(queueJson) : [];
      if (!Array.isArray(parsedQueue)) {
        throw new Error('La cola local de lecturas tiene un formato inválido.');
      }

      await AsyncStorage.setItem(
        SYNC_QUEUE_KEY,
        JSON.stringify([...(parsedQueue as PendingSyncItem[]), newItem])
      );
    });
    console.info('[SyncQueue] Lectura encolada correctamente para sincronización.');
    void processSyncQueue().catch((error) => {
      console.error('[SyncQueue] Error al iniciar la sincronización:', error);
    });
  } catch (error) {
    console.error('[SyncQueue] Error al encolar lectura:', error);
    throw error;
  }
}

/**
 * Procesa los registros pendientes si NetInfo indica acceso a internet.
 * Sube primero las fotos locales y después envía cada lectura; los éxitos se
 * marcan individualmente y los fallos guardan su error para futuros intentos.
 */
export function processSyncQueue(options: { retryBlocked?: boolean } = {}): Promise<void> {
  if (queueRunPromise) {
    // Pide una nueva pasada al proceso activo en vez de iniciar otro en paralelo.
    processQueueRequested = true;
    retryBlockedItemsRequested ||= options.retryBlocked === true;
    return queueRunPromise;
  }

  retryBlockedItemsRequested = options.retryBlocked === true;
  queueRunPromise = runSyncQueue().finally(() => {
    queueRunPromise = null;
  });
  return queueRunPromise;
}

async function runSyncQueue(): Promise<void> {
  do {
    processQueueRequested = false;
    const retryBlocked = retryBlockedItemsRequested;
    retryBlockedItemsRequested = false;
    const netState = await NetInfo.fetch();
    // Una cola sin conexión permanece intacta para el próximo intento.
    if (!netState.isConnected || netState.isInternetReachable === false) return;

    const queue = await withQueueStorageLock(readQueue);
    for (const item of queue) {
      if (item.sincronizado || (item.requiereReintentoManual && !retryBlocked)) continue;

      try {
        let fotoUrlFinal = item.lectura.fotoUrl;
        // Acepta tanto el campo explícito de foto local como una URI file://
        // que haya quedado guardada previamente en la lectura.
        const localPhotoUri = item.fotoLocalUri || (fotoUrlFinal?.startsWith('file://') ? fotoUrlFinal : undefined);

        if (localPhotoUri) {
          const uploadedUrl = await uploadMeterPhoto(localPhotoUri, `${item.localId}.jpg`);
          if (uploadedUrl) {
            fotoUrlFinal = uploadedUrl;
          }
        }

        const lecturaRemota = await sincronizarLecturaGPS({
          medidorId: item.lectura.medidorId,
          codigoMedidor: item.lectura.codigoMedidor,
          lecturaActual: item.lectura.lecturaActual,
          consumoEstimado: item.lectura.consumoEstimado,
          fechaLectura: item.lectura.fechaLectura,
          estado: item.lectura.estado,
          observacion: item.lectura.observacion,
          fotoUrl: fotoUrlFinal,
          localId: item.localId,
          ubicacion: item.lectura.ubicacion ?? null,
          isManualLocation: item.lectura.isManualLocation ?? false,
        });

        console.info(`[SyncQueue] Sincronización exitosa para lectura local: ${item.localId}`);

        await withQueueStorageLock(async () => {
          const currentQueue = await readQueue();
          await AsyncStorage.setItem(
            SYNC_QUEUE_KEY,
            JSON.stringify(currentQueue.map((queuedItem) => queuedItem.localId === item.localId
              ? {
                  ...queuedItem,
                  sincronizado: true,
                  lecturaRemotaId: lecturaRemota.id,
                  ultimoError: undefined,
                  requiereReintentoManual: false,
                  lectura: { ...queuedItem.lectura, fotoUrl: fotoUrlFinal },
                }
              : queuedItem))
          );
        });
      } catch (error) {
        const syncError = describeSyncError(error);
        console.warn(`[SyncQueue] Fallo al sincronizar ítem ${item.localId}: ${syncError.message}`, error);
        await withQueueStorageLock(async () => {
          const currentQueue = await readQueue();
          await AsyncStorage.setItem(
            SYNC_QUEUE_KEY,
            JSON.stringify(currentQueue.map((queuedItem) => queuedItem.localId === item.localId
              ? {
                  ...queuedItem,
                  intentos: queuedItem.intentos + 1,
                  ultimoError: syncError.message,
                  requiereReintentoManual: syncError.isNotFound,
                }
              : queuedItem))
          );
        });
      }
    }
  } while (processQueueRequested || retryBlockedItemsRequested);
}
