import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { StatusAnimation } from '@/components/StatusAnimation';
import { TallerColors, cardShadow } from '@/constants/taller-colors';
import { listarLecturasGPS } from '@/services/readings';
import { LecturaGPS } from '@/types/lectura-gps';

function formatFecha(fecha: string | null) {
  if (!fecha) return 'Sin fecha registrada';

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

/**
 * Historial de lecturas guardadas en MockAPI (`/lecturas`).
 * Se reutiliza tanto en la pestaña "Lecturas" como en la ruta de historial.
 */
export default function ReadingsHistoryScreen() {
  const [readings, setReadings] = useState<LecturaGPS[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReadings = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await listarLecturasGPS();
      setReadings(result);
    } catch (loadError) {
      console.error('[ReadingsHistoryScreen] Error listando MockAPI:', loadError);
      setError('No se pudo consultar el historial en MockAPI. Revisa tu conexión.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReadings();
    }, [loadReadings])
  );

  const handleRefresh = useCallback(() => {
    void loadReadings(true);
  }, [loadReadings]);

  const renderItem = ({ item }: { item: LecturaGPS }) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/lectura/[id]',
          params: { id: item.id },
        })
      }
      accessibilityRole="button"
      style={({ pressed }) => [styles.itemCard, pressed && styles.itemCardPressed]}
    >
      <View style={styles.itemTopRow}>
        <View style={styles.itemTitleGroup}>
          <View style={styles.itemIcon}>
            <Ionicons name="speedometer-outline" size={18} color={TallerColors.brand} />
          </View>
          <View style={styles.itemTitleText}>
            <Text style={styles.itemTitle}>
              Medidor {item.codigoMedidor || item.medidorId || 'sin código'}
            </Text>
            <Text style={styles.itemDate}>{formatFecha(item.fechaLectura)}</Text>
          </View>
        </View>
        <Text style={styles.itemValue}>{Number(item.lecturaActual).toFixed(2)} m³</Text>
      </View>

      <View style={styles.itemBottomRow}>
        <View style={styles.coordinates}>
          <Ionicons name="pin-outline" size={14} color={TallerColors.textSecondary} />
          <Text style={styles.coordinatesText}>
            {item.ubicacion
              ? `${item.ubicacion.latitude.toFixed(6)}, ${item.ubicacion.longitude.toFixed(6)}`
              : 'Sin ubicación registrada'}
          </Text>
        </View>
        <View
          style={[
            styles.modeBadge,
            item.isManualLocation && styles.modeBadgeManual,
            !item.ubicacion && styles.modeBadgeMissing,
          ]}
        >
          <Ionicons
            name={
              item.ubicacion
                ? item.isManualLocation
                  ? 'hand-left-outline'
                  : 'navigate-outline'
                : 'location-outline'
            }
            size={12}
            color={
              item.ubicacion
                ? item.isManualLocation
                  ? '#92400E'
                  : TallerColors.success
                : TallerColors.textSecondary
            }
          />
          <Text
            style={[
              styles.modeBadgeText,
              item.isManualLocation && styles.modeBadgeTextManual,
              !item.ubicacion && styles.modeBadgeTextMissing,
            ]}
          >
            {item.ubicacion ? (item.isManualLocation ? 'Manual' : 'GPS') : 'Sin GPS'}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={readings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={TallerColors.brand}
            colors={[TallerColors.brand]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerIcon}>
                <Ionicons name="map-outline" size={25} color={TallerColors.brand} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Lecturas registradas</Text>
                <Text style={styles.subtitle}>
                  Registros guardados en MockAPI (`/lecturas`).
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.newButton,
                pressed && styles.newButtonPressed,
              ]}
            >
              <Ionicons name="search-outline" size={19} color="#FFFFFF" />
              <Text style={styles.newButtonText}>Buscar medidor y registrar</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/pendientes')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.pendingButton,
                pressed && styles.pendingButtonPressed,
              ]}
            >
              <Ionicons name="cloud-upload-outline" size={17} color={TallerColors.brand} />
              <Text style={styles.pendingButtonText}>Ver pendientes de sincronización</Text>
              <Ionicons name="chevron-forward" size={15} color={TallerColors.brand} />
            </Pressable>

            {error ? (
              <View style={styles.errorCard} accessibilityRole="alert">
                <Ionicons name="cloud-offline-outline" size={19} color={TallerColors.danger} />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={handleRefresh} accessibilityRole="button">
                  <Ionicons name="refresh-outline" size={19} color={TallerColors.danger} />
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="map-outline" size={38} color={TallerColors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>Sin lecturas registradas todavía</Text>
              <Text style={styles.emptyText}>
                Busca un medidor y registra su lectura para verla aquí con su ubicación.
              </Text>
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && styles.newButtonPressed,
                ]}
              >
                <Text style={styles.emptyButtonText}>Buscar medidor y registrar</Text>
              </Pressable>
            </View>
          )
        }
      />

      <StatusAnimation
        visible={loading && readings.length === 0}
        variant="loading"
        title="Cargando lecturas"
        message="Consultando las lecturas en MockAPI…"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: TallerColors.background,
  },
  listContent: {
    padding: 18,
    paddingBottom: 36,
    gap: 14,
  },
  header: {
    gap: 14,
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TallerColors.softBrand,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: TallerColors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 3,
    color: TallerColors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  newButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 13,
    backgroundColor: TallerColors.brand,
    shadowColor: TallerColors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 3,
  },
  newButtonPressed: {
    opacity: 0.88,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  pendingButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TallerColors.border,
    backgroundColor: TallerColors.surface,
    paddingHorizontal: 14,
  },
  pendingButtonPressed: {
    backgroundColor: TallerColors.background,
  },
  pendingButtonText: {
    color: TallerColors.brand,
    fontSize: 13,
    fontWeight: '700',
  },
  itemCard: {
    backgroundColor: TallerColors.surface,
    borderRadius: 16,
    padding: 16,
    ...cardShadow,
  },
  itemCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TallerColors.background,
  },
  itemTitleText: {
    flex: 1,
  },
  itemTitle: {
    color: TallerColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  itemDate: {
    marginTop: 3,
    color: TallerColors.textSecondary,
    fontSize: 11.5,
  },
  itemValue: {
    color: TallerColors.brand,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  itemBottomRow: {
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: TallerColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  coordinates: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  coordinatesText: {
    flex: 1,
    color: TallerColors.textSecondary,
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: TallerColors.softSuccess,
  },
  modeBadgeManual: {
    backgroundColor: '#FEF3C7',
  },
  modeBadgeMissing: {
    backgroundColor: TallerColors.background,
  },
  modeBadgeText: {
    color: '#047857',
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modeBadgeTextManual: {
    color: '#92400E',
  },
  modeBadgeTextMissing: {
    color: TallerColors.textSecondary,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: TallerColors.softDanger,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    flex: 1,
    color: TallerColors.danger,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 18,
  },
  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TallerColors.surface,
    ...cardShadow,
  },
  emptyTitle: {
    marginTop: 18,
    color: TallerColors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 7,
    color: TallerColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 18,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: TallerColors.brand,
    paddingHorizontal: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
