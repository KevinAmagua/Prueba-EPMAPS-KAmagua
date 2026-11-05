import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useSesion } from '@/context/sesion';

export default function IndexScreen() {
  const { usuario, cargando } = useSesion();

  useEffect(() => {
    if (cargando) return;
    if (usuario?.emailVerified) {
      router.replace('/(tabs)');
    } else if (usuario) {
      router.replace('/verificacion');
    } else {
      router.replace('/login');
    }
  }, [cargando, usuario]);

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
    backgroundColor: 'transparent',
  },
});
