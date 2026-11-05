import LottieView from 'lottie-react-native';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { TallerColors, cardShadow } from '@/constants/taller-colors';

type StatusVariant = 'loading' | 'success';

type Props = {
  visible: boolean;
  variant: StatusVariant;
  title: string;
  message?: string;
  onAnimationFinish?: () => void;
};

const animations = {
  loading: require('../assets/lottie/loading.json'),
  success: require('../assets/lottie/success.json'),
} as const;

/**
 * Modal reutilizable para comunicar estados de carga y éxito con Lottie.
 */
export function StatusAnimation({
  visible,
  variant,
  title,
  message,
  onAnimationFinish,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay} accessibilityViewIsModal>
        <View style={styles.card}>
          <LottieView
            key={`${variant}-${visible}`}
            source={animations[variant]}
            autoPlay
            loop={variant === 'loading'}
            speed={1}
            onAnimationFinish={(isCancelled) => {
              if (!isCancelled && variant === 'success') onAnimationFinish?.();
            }}
            style={styles.animation}
          />
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
    paddingTop: 24,
    paddingBottom: 28,
    ...cardShadow,
  },
  animation: {
    width: 132,
    height: 132,
  },
  title: {
    marginTop: 10,
    color: TallerColors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    color: TallerColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
