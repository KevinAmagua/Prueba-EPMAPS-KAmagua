import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';

import { TallerColors, FontFamily, cardShadow } from '@/constants/taller-colors';

type StatusVariant = 'loading' | 'success';

type Props = {
  visible: boolean;
  variant: StatusVariant;
  title: string;
  message?: string;
  onAnimationFinish?: () => void;
};

/**
 * Fallback web: Lottie nativo no está disponible en el navegador, así que se
 * conserva el mismo flujo visual con indicadores de React Native.
 */
export function StatusAnimation({
  visible,
  variant,
  title,
  message,
  onAnimationFinish,
}: Props) {
  useEffect(() => {
    if (!visible || variant !== 'success') return undefined;

    const timer = setTimeout(() => onAnimationFinish?.(), 1250);
    return () => clearTimeout(timer);
  }, [onAnimationFinish, variant, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay} accessibilityViewIsModal>
        <View style={styles.card}>
          {variant === 'loading' ? (
            <ActivityIndicator size="large" color={TallerColors.brand} />
          ) : (
            <View style={styles.check}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: TallerColors.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    backgroundColor: TallerColors.surface,
    borderRadius: 20,
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 28,
    ...cardShadow,
  },
  check: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TallerColors.softSuccess,
  },
  checkText: {
    color: TallerColors.success,
    fontSize: 44,
    fontWeight: '800',
  },
  title: {
    marginTop: 18,
    color: TallerColors.textPrimary,
    fontSize: 19,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    color: TallerColors.textSecondary,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    textAlign: 'center',
  },
});
