import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { getSession, clearSession, SesionTecnico } from '@/services/auth';

/** Pantalla con los datos persistidos del operador y la acción de salida. */
export default function ProfileScreen() {
  const [session, setSession] = useState<SesionTecnico | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionDetails();
  }, []);

  /** Recupera la sesión almacenada y finaliza el indicador de carga. */
  const loadSessionDetails = async () => {
    try {
      const currentSession = await getSession();
      setSession(currentSession);
    } catch (error) {
      console.error('[Profile] Error al cargar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  /** Solicita confirmación antes de borrar la sesión y volver al acceso. */
  const handleLogout = async () => {
    Alert.alert('Cerrar Sesión', '¿Está seguro de que desea cerrar sesión en campo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          router.replace('/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Perfil del Operador</Text>
        <Text style={styles.text}><Text style={styles.bold}>ID Técnico:</Text> {session?.tecId || 'N/D'}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Nombre:</Text> {session?.nombre || 'Operador EPMAPS'}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Usuario:</Text> {session?.usuario || 'N/D'}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Último Acceso:</Text> {session?.ultimoAcceso ? new Date(session.ultimoAcceso).toLocaleString() : 'N/D'}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#1A2530',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 22,
  },
  text: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: 14,
  },
  bold: {
    fontWeight: '700',
  },
  logoutButton: {
    minHeight: 56,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
