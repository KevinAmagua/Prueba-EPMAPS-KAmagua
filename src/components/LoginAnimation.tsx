import LottieView from 'lottie-react-native';
import { StyleSheet, View } from 'react-native';

const animation = require('../assets/lottie/login.json');

/** Ilustración Lottie decorativa que acompaña el formulario de inicio de sesión. */
export function LoginAnimation() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Animación de acceso seguro"
      style={styles.container}>
      <LottieView
        source={animation}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 104,
    height: 104,
    alignSelf: 'center',
    marginBottom: 2,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
