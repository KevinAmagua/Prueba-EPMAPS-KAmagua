import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { FontFamily, cardShadow } from '@/constants/taller-colors';
import { useSesion } from '@/context/sesion';
import { obtenerMensajeErrorFirebase } from '@/lib/errores-firebase';

export default function ProfileScreen() {
  const { usuario, cerrarSesion } = useSesion();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  async function handleLogout() {
    setCerrandoSesion(true);
    try {
      await cerrarSesion();
      router.replace('/login');
    } catch (error) {
      Alert.alert('No se pudo cerrar sesión', obtenerMensajeErrorFirebase(error));
    } finally {
      setCerrandoSesion(false);
    }
  }

  function confirmarLogout() {
    Alert.alert('Cerrar Sesión', '¿Está seguro de que desea cerrar sesión en campo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => {
          void handleLogout();
        },
      },
    ]);
  }

  function editarPerfil() {
    router.push('/editar-perfil');
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Perfil del Operador</Text>
        <Text style={styles.text}><Text style={styles.bold}>ID de cuenta:</Text> {usuario?.uid || 'N/D'}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Nombre:</Text> {usuario?.displayName || 'Operador EPMAPS'}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Correo:</Text> {usuario?.email || 'N/D'}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Último acceso:</Text> {usuario?.metadata.lastSignInTime ? new Date(usuario.metadata.lastSignInTime).toLocaleString('es-EC') : 'N/D'}</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={editarPerfil}
          activeOpacity={0.8}>
          <Text style={styles.editButtonText}>Editar nombre</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButton, cerrandoSesion && styles.logoutButtonDisabled]}
          onPress={confirmarLogout}
          disabled={cerrandoSesion}
          activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>
            {cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar Sesión'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 24,
    ...cardShadow,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 22,
  },
  text: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: 14,
  },
  bold: {
    fontFamily: FontFamily.semibold,
    fontWeight: '700',
  },
  editButton: {
    minHeight: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  logoutButton: {
    minHeight: 56,
    backgroundColor: Colors.danger,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
});
