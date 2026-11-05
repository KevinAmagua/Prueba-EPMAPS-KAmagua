import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AuthButton, AuthFeedback, AuthInput, AuthScreen } from '@/components/auth-ui';
import { PasswordStrengthIndicator } from '@/components/password-strength-indicator';
import { useSesion } from '@/context/sesion';
import { obtenerMensajeErrorFirebase } from '@/lib/errores-firebase';
import { validarClave, validarCorreo } from '@/lib/validaciones';

export default function RegistroScreen() {
  const { registrarse } = useSesion();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  async function enviarFormulario() {
    setError('');
    if (!nombre.trim()) {
      setError('Escribe tu nombre.');
      setShakeKey((value) => value + 1);
      return;
    }
    if (!validarCorreo(correo)) {
      setError('Ingresa un correo electrónico válido.');
      setShakeKey((value) => value + 1);
      return;
    }
    if (!validarClave(clave)) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setShakeKey((value) => value + 1);
      return;
    }
    if (clave !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      setShakeKey((value) => value + 1);
      return;
    }

    setCargando(true);
    try {
      await registrarse(nombre, correo, clave);
      router.replace('/verificacion');
    } catch (authError) {
      setError(obtenerMensajeErrorFirebase(authError));
      setShakeKey((value) => value + 1);
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthScreen
      title="Crea tu cuenta"
      subtitle="Verifica tu correo antes de ingresar al registro de lecturas."
      compactOnKeyboard
      shakeKey={shakeKey}>
      <AuthInput
        label="Nombre"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
      />
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
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
      />
      <PasswordStrengthIndicator password={clave} />
      <AuthInput
        label="Confirma tu contraseña"
        value={confirmacion}
        onChangeText={setConfirmacion}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={() => {
          void enviarFormulario();
        }}
      />
      {error ? <AuthFeedback>{error}</AuthFeedback> : null}
      <AuthButton
        label="Registrarme"
        onPress={() => {
          void enviarFormulario();
        }}
        loading={cargando}
      />
      <Link href="/verificacion" asChild>
        <Pressable accessibilityRole="link" style={styles.linkButton}>
          <Text style={styles.linkText}>¿Necesitas verificar tu correo?</Text>
        </Pressable>
      </Link>
      <Link href="/login" asChild>
        <Pressable accessibilityRole="link" style={styles.linkButton}>
          <Text style={styles.linkText}>Ya tengo una cuenta</Text>
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
    color: '#1F3C88',
    fontSize: 14,
    fontWeight: '700',
  },
});
