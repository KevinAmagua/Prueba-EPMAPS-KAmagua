import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Colors } from '@/constants/Colors';

/**
 * Indicador global permanente de conectividad y lecturas pendientes.
 * Siempre visible en todas las pantallas.
 */
export function OfflineBanner() {
  const { isConnected, pendingCount } = useNetworkStatus();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isConnected ? Colors.success : Colors.danger,
        },
      ]}
    >
      <Ionicons
        name={isConnected ? (pendingCount > 0 ? 'cloud-upload-outline' : 'cloud-done-outline') : 'cloud-offline-outline'}
        size={18}
        color="#FFFFFF"
        style={styles.icon}
      />
      <Text style={styles.text}>
        {isConnected ? 'En línea' : 'Sin conexión'}
        {pendingCount > 0
          ? ` • ${pendingCount} pendiente(s) por sincronizar`
          : ' • Al día'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 40,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.22)',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'left',
    lineHeight: 20,
    flexShrink: 1,
  },
});
