import { Medidor } from '@/types/medidor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api } from './api';

/** Clave de AsyncStorage para la lista de medidores consultada previamente. */
const MEDIDORES_CACHE_KEY = '@medidores_cache';

/**
 * Obtiene medidores desde la API cuando hay conexión y actualiza la caché.
 * Si no hay conexión, falla la solicitud o la respuesta no es una lista,
 * intenta devolver la lista local; si no existe una caché válida devuelve [].
 */
export async function getMedidoresWithCache(): Promise<Medidor[]> {
  const netState = await NetInfo.fetch();
  const isConnected = netState.isConnected ?? false;

  if (isConnected) {
    try {
      const response = await api.get<Medidor[]>('/medidores');
      const medidores = response.data;
      if (Array.isArray(medidores)) {
        // Actualiza la caché solo cuando la respuesta tiene la forma esperada.
        await AsyncStorage.setItem(MEDIDORES_CACHE_KEY, JSON.stringify(medidores));
        return medidores;
      }
    } catch (error) {
      console.warn('[CacheService] Error al obtener medidores del API, usando caché local:', error);
    }
  }

  // La consulta local es el respaldo tanto para falta de red como para fallos
  // o respuestas inesperadas de la API.
  try {
    const cachedData = await AsyncStorage.getItem(MEDIDORES_CACHE_KEY);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('[CacheService] Error al leer el caché local de medidores:', error);
  }

  return [];
}
