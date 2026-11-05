import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AuthButton, AuthFeedback, AuthScreen } from '@/components/auth-ui';
import { useSesion } from '@/context/sesion';
import { obtenerMensajeErrorFirebase } from '@/lib/errores-firebase';

export default function VerificacionScreen() {
  const { usuario, reenviarVerificacion, actualizarVerificacion, cerrarSesion } = useSesion();
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function reenviarCorreo() {
    setMensaje('');
    setError('');
    setCargando(true);
    try {
      await reenviarVerificacion();
      setMensaje('Enviamos otro enlace de verificación a tu correo.');
    } catch (sendError) {
      setError(obtenerMensajeErrorFirebase(sendError));
    } finally {
      setCargando(false);
    }
  }

  async function comprobarCorreo() {
    setMensaje('');
    setError('');
    setCargando(true);
    try {
      const verificado = await actualizarVerificacion();
      if (verificado) {
        router.replace('/(tabs)');
      } else {
        setError('Aún no aparece la verificación. Abre el enlace y vuelve a intentarlo.');
      }
    } catch (refreshError) {
      setError(obtenerMensajeErrorFirebase(refreshError));
    } finally {
      setCargando(false);
    }
  }

  async function salir() {
    setError('');
    setCargando(true);
    try {
      await cerrarSesion();
      router.replace('/login');
    } catch (signOutError) {
      setError(obtenerMensajeErrorFirebase(signOutError));
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthScreen
      title={usuario ? 'Verifica tu correo' : 'Inicia sesión para verificar'}
      subtitle={
        usuario
          ? 'Confirma tu dirección de correo antes de ingresar a la aplicación.'
          : 'Inicia sesión o crea una cuenta para continuar con la verificación.'
      }>
      {usuario ? (
        <>
          <Text style={styles.email}>{usuario.email}</Text>
          <Text style={styles.instructions}>
            Abre el mensaje de Firebase y pulsa el enlace de verificación. Si no lo encuentras,
            revisa también la carpeta de correo no deseado.
          </Text>
        </>
      ) : null}
      {error ? <AuthFeedback>{error}</AuthFeedback> : null}
      {mensaje ? <AuthFeedback success>{mensaje}</AuthFeedback> : null}
      {usuario ? (
        <AuthButton
          label="Ya verifiqué mi correo"
          onPress={() => {
            void comprobarCorreo();
          }}
          loading={cargando}
        />
      ) : null}
      {usuario && !usuario.emailVerified ? (
        <AuthButton
          label="Reenviar correo"
          onPress={() => {
            void reenviarCorreo();
          }}
          loading={cargando}
          secondary
        />
      ) : null}
      {!usuario ? (
        <>
          <Link href="/login" asChild>
            <Pressable accessibilityRole="link" style={styles.linkButton}>
              <Text style={styles.linkText}>Iniciar sesión</Text>
            </Pressable>
          </Link>
          <Link href="/registro" asChild>
            <Pressable accessibilityRole="link" style={styles.linkButton}>
              <Text style={styles.linkText}>Crear una cuenta</Text>
            </Pressable>
          </Link>
        </>
      ) : null}
      {usuario ? (
        <AuthButton
          label="Cerrar sesión"
          onPress={() => {
            void salir();
          }}
          loading={cargando}
          secondary
        />
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  email: {
    alignSelf: 'stretch',
    color: '#1A2530',
    fontSize: 16,
    fontWeight: '700',
  },
  instructions: {
    alignSelf: 'stretch',
    color: '#5A6B7C',
    fontSize: 14,
    lineHeight: 21,
  },
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
