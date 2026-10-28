import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { getSession, saveSession, SesionTecnico } from '@/services/auth';

/** Pantalla de acceso y creación local de una sesión de técnico. */
export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkExistingSession();
  }, []);

  /**
   * Evita mostrar el formulario si ya existe una sesión persistida.
   * La carga termina incluso si falla la lectura del almacenamiento.
   */
  const checkExistingSession = async () => {
    try {
      const session = await getSession();
      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('[Login] Error verificando sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Comprueba que ambos campos tengan contenido, crea la sesión simulada,
   * la persiste y navega al área principal. No valida credenciales contra
   * un servicio remoto en la implementación actual.
   */
  const handleLogin = async () => {
    if (!usuario.trim() || !password.trim()) {
      Alert.alert('Campos incompletos', 'Por favor ingrese su usuario y clave de técnico.');
      return;
    }

    setSubmitting(true);
    try {
      // Esta aplicación aún no consulta un servicio de autenticación real.
      const nuevaSesion: SesionTecnico = {
        tecId: `TECH-${Math.floor(100 + Math.random() * 900)}`,
        nombre: `Operador Campo (${usuario.trim()})`,
        usuario: usuario.trim(),
        token: 'epmaps-mock-jwt-token-2026',
        ultimoAcceso: new Date().toISOString(),
      };

      await saveSession(nuevaSesion);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error de Autenticación', 'No se pudo iniciar sesión. Verifique sus credenciales.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>EPMAPS</Text>
          <Text style={styles.subtitle}>Registro de Lecturas en Campo</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Usuario / Código de Técnico</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. tec_quito01"
            placeholderTextColor="#8C9BA5"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Clave de Acceso</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#8C9BA5"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    height: 58,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  button: {
    height: 60,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
