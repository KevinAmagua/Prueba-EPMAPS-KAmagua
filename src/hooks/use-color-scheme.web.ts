import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Lee el esquema del sistema en cliente para evitar discrepancias durante
 * el renderizado estático inicial de la aplicación web.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  // Mantiene el primer render estático en claro y aplica el tema real tras hidratar.
  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
