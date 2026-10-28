import AsyncStorage from '@react-native-async-storage/async-storage';

/** Clave de AsyncStorage donde se conserva la sesión del técnico. */
export const AUTH_SESSION_KEY = '@auth_session';

export interface SesionTecnico {
  tecId: string;
  nombre: string;
  usuario: string;
  token: string;
  ultimoAcceso: string;
}

/**
 * Guarda la sesión serializada en AsyncStorage.
 * @param session Datos del técnico que se conservarán entre aperturas.
 * @throws Propaga los errores de almacenamiento tras registrarlos.
 */
export async function saveSession(session: SesionTecnico): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('[AuthService] Error al guardar la sesión:', error);
    throw error;
  }
}

/**
 * Recupera y deserializa la sesión guardada.
 * @returns La sesión almacenada o `null` si no existe o no se puede leer.
 */
export async function getSession(): Promise<SesionTecnico | null> {
  try {
    const data = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data) as SesionTecnico;
  } catch (error) {
    console.error('[AuthService] Error al recuperar la sesión:', error);
    return null;
  }
}

/**
 * Elimina la sesión persistida para cerrar el acceso local.
 * @throws Propaga los errores de almacenamiento tras registrarlos.
 */
export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  } catch (error) {
    console.error('[AuthService] Error al cerrar sesión:', error);
    throw error;
  }
}
