import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AuthButton, AuthFeedback, AuthInput, AuthScreen } from '@/components/auth-ui';
import { FontFamily, TallerColors } from '@/constants/taller-colors';
import { useSesion } from '@/context/sesion';
import { obtenerMensajeErrorFirebase } from '@/lib/errores-firebase';
import { validarCorreo } from '@/lib/validaciones';

export default function RecuperarScreen() {
  const { enviarCorreoRecuperacion } = useSesion();
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  async function enviarFormulario() {
    setError('');
    setMensaje('');
    if (!validarCorreo(correo)) {
      setError('Ingresa un correo electrónico válido.');
      setShakeKey((value) => value + 1);
      return;
    }

    setCargando(true);
    try {
      await enviarCorreoRecuperacion(correo);
      setMensaje(
        'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.',
      );
    } catch (authError) {
      const code =
        typeof authError === 'object' &&
        authError !== null &&
        'code' in authError &&
        typeof authError.code === 'string'
          ? authError.code
          : '';
      if (code === 'auth/user-not-found') {
        setMensaje(
          'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.',
        );
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
      title="Recupera tu contraseña"
      subtitle="Escribe el correo asociado a tu cuenta y te enviaremos un enlace para restablecerla."
      shakeKey={shakeKey}>
      <AuthInput
        label="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={() => {
          void enviarFormulario();
        }}
      />
      {error ? <AuthFeedback>{error}</AuthFeedback> : null}
      {mensaje ? <AuthFeedback success>{mensaje}</AuthFeedback> : null}
      <AuthButton
        label="Enviar instrucciones"
        onPress={() => {
          void enviarFormulario();
        }}
        loading={cargando}
      />
      <Link href="/login" asChild>
        <Pressable accessibilityRole="link" style={styles.linkButton}>
          <Text style={styles.linkText}>Volver al inicio de sesión</Text>
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
