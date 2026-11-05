import { Ionicons } from '@expo/vector-icons';
import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TallerColors, FontFamily, cardShadow } from '@/constants/taller-colors';

const DEFAULT_CENTER = { latitude: -0.1807, longitude: -78.4678 };

/**
 * Fallback web del mapa. `react-native-webview` y `expo-location` no están
 * disponibles en el navegador, así que se usa el visor público de
 * OpenStreetMap y la geolocalización estándar del navegador.
 */
export default function MeterLocationMap({
  initialPosition = null,
  onLocationChange,
  readOnly = false,
  height = 300,
  title = 'Ubicación del medidor',
}) {
  const [mode, setMode] = useState(readOnly ? 'static' : 'gps');
  const [position, setPosition] = useState(initialPosition);
  const callbackRef = useRef(onLocationChange);

  useEffect(() => {
    callbackRef.current = onLocationChange;
  }, [onLocationChange]);

  const locate = useCallback(() => {
    if (readOnly || typeof navigator === 'undefined' || !navigator.geolocation) return;

    setMode('gps');
    navigator.geolocation.getCurrentPosition(
      (result) => {
        const nextPosition = {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
        };
        setPosition(nextPosition);
        callbackRef.current?.({ ...nextPosition, isManualLocation: false });
      },
      () => setMode('manual'),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, [readOnly]);

  useEffect(() => {
    if (readOnly) return undefined;

    // Se difiere la solicitud para no actualizar estado dentro del cuerpo del efecto.
    const timer = setTimeout(() => locate(), 0);
    return () => clearTimeout(timer);
  }, [locate, readOnly]);

  const center = position || initialPosition || DEFAULT_CENTER;
  const delta = 0.005;
  const bbox = [
    center.longitude - delta,
    center.latitude - delta,
    center.longitude + delta,
    center.latitude + delta,
  ].join('%2C');
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.latitude}%2C${center.longitude}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {readOnly ? 'Coordenadas grabadas de la lectura' : 'Vista web del punto seleccionado'}
          </Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="location" size={13} color={TallerColors.brand} />
          <Text style={styles.badgeText}>{readOnly ? 'Guardada' : 'GPS'}</Text>
        </View>
      </View>

      {!readOnly ? (
        <View style={styles.toggle}>
          <Pressable
            onPress={locate}
            style={[styles.toggleButton, mode === 'gps' && styles.toggleButtonActive]}
          >
            <Text style={[styles.toggleText, mode === 'gps' && styles.toggleTextActive]}>
              GPS automático
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('manual')}
            style={[styles.toggleButton, mode === 'manual' && styles.toggleButtonActive]}
          >
            <Text style={[styles.toggleText, mode === 'manual' && styles.toggleTextActive]}>
              Marcador manual
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.mapContainer, { height }]}>
        {/*
          En web se usa un iframe de OpenStreetMap. El mapa editable con
          Leaflet se implementa en la versión nativa (MeterLocationMap.jsx).
        */}
        {createElement('iframe', {
          title: 'Mapa de ubicación',
          src: mapUrl,
          style: { border: 0, width: '100%', height: '100%' },
          loading: 'lazy',
        })}
      </View>

      <View style={styles.coordinatesRow}>
        <Ionicons name="pin-outline" size={16} color={TallerColors.textSecondary} />
        <Text style={styles.coordinatesText}>
          Lat {Number(center.latitude).toFixed(6)} · Lng {Number(center.longitude).toFixed(6)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: TallerColors.surface,
    borderRadius: 16,
    padding: 16,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  headerText: { flex: 1 },
  title: {
    color: TallerColors.textPrimary,
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: TallerColors.textSecondary,
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: TallerColors.softBrand,
  },
  badgeText: {
    color: TallerColors.brand,
    fontSize: 11,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  toggle: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: TallerColors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  toggleButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  toggleButtonActive: {
    backgroundColor: TallerColors.brand,
  },
  toggleText: {
    color: TallerColors.textSecondary,
    fontSize: 12.5,
    fontFamily: FontFamily.semibold,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: TallerColors.border,
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: TallerColors.border,
  },
  coordinatesText: {
    flex: 1,
    color: TallerColors.textSecondary,
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
  },
});
