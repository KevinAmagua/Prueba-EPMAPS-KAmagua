import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { FontFamily, TallerColors, cardShadow } from '@/constants/taller-colors';

export type StyledAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
};

type StyledAlertOptions = {
  cancelable?: boolean;
};

type AlertContent = {
  title: string;
  message: string;
  buttons: StyledAlertButton[];
  cancelable: boolean;
};

type StyledAlertContextValue = {
  showAlert: (
    title: string,
    message: string,
    buttons?: StyledAlertButton[],
    options?: StyledAlertOptions,
  ) => void;
};

const StyledAlertContext = createContext<StyledAlertContextValue | null>(null);

export function StyledAlertProvider({ children }: PropsWithChildren) {
  const [alert, setAlert] = useState<AlertContent | null>(null);

  const showAlert = useCallback<StyledAlertContextValue['showAlert']>(
    (title, message, buttons, options) => {
      setAlert({
        title,
        message,
        buttons: buttons?.length ? buttons : [{ text: 'Aceptar' }],
        cancelable: options?.cancelable ?? true,
      });
    },
    [],
  );

  const contextValue = useMemo(() => ({ showAlert }), [showAlert]);

  const closeAlert = useCallback(() => setAlert(null), []);

  const handleButtonPress = useCallback(
    (button: StyledAlertButton) => {
      setAlert(null);
      if (button.onPress) void button.onPress();
    },
    [],
  );

  return (
    <StyledAlertContext.Provider value={contextValue}>
      {children}
      <Modal
        visible={alert !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (alert?.cancelable !== false) closeAlert();
        }}>
        <View style={styles.overlay} accessibilityViewIsModal>
          {alert ? (
            <View style={styles.card}>
              <View
                style={[
                  styles.iconContainer,
                  alert.buttons.some((button) => button.style === 'destructive') &&
                    styles.destructiveIconContainer,
                ]}>
                <Ionicons
                  name={
                    alert.buttons.some((button) => button.style === 'destructive')
                      ? 'alert-circle-outline'
                      : 'information-circle-outline'
                  }
                  size={28}
                  color={
                    alert.buttons.some((button) => button.style === 'destructive')
                      ? Colors.danger
                      : Colors.primary
                  }
                />
              </View>
              <Text style={styles.title}>{alert.title}</Text>
              <Text style={styles.message}>{alert.message}</Text>
              <View style={styles.actions}>
                {alert.buttons.map((button, index) => {
                  const isDestructive = button.style === 'destructive';
                  const isCancel = button.style === 'cancel';

                  return (
                    <Pressable
                      key={`${button.text}-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel={button.text}
                      onPress={() => handleButtonPress(button)}
                      style={({ pressed }) => [
                        styles.button,
                        isDestructive && styles.destructiveButton,
                        isCancel && styles.cancelButton,
                        pressed && styles.buttonPressed,
                      ]}>
                      <Text
                        style={[
                          styles.buttonText,
                          isCancel && styles.cancelButtonText,
                        ]}>
                        {button.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </StyledAlertContext.Provider>
  );
}

export function useStyledAlert() {
  const context = useContext(StyledAlertContext);
  if (!context) {
    throw new Error('useStyledAlert debe usarse dentro de StyledAlertProvider.');
  }
  return context.showAlert;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: TallerColors.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    padding: 24,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    ...cardShadow,
  },
  iconContainer: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: TallerColors.softBrand,
  },
  destructiveIconContainer: {
    backgroundColor: TallerColors.softDanger,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 24,
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  destructiveButton: {
    backgroundColor: Colors.danger,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  buttonText: {
    color: Colors.surface,
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
