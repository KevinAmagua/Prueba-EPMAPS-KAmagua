import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { processSyncQueue } from '@/services/syncQueue';

const SYNC_QUEUE_KEY = '@sync_queue';

/**
 * Expone conectividad y cantidad de lecturas no sincronizadas.
 * Al volver la conexión activa el procesador y permite refrescar el contador.
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    // Escucha cambios de conectividad y libera la suscripción al desmontarse.
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    // Completa el estado inicial porque el listener puede no emitir de inmediato.
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    // Carga el contador al montar y lo vuelve a consultar cada cinco segundos.
    loadPendingCount();

    const interval = setInterval(() => {
      loadPendingCount();
    }, 5000);

    // Limpia la suscripción y el temporizador al desmontar el consumidor.
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    let active = true;
    // Al terminar el intento, refresca el contador solo si este efecto sigue
    // vigente; los errores del procesador se registran sin ocultarlos.
    processSyncQueue()
      .then(() => {
        if (active) return loadPendingCount();
      })
      .catch((error) => {
        console.error('[useNetworkStatus] Error al sincronizar lecturas pendientes:', error);
      });

    return () => {
      active = false;
    };
  }, [isConnected]);

  /** Cuenta los elementos aún no marcados como sincronizados en AsyncStorage. */
  const loadPendingCount = async () => {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (data) {
        const queue = JSON.parse(data);
        if (Array.isArray(queue)) {
          const unsyncedCount = queue.filter((item: any) => !item.sincronizado).length;
          setPendingCount(unsyncedCount);
        }
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.error('[useNetworkStatus] Error cargando cola de pendientes:', error);
    }
  };

  return { isConnected, pendingCount, refreshPendingCount: loadPendingCount };
}
