import React, { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { PendingSyncItem } from '@/types/medidor';
import { processSyncQueue } from '@/services/syncQueue';
import { router, useFocusEffect } from 'expo-router';

const SYNC_QUEUE_KEY = '@sync_queue';

/** Muestra la cola local, sus estados y las acciones disponibles por lectura. */
export default function PendingReadingsScreen() {
  const [pendientes, setPendientes] = useState<PendingSyncItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Lee y convierte la cola persistida para mantener la lista sincronizada
   * con el almacenamiento local.
   */
  const loadPendingReadings = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (data) {
        const queue: PendingSyncItem[] = JSON.parse(data);
        if (Array.isArray(queue)) {
          setPendientes(queue);
        }
      } else {
        setPendientes([]);
      }
    } catch (error) {
      console.error('[PendingScreen] Error cargando pendientes:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPendingReadings();
    }, [loadPendingReadings])
  );

  /**
   * Ejecuta el procesador de cola a petición del usuario y vuelve a cargar
   * los resultados antes de informar que terminó. El aviso de finalización
   * no implica que todos los elementos se hayan sincronizado correctamente.
   */
  const handleManualSync = async () => {
    setRefreshing(true);
    try {
      await processSyncQueue();
      await loadPendingReadings();
      Alert.alert('Sincronización', 'Proceso de sincronización manual completado.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la sincronización manual.');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Abre la captura del medidor pendiente; los elementos ya sincronizados
   * se consideran de solo lectura.
   */
  const handleEdit = (item: PendingSyncItem) => {
    if (item.sincronizado) {
      Alert.alert('Acción No Permitida', 'Esta lectura ya fue enviada al servidor y no puede ser modificada.');
      return;
    }
    router.push(`/capture/${item.lectura.codigoMedidor}`);
  };

  /**
   * Construye la tarjeta de un registro con su estado, lectura, fecha,
   * evidencia y error de sincronización, si existen.
   */
  const renderItem = ({ item }: { item: PendingSyncItem }) => {
    const fecha = new Date(item.creadaEn).toLocaleString();
    const photoSource = item.lectura.fotoUrl || item.fotoLocalUri;

    return (
      <View style={styles.itemCard}>
        <View style={styles.rowHeader}>
          <Text style={styles.itemTitle}>Medidor: {item.lectura.codigoMedidor}</Text>
          <View style={[styles.badge, { backgroundColor: item.sincronizado ? Colors.success : Colors.warning }]}>
            <Text style={[styles.badgeText, !item.sincronizado && styles.pendingBadgeText]}>
              <Ionicons
                name={item.sincronizado ? 'checkmark-circle' : 'time-outline'}
                size={14}
                color={item.sincronizado ? '#FFFFFF' : Colors.textPrimary}
              />{' '}
              {item.sincronizado ? 'Enviada' : 'Pendiente'}
            </Text>
          </View>
        </View>

        <Text style={styles.itemText}>Lectura: {item.lectura.lecturaActual} m³</Text>
        {item.lectura.consumoEstimado !== undefined && (
          <Text style={styles.itemText}>Consumo estimado: {item.lectura.consumoEstimado.toFixed(1)} m³</Text>
        )}
        <Text style={styles.itemText}>Estado: {item.lectura.estado.toUpperCase()}</Text>
        {item.lectura.observacion ? (
          <Text style={styles.itemText}>Obs: {item.lectura.observacion}</Text>
        ) : null}
        <Text style={styles.dateText}>Registrada: {fecha}</Text>

        {photoSource ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoSource }} style={styles.thumbnail} />
            <Text style={styles.photoLabel}>Evidencia fotográfica adjunta</Text>
          </View>
        ) : null}

        {item.ultimoError ? (
          <Text style={styles.syncErrorText}>Error sync: {item.ultimoError}</Text>
        ) : null}

        {!item.sincronizado && (
          <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
            <Text style={styles.editButtonText}>Editar / Corregir</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const totalPendientes = pendientes.filter((i) => !i.sincronizado).length;
  const totalEnviadas = pendientes.filter((i) => i.sincronizado).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Lecturas</Text>
        <Text style={styles.subtitle}>Cola de sincronización y registros locales</Text>

        {/* Resumen Estadístico Extra */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalPendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalEnviadas}</Text>
            <Text style={styles.statLabel}>Enviadas</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.syncButton} onPress={handleManualSync} activeOpacity={0.8}>
          <Text style={styles.syncButtonText}>🔄 Sincronizar Cola Ahora</Text>
        </TouchableOpacity>
      </View>

      {pendientes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay lecturas registradas en la cola local.</Text>
        </View>
      ) : (
        <FlatList
          data={pendientes}
          keyExtractor={(item) => item.localId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleManualSync} tintColor={Colors.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  header: {
    marginBottom: 18,
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#1A2530',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 5,
    marginBottom: 16,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  syncButton: {
    backgroundColor: Colors.primary,
    minHeight: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    elevation: 2,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#1A2530',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    flexShrink: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pendingBadgeText: {
    color: Colors.textPrimary,
  },
  itemText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 12,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  photoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  syncErrorText: {
    color: Colors.danger,
    fontSize: 14,
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: Colors.secondary,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 24,
  },
});
