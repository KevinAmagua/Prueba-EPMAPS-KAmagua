import '../global.css';

import { BigShoulders_700Bold } from '@expo-google-fonts/big-shoulders';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { OfflineBanner } from '@/components/OfflineBanner';
import { StyledAlertProvider } from '@/components/StyledAlert';
import { Colors } from '@/constants/Colors';
import { SesionProvider, useSesion } from '@/context/sesion';
import { obtenerMensajeErrorFirebase } from '@/lib/errores-firebase';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BigShoulders_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  if (fontError) throw fontError;

  return (
    <SesionProvider>
      <StyledAlertProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          {fontsLoaded ? (
            <>
              <OfflineBanner />
              <RutasProtegidas />
            </>
          ) : (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingMessage}>Preparando la aplicación…</Text>
            </View>
          )}
        </View>
      </StyledAlertProvider>
    </SesionProvider>
  );
}

function RutasProtegidas() {
  const { usuario, cargando, errorSesion } = useSesion();
  const correoVerificado = usuario?.emailVerified === true;

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingMessage}>Cargando tu sesión…</Text>
      </View>
    );
  }

  if (errorSesion) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>No se pudo iniciar la sesión</Text>
        <Text style={styles.errorMessage}>{obtenerMensajeErrorFirebase(errorSesion)}</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.secondary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontSize: 17,
          fontFamily: 'SpaceGrotesk_700Bold',
          fontWeight: '700',
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!correoVerificado}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="registro" options={{ headerShown: false }} />
        <Stack.Screen name="recuperar" options={{ headerShown: false }} />
        <Stack.Screen name="verificacion" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={correoVerificado}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="capture/[codigo]" options={{ title: 'Registro de Lectura EPMAPS' }} />
        <Stack.Screen name="pendientes" options={{ title: 'Pendientes de sincronización' }} />
        <Stack.Screen name="lectura/[id]" options={{ title: 'Detalle de lectura' }} />
        <Stack.Screen name="editar-perfil" options={{ title: 'Editar perfil' }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'transparent',
  },
  loadingMessage: {
    marginTop: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_500Medium',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_400Regular',
    textAlign: 'center',
  },
});
