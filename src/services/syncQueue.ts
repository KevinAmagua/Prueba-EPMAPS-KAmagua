import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api } from './api';
import { uploadMeterPhoto } from './storage';
import { NuevaLectura, PendingSyncItem } from '@/types/medidor';

/** Clave persistente que contiene lecturas locales pendientes o enviadas. */
const SYNC_QUEUE_KEY = '@sync_queue';

let queueStorageOperation: Promise<void> = Promise.resolve();
let isProcessingQueue = false;
let processQueueRequested = false;

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
export async function processSyncQueue(): Promise<void> {
  if (isProcessingQueue) {
    // Pide una nueva pasada al proceso activo en vez de iniciar otro en paralelo.
    processQueueRequested = true;
    return;
  }

  isProcessingQueue = true;

  try {
    do {
      processQueueRequested = false;
      const netState = await NetInfo.fetch();
      // Una cola sin conexión permanece intacta para el próximo intento.
      if (!netState.isConnected || netState.isInternetReachable === false) return;

      const queue = await withQueueStorageLock(readQueue);
      for (const item of queue) {
        if (item.sincronizado) continue; // Ya sincronizado

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

          const lecturaPayload = {
            ...item.lectura,
            fotoUrl: fotoUrlFinal,
            localId: item.localId,
          };

          await api.post('/lecturas', lecturaPayload);
          console.info(`[SyncQueue] Sincronización exitosa para lectura local: ${item.localId}`);

          await withQueueStorageLock(async () => {
            const currentQueue = await readQueue();
            await AsyncStorage.setItem(
              SYNC_QUEUE_KEY,
              JSON.stringify(currentQueue.map((queuedItem) => queuedItem.localId === item.localId
                ? { ...queuedItem, sincronizado: true, lectura: { ...queuedItem.lectura, fotoUrl: fotoUrlFinal } }
                : queuedItem))
            );
          });
        } catch (error) {
          console.warn(`[SyncQueue] Fallo al sincronizar ítem ${item.localId}, reintentará posteriormente.`, error);
          await withQueueStorageLock(async () => {
            const currentQueue = await readQueue();
            await AsyncStorage.setItem(
              SYNC_QUEUE_KEY,
              JSON.stringify(currentQueue.map((queuedItem) => queuedItem.localId === item.localId
                ? {
                    ...queuedItem,
                    intentos: queuedItem.intentos + 1,
                    ultimoError: error instanceof Error ? error.message : 'Error desconocido',
                  }
                : queuedItem))
            );
          });
        }
      }
    } while (processQueueRequested);
  } finally {
    // También se libera el indicador si falla la lectura o el procesamiento.
    isProcessingQueue = false;
  }
}
