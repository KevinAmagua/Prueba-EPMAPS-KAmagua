import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Lee el esquema del sistema en cliente para evitar discrepancias durante
 * el renderizado estático inicial de la aplicación web.
 */
export function useColorScheme() {
  return useRNColorScheme() ?? 'light';
}
