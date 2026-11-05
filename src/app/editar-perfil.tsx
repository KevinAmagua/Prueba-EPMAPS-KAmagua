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
import { FontFamily, cardShadow } from '@/constants/taller-colors';
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
    borderRadius: 22,
    backgroundColor: Colors.surface,
    ...cardShadow,
  },
  title: {
    color: Colors.primary,
    fontSize: 22,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  label: {
    marginBottom: -8,
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    fontWeight: '600',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: FontFamily.regular,
  },
  error: {
    color: Colors.danger,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    lineHeight: 20,
  },
  saveButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.7,
  },
});
