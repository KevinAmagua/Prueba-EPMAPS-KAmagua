import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useSesion } from '@/context/sesion';
import { obtenerMensajeErrorFirebase } from '@/lib/errores-firebase';

export default function EditarPerfilScreen() {
  const { usuario, actualizarNombre } = useSesion();
  const [nombre, setNombre] = useState(usuario?.displayName ?? '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardarNombre() {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError('Escribe tu nombre para continuar.');
      return;
    }

    setError('');
    setGuardando(true);
    try {
      await actualizarNombre(nombreLimpio);
      router.back();
    } catch (saveError) {
      setError(obtenerMensajeErrorFirebase(saveError));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Editar nombre</Text>
          <Text style={styles.description}>
            Actualiza el nombre que aparece en tu perfil.
          </Text>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            accessibilityLabel="Nombre"
            autoCapitalize="words"
            autoComplete="name"
            maxLength={80}
            onChangeText={setNombre}
            onSubmitEditing={() => {
              void guardarNombre();
            }}
            placeholder="Tu nombre"
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="done"
            value={nombre}
            style={styles.input}
          />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: guardando }}
            disabled={guardando}
            onPress={() => {
              void guardarNombre();
            }}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && !guardando && styles.pressed,
              guardando && styles.disabled,
            ]}>
            {guardando ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.saveButtonText}>Guardar cambios</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    gap: 14,
    padding: 24,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    shadowColor: '#1A2530',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    marginBottom: -8,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  error: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.7,
  },
});
