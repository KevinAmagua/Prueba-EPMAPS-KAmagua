import { StyleSheet } from 'react-native';
import Animated, { BounceIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/Colors';

export function AnimatedBrandMark() {
  return (
    <Animated.View
      accessible
      accessibilityLabel="EPMAPS"
      entering={BounceIn.duration(650)}
      style={styles.mark}>
      <Svg width={52} height={52} viewBox="0 0 48 48">
        <Path
          d="M24 3C18.2 11.6 9 21.3 9 30a15 15 0 0 0 30 0C39 21.3 29.8 11.6 24 3Z"
          fill={Colors.primary}
        />
        <Path
          d="M17 31c.4 4 3.2 6.7 7 7.5"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeWidth={2.5}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
