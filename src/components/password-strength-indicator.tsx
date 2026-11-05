import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';

type NivelSeguridad = 'debil' | 'media' | 'fuerte';

type PasswordStrengthIndicatorProps = {
  password: string;
};

const niveles: Record<NivelSeguridad, { etiqueta: string; color: string; segmentos: number }> = {
  debil: { etiqueta: 'Débil', color: Colors.danger, segmentos: 1 },
  media: { etiqueta: 'Media', color: '#8A6D00', segmentos: 2 },
  fuerte: { etiqueta: 'Fuerte', color: Colors.success, segmentos: 3 },
};

function evaluarSeguridad(password: string): NivelSeguridad {
  const grupos = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z\d]/.test(password),
  ].filter(Boolean).length;

  if (password.length >= 12 && grupos >= 3) {
    return 'fuerte';
  }
  if (password.length >= 8 && grupos >= 2) {
    return 'media';
  }
  return 'debil';
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) {
    return null;
  }

  const nivel = niveles[evaluarSeguridad(password)];

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Seguridad de la contraseña: ${nivel.etiqueta}`}
      style={styles.container}>
      <View style={styles.barra}>
        {[0, 1, 2].map((segmento) => (
          <View
            key={segmento}
            style={[
              styles.segmento,
              segmento < nivel.segmentos && { backgroundColor: nivel.color },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.etiqueta, { color: nivel.color }]}>
        Contraseña {nivel.etiqueta.toLowerCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  barra: {
    flexDirection: 'row',
    gap: 5,
  },
  segmento: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
  },
});
