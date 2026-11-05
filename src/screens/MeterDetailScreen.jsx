import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { StatusAnimation } from '@/components/StatusAnimation';
import MeterLocationMap from '@/components/MeterLocationMap';
import { TallerColors, FontFamily, cardShadow } from '@/constants/taller-colors';
import { obtenerLecturaGPS } from '@/services/readings';

function formatFecha(fecha) {
  if (!fecha) return 'No registrada';

  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return String(fecha);

  try {
    return date.toLocaleString('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return date.toISOString();
  }
}

function formatEstado(estado) {
  const etiquetas = {
    normal: 'Normal',
    inaccesible: 'Inaccesible',
    'dañado': 'Dañado',
  };
  return etiquetas[estado] ?? 'Normal';
}

/**
 * Consulta una lectura guardada en MockAPI y la muestra con su ubicación.
 *
 * @param {{
 *   readingId?: string,
 *   initialReading?: import('@/types/lectura-gps').LecturaGPS | null,
 *   onBack?: () => void,
 *   onNewReading?: () => void,
 * }} props
 */
export default function MeterDetailScreen({
  readingId,
  initialReading = null,
  onBack,
  onNewReading,
}) {
  const [reading, setReading] = useState(initialReading);
  const [loading, setLoading] = useState(Boolean(readingId) && !initialReading);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!readingId) {
      return () => {
        cancelled = true;
      };
    }

    obtenerLecturaGPS(readingId)
      .then((result) => {
        if (cancelled) return;

        if (!result) {
          setReading(null);
          setError('No se encontró la lectura solicitada en MockAPI.');
          return;
        }

        setReading(result);
        setError(null);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        console.error('[MeterDetailScreen] Error consultando MockAPI:', fetchError);
        setError('No se pudo consultar la lectura en MockAPI. Revisa tu conexión e inténtalo de nuevo.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [readingId, reloadKey]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  const location = reading?.ubicacion;
  const displayError =
    error ||
    (!reading && !readingId && !initialReading
      ? 'No se recibió el identificador de la lectura.'
      : null);

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="checkmark-done-outline" size={24} color={TallerColors.success} />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="cloud-done-outline" size={13} color={TallerColors.success} />
              <Text style={styles.heroBadgeText}>MockAPI</Text>
            </View>
          </View>

          <Text style={styles.heroLabel}>Lectura registrada</Text>
          <Text style={styles.heroValue}>
            {reading ? `${Number(reading.lecturaActual).toFixed(2)} m³` : '— m³'}
          </Text>
          <Text style={styles.heroMeterId}>
            {reading?.codigoMedidor
              ? `Medidor ${reading.codigoMedidor}`
              : 'Medidor sin identificar'}
          </Text>
        </View>

        {displayError ? (
          <View style={styles.errorCard} accessibilityRole="alert">
            <Ionicons name="cloud-offline-outline" size={24} color={TallerColors.danger} />
            <Text style={styles.errorTitle}>No se pudo cargar el detalle</Text>
            <Text style={styles.errorText}>{displayError}</Text>
            {readingId ? (
              <Pressable
                onPress={retry}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryButtonPressed,
                ]}
              >
                <Ionicons name="refresh-outline" size={17} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {reading ? (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Información de la lectura</Text>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="calendar-outline" size={17} color={TallerColors.brand} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Fecha y hora</Text>
                  <Text style={styles.infoValue}>{formatFecha(reading.fechaLectura)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="pulse-outline" size={17} color={TallerColors.brand} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Estado del medidor</Text>
                  <Text style={styles.infoValue}>{formatEstado(reading.estado)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name={location
                      ? reading.isManualLocation
                        ? 'hand-left-outline'
                        : 'navigate-outline'
                      : 'location-outline'}
                    size={17}
                    color={location
                      ? reading.isManualLocation
                        ? TallerColors.warning
                        : TallerColors.success
                      : TallerColors.textSecondary}
                  />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Origen de la ubicación</Text>
                  <Text style={styles.infoValue}>
                    {location
                      ? reading.isManualLocation
                        ? 'Marcador ajustado manualmente'
                        : 'GPS automático'
                      : 'Sin ubicación registrada'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="pin-outline" size={17} color={TallerColors.brand} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Coordenadas</Text>
                  <Text style={styles.infoValueMono}>
                    {location
                      ? `Lat ${Number(location.latitude).toFixed(6)}\nLng ${Number(location.longitude).toFixed(6)}`
                      : 'Sin coordenadas registradas'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="document-text-outline" size={17} color={TallerColors.brand} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Registro MockAPI</Text>
                  <Text style={styles.infoValueMono} numberOfLines={1}>
                    /lecturas/{reading.id}
                  </Text>
                </View>
              </View>

              {reading.observacion ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="chatbox-ellipses-outline" size={17} color={TallerColors.brand} />
                    </View>
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>Observación</Text>
                      <Text style={styles.infoValue}>{reading.observacion}</Text>
                    </View>
                  </View>
                </>
              ) : null}
            </View>

            {location ? (
              <MeterLocationMap
                readOnly
                title="Ubicación grabada"
                initialPosition={location}
                height={260}
              />
            ) : (
              <View style={styles.noLocationCard}>
                <Ionicons name="location-outline" size={22} color={TallerColors.textSecondary} />
                <Text style={styles.noLocationText}>
                  Esta lectura no tiene coordenadas registradas en MockAPI.
                </Text>
              </View>
            )}

            {reading.fotoUrl ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Evidencia fotográfica</Text>
                <Image source={{ uri: reading.fotoUrl }} style={styles.photo} resizeMode="cover" />
              </View>
            ) : null}
          </>
        ) : null}

        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Ionicons name="arrow-back" size={19} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Volver</Text>
        </Pressable>

        {onNewReading ? (
          <Pressable
            onPress={onNewReading}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
          >
            <Ionicons name="search-outline" size={18} color={TallerColors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Consultar otro medidor</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <StatusAnimation
        visible={loading}
        variant="loading"
        title="Cargando lectura"
        message="Consultando los datos y la ubicación en MockAPI…"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: TallerColors.background,
  },
  container: {
    padding: 18,
    paddingBottom: 36,
    gap: 16,
  },
  heroCard: {
    backgroundColor: TallerColors.brand,
    borderRadius: 18,
    padding: 20,
    shadowColor: TallerColors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroLabel: {
    color: '#BFDBFE',
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroValue: {
    marginTop: 5,
    color: '#FFFFFF',
    fontSize: 38,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  heroMeterId: {
    marginTop: 8,
    color: '#DBEAFE',
    fontSize: 14,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
  },
  card: {
    backgroundColor: TallerColors.surface,
    borderRadius: 16,
    padding: 18,
    ...cardShadow,
  },
  sectionTitle: {
    color: TallerColors.textPrimary,
    fontSize: 17,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TallerColors.background,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    color: TallerColors.textSecondary,
    fontSize: 11.5,
    fontFamily: FontFamily.semibold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    marginTop: 4,
    color: TallerColors.textPrimary,
    fontSize: 14.5,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    lineHeight: 21,
  },
  infoValueMono: {
    marginTop: 4,
    color: TallerColors.textPrimary,
    fontSize: 13.5,
    fontFamily: FontFamily.medium,
    lineHeight: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: TallerColors.border,
  },
  noLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: TallerColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TallerColors.border,
    padding: 16,
  },
  noLocationText: {
    flex: 1,
    color: TallerColors.textSecondary,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 19,
    fontWeight: '600',
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: TallerColors.background,
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: TallerColors.softDanger,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 20,
  },
  errorTitle: {
    marginTop: 10,
    color: TallerColors.danger,
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 6,
    color: TallerColors.danger,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 19,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 14,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    backgroundColor: TallerColors.danger,
    paddingHorizontal: 18,
  },
  retryButtonPressed: {
    opacity: 0.88,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 14,
    backgroundColor: TallerColors.brand,
    shadowColor: TallerColors.brand,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TallerColors.border,
    backgroundColor: TallerColors.surface,
  },
  secondaryButtonPressed: {
    backgroundColor: TallerColors.background,
  },
  secondaryButtonText: {
    color: TallerColors.textPrimary,
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    fontWeight: '700',
  },
});
