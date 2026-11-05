import { StyleSheet, Text, View } from 'react-native';

import { TallerColors } from '@/constants/taller-colors';

/** Ilustración estática equivalente para web, donde no se carga Lottie nativo. */
export function LoginAnimation() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Acceso seguro"
      style={styles.container}>
      <View style={styles.shield}>
        <Text style={styles.check}>✓</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 104,
    height: 104,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderRadius: 52,
    backgroundColor: TallerColors.softBrand,
  },
  shield: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: TallerColors.brand,
  },
  check: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
});
