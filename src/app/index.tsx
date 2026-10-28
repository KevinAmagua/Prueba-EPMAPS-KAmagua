import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { getSession } from '@/services/auth';

/**
 * Pantalla de entrada que resuelve la ruta inicial según la sesión persistida.
 * Muestra un indicador mientras consulta el almacenamiento local.
 */
export default function IndexScreen() {
  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  /**
   * Lee la sesión local y reemplaza la ruta para que el usuario no vuelva
   * accidentalmente a esta pantalla usando el botón Atrás.
   */
  const checkAuthAndRedirect = async () => {
    try {
      const session = await getSession();
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('[Index] Error verificando sesión:', error);
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
