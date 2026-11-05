import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AuthButton, AuthFeedback, AuthInput, AuthScreen } from '@/components/auth-ui';
import { LoginAnimation } from '@/components/LoginAnimation';
import { FontFamily, TallerColors } from '@/constants/taller-colors';
import { useSesion } from '@/context/sesion';
import { obtenerMensajeErrorFirebase } from '@/lib/errores-firebase';
import { validarCorreo } from '@/lib/validaciones';

export default function LoginScreen() {
  const { iniciarSesion } = useSesion();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  async function enviarFormulario() {
    setError('');
    if (!validarCorreo(correo)) {
      setError('Ingresa un correo electrónico válido.');
      setShakeKey((value) => value + 1);
      return;
    }
    if (!clave) {
      setError('Ingresa tu contraseña.');
      setShakeKey((value) => value + 1);
      return;
    }

    setCargando(true);
    try {
      await iniciarSesion(correo, clave);
      router.replace('/(tabs)');
    } catch (authError) {
      if (
        typeof authError === 'object' &&
        authError !== null &&
        'code' in authError &&
        authError.code === 'auth/email-not-verified'
      ) {
        router.replace('/verificacion');
      } else {
        setError(obtenerMensajeErrorFirebase(authError));
        setShakeKey((value) => value + 1);
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthScreen
      title="Inicia sesión"
      subtitle="Ingresa a tu cuenta para continuar."
      shakeKey={shakeKey}>
      <LoginAnimation />
      <AuthInput
        label="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <AuthInput
        label="Contraseña"
        value={clave}
        onChangeText={setClave}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={() => {
          void enviarFormulario();
        }}
      />
      {error ? <AuthFeedback>{error}</AuthFeedback> : null}
      <AuthButton
        label="Ingresar"
        onPress={() => {
          void enviarFormulario();
        }}
        loading={cargando}
      />
      <Link href="/recuperar" asChild>
        <Pressable accessibilityRole="link" style={styles.linkButton}>
          <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
        </Pressable>
      </Link>
      <Link href="/registro" asChild>
        <Pressable accessibilityRole="link" style={styles.linkButton}>
          <Text style={styles.linkText}>Crear una cuenta</Text>
        </Pressable>
      </Link>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  linkButton: {
    alignSelf: 'center',
    paddingVertical: 5,
  },
  linkText: {
    color: TallerColors.brand,
    fontSize: 14,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
});
