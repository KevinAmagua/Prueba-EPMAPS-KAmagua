import { BigShoulders_700Bold } from '@expo-google-fonts/big-shoulders';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { useEffect, useState, type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedBrandMark } from '@/components/animated-icon';
import { Colors } from '@/constants/Colors';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  shakeKey?: number;
  compactOnKeyboard?: boolean;
}>;

export function AuthScreen({
  title,
  subtitle,
  shakeKey = 0,
  compactOnKeyboard = false,
  children,
}: AuthScreenProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [, fontError] = useFonts({
    BigShoulders_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const shake = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.get() }],
  }));

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (shakeKey > 0) {
      shake.set(
        withSequence(
          withTiming(-12, { duration: 55 }),
          withTiming(12, { duration: 55 }),
          withTiming(-8, { duration: 45 }),
          withTiming(8, { duration: 45 }),
          withTiming(0, { duration: 60 }),
        ),
      );
    }
  }, [shake, shakeKey]);

  if (fontError) {
    throw fontError;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={[
            styles.scrollContent,
            compactOnKeyboard && keyboardVisible && styles.scrollContentWithKeyboard,
          ]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.springify().damping(14).stiffness(120)}>
            <Animated.View
              style={[
                styles.card,
                compactOnKeyboard && keyboardVisible && styles.cardWithKeyboard,
                animatedStyle,
              ]}>
              {!(compactOnKeyboard && keyboardVisible) ? (
                <>
                  <AnimatedBrandMark />
                  <Text style={styles.brand}>EPMAPS</Text>
                </>
              ) : null}
              <Text style={styles.title}>{title}</Text>
              {!(compactOnKeyboard && keyboardVisible) ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
              ) : null}
              <View
                style={[
                  styles.form,
                  compactOnKeyboard && keyboardVisible && styles.formWithKeyboard,
                ]}>
                {children}
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type AuthInputProps = TextInputProps & {
  label: string;
};

export function AuthInput({ label, ...inputProps }: AuthInputProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { secureTextEntry, onFocus, onBlur, ...textInputProps } = inputProps;
  const focus = useSharedValue(0);
  const focusStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.get(), [0, 1], [Colors.border, Colors.primary]),
    borderWidth: 1 + focus.get(),
    transform: [{ scale: 1 + focus.get() * 0.015 }],
  }));
  const input = (
    <TextInput
      accessibilityLabel={label}
      autoCorrect={false}
      placeholderTextColor={Colors.textSecondary}
      selectionColor={Colors.primary}
      {...textInputProps}
      onFocus={(event) => {
        focus.set(withTiming(1, { duration: 180 }));
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focus.set(withTiming(0, { duration: 180 }));
        onBlur?.(event);
      }}
      secureTextEntry={secureTextEntry ? !passwordVisible : undefined}
      style={[
        styles.input,
        secureTextEntry && styles.secureInput,
        textInputProps.style,
      ]}
    />
  );

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        style={[
          secureTextEntry ? styles.secureInputContainer : styles.inputContainer,
          focusStyle,
        ]}>
        {input}
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            accessibilityState={{ selected: passwordVisible }}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.passwordToggle}>
            <Text style={styles.passwordToggleText}>
              {passwordVisible ? 'Ocultar' : 'Mostrar'}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  secondary?: boolean;
  disabled?: boolean;
};

export function AuthButton({
  label,
  onPress,
  loading = false,
  secondary = false,
  disabled = false,
}: AuthButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() => {
          scale.set(withSpring(0.93, { damping: 12, stiffness: 280 }));
        }}
        onPressOut={() => {
          scale.set(
            withSequence(
              withSpring(1.06, { damping: 8, stiffness: 260 }),
              withSpring(1, { damping: 12, stiffness: 240 }),
            ),
          );
        }}
        style={({ pressed }) => [
          styles.button,
          secondary && styles.secondaryButton,
          pressed && !disabled && !loading && styles.pressed,
          (disabled || loading) && styles.disabled,
        ]}>
        {loading ? (
          <ActivityIndicator color={secondary ? Colors.primary : '#FFFFFF'} />
        ) : (
          <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function AuthFeedback({ children, success = false }: PropsWithChildren<{ success?: boolean }>) {
  return (
    <Animated.View entering={FadeInDown.duration(220)}>
      <Text
        accessibilityRole="alert"
        style={[styles.feedback, success ? styles.successText : styles.errorText]}>
        {children}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  scrollContentWithKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardWithKeyboard: {
    padding: 16,
  },
  brand: {
    marginTop: 6,
    color: Colors.primary,
    fontSize: 28,
    fontFamily: 'BigShoulders_700Bold',
    letterSpacing: 1.4,
  },
  title: {
    alignSelf: 'stretch',
    marginTop: 8,
    color: Colors.textPrimary,
    fontSize: 27,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  subtitle: {
    alignSelf: 'stretch',
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 22,
  },
  form: {
    width: '100%',
    gap: 16,
    marginTop: 26,
  },
  formWithKeyboard: {
    marginTop: 12,
    gap: 12,
  },
  inputGroup: {
    gap: 7,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  inputContainer: {
    minHeight: 50,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    backgroundColor: Colors.surface,
  },
  secureInputContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    backgroundColor: Colors.surface,
  },
  secureInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  passwordToggle: {
    minWidth: 68,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  passwordToggleText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.55,
  },
  feedback: {
    alignSelf: 'stretch',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 20,
  },
  errorText: {
    color: Colors.danger,
  },
  successText: {
    color: Colors.success,
  },
});
