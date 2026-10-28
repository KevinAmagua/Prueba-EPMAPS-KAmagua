import { CameraModal } from '@/components/CameraModal';
import { Colors } from '@/constants/Colors';
import { useMeterForm } from '@/hooks/useMeterForm';
import { api } from '@/services/api';
import { enqueuePendingReading } from '@/services/syncQueue';
import { EstadoMedidor, Medidor, PendingSyncItem } from '@/types/medidor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const MEDIDORES_CACHE_KEY = '@medidores_cache';

/** Formulario de captura de lectura asociado al código recibido en la ruta. */
export default function CaptureScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const [medidor, setMedidor] = useState<Medidor | null>(null);
  const { formState, updateField, clearDraft, hasDraft } = useMeterForm(codigo || '');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [confirmedAnomaly, setConfirmedAnomaly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadMedidorDetails();
  }, [codigo]);

  /**
   * Resuelve primero el medidor desde la caché, después consulta la API y,
   * si ambas fuentes fallan, crea el respaldo local de emergencia existente.
   */
  const loadMedidorDetails = async () => {
    try {
      const cacheJson = await AsyncStorage.getItem(MEDIDORES_CACHE_KEY);
      if (cacheJson) {
        const medidores: Medidor[] = JSON.parse(cacheJson);
        const found = medidores.find((m) => m.codigo === codigo);
        if (found) {
          setMedidor(found);
          return;
        }
      }

      // Si no está en caché, intentar buscarlo en el API
      try {
        const response = await api.get<Medidor[]>('/medidores', { params: { codigo } });
        if (response.data && response.data.length > 0) {
          setMedidor(response.data[0]);
          return;
        }
      } catch (apiError) {
        console.warn('[CaptureScreen] No se pudo conectar al API para cargar el medidor, usando respaldo local:', apiError);
      }

      // Respaldo de emergencia si no hay caché ni red para que nunca falle
      setMedidor({
        id: `med-${codigo}`,
        codigo: codigo || 'MED-000001',
        cuentaContrato: 'CT-999999',
        titular: 'Titular de Campo',
        direccion: 'Ubicación registrada en ruta',
        parroquia: 'Quito',
        lecturaAnterior: 100.0,
        fechaLecturaAnterior: new Date().toISOString(),
        activo: true,
      });
    } catch (error) {
      console.error('[CaptureScreen] Error cargando detalles del medidor:', error);
    }
  };

  const lecturaNum = parseFloat(formState.lecturaActual) || 0;
  const lecturaAnt = medidor?.lecturaAnterior || 0;
  // El consumo mostrado no puede ser negativo; la anomalía compara la
  // lectura actual con tres veces la lectura anterior.
  const consumoCalculado = lecturaNum >= lecturaAnt ? lecturaNum - lecturaAnt : 0;
  const esAnomalo = lecturaAnt > 0 && lecturaNum > lecturaAnt * 3;

  // En esta implementación, la evidencia es obligatoria para anomalía o daño.
  const fotoObligatoria = esAnomalo || formState.estado === 'dañado';

  /**
   * Valida los campos según el estado, solicita confirmación para anomalías
   * y guarda la lectura en la cola local antes de ofrecer navegación.
   */
  const handleSave = async () => {
    if (saving) return;
    setSaveError(null);

    if (!medidor) {
      const message = 'No se pudo identificar el medidor. Vuelve a buscarlo antes de guardar.';
      setSaveError(message);
      Alert.alert('No se pudo guardar', message);
      return;
    }

    // Validaciones R5
    if (formState.estado === 'normal') {
      if (!formState.lecturaActual.trim() || isNaN(lecturaNum)) {
        Alert.alert('Lectura requerida', 'Debe ingresar una lectura válida para el estado normal.');
        return;
      }
      if (lecturaNum < lecturaAnt) {
        Alert.alert('Lectura inválida', 'La lectura actual no puede ser menor que la lectura anterior.');
        return;
      }
    } else if (formState.estado === 'inaccesible') {
      if (!formState.observacion.trim()) {
        Alert.alert('Motivo requerido', 'Debe registrar la justificación por la cual el medidor está inaccesible.');
        return;
      }
    } else if (formState.estado === 'dañado') {
      if (!formState.observacion.trim()) {
        Alert.alert('Descripción requerida', 'Debe describir el daño observado en el medidor.');
        return;
      }
    }

    // Validación R6 (consumo anómalo requiere confirmación)
    if (esAnomalo && !confirmedAnomaly) {
      Alert.alert(
        'Consumo Anómalo Detectado',
        `El consumo calculado (${consumoCalculado} m³) supera 3 veces el promedio anterior. Por favor confirme el valor ingresado.`,
        [
          { text: 'Revisar', style: 'cancel' },
          { text: 'Confirmar Anomalía', onPress: () => setConfirmedAnomaly(true) },
        ]
      );
      return;
    }

    // Validación R7 (foto obligatoria)
    if (fotoObligatoria && !formState.fotoUri) {
      Alert.alert('Evidencia Requerida', 'Este registro exige una fotografía de respaldo obligatoria.');
      setCameraVisible(true);
      return;
    }

    // Validación R10: No registrar dos veces el mismo medidor en el mismo mes (local y servidor)
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const queueJson = await AsyncStorage.getItem('@sync_queue');
      if (queueJson) {
        const queue: PendingSyncItem[] = JSON.parse(queueJson);
        const yaRegistradoLocal = queue.some((item) => {
          if (item.lectura.codigoMedidor === medidor.codigo) {
            const itemDate = new Date(item.lectura.fechaLectura);
            return itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth;
          }
          return false;
        });

        if (yaRegistradoLocal) {
          Alert.alert(
            'Registro duplicado',
            'Ya existe una lectura registrada para este medidor en el presente mes (en la cola local). No se permite registrar dos veces el mismo medidor en el mismo mes.'
          );
          return;
        }
      }

      try {
        const response = await api.get('/lecturas', { params: { codigoMedidor: medidor.codigo } });
        if (response.data && Array.isArray(response.data)) {
          const yaRegistradoServer = response.data.some((l: any) => {
            if (l.codigoMedidor === medidor.codigo || l.medidorId === medidor.id) {
              const lDate = new Date(l.fechaLectura);
              return lDate.getFullYear() === currentYear && lDate.getMonth() === currentMonth;
            }
            return false;
          });

          if (yaRegistradoServer) {
            Alert.alert(
              'Registro duplicado en servidor',
              'Ya existe una lectura registrada para este medidor en el presente mes en el sistema central. No se permite registrar dos veces el mismo medidor en el mismo mes.'
            );
            return;
          }
        }
      } catch (apiCheckError) {
        console.warn('[CaptureScreen] No se pudo verificar duplicados en el servidor, continuando con validación local.', apiCheckError);
      }
    } catch (error) {
      console.warn('[CaptureScreen] Error al verificar duplicados en el mes:', error);
    }

    setSaving(true);
    try {
      await enqueuePendingReading({
        medidorId: medidor.id,
        codigoMedidor: medidor.codigo,
        lecturaActual: formState.estado === 'inaccesible' ? lecturaAnt : lecturaNum,
        consumoEstimado: formState.estado === 'inaccesible' ? 0 : consumoCalculado,
        fechaLectura: new Date().toISOString(),
        estado: esAnomalo ? 'dañado' : formState.estado,
        observacion: formState.observacion,
      }, formState.fotoUri || undefined);

      await clearDraft();
      Alert.alert(
        '¡Lectura registrada con éxito!',
        'Su lectura se ha guardado correctamente en el dispositivo. Si el dispositivo está sin conexión, se sincronizará automáticamente con el sistema cuando haya conexión',
        [
          { text: 'Ver lecturas', onPress: () => router.replace('/(tabs)/pending') },
          { text: 'Registrar otra', style: 'cancel' },
        ]
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error inesperado al guardar la lectura.';
      const message = `No se guardó la lectura. ${detail}`;
      setSaveError(message);
      Alert.alert('No se pudo guardar', `La lectura no quedó guardada en el dispositivo.\n\n${detail}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {hasDraft && (
        <View style={styles.draftBanner}>
          <Text style={styles.draftText}>📝 Se restauró un borrador previo sin enviar.</Text>
        </View>
      )}

      {medidor && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medidor: {medidor.codigo}</Text>
          <Text style={styles.cardText}>Titular: {medidor.titular}</Text>
          <Text style={styles.cardText}>Dirección: {medidor.direccion}</Text>
          <Text style={styles.cardText}>Lectura Anterior: {medidor.lecturaAnterior} m³</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Estado del Medidor</Text>
        <View style={styles.statusRow}>
          {(['normal', 'inaccesible', 'dañado'] as EstadoMedidor[]).map((st) => (
            <TouchableOpacity
              key={st}
              style={[
                styles.statusButton,
                formState.estado === st && styles.statusButtonSelected,
              ]}
              onPress={() => updateField('estado', st)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  formState.estado === st && styles.statusButtonTextSelected,
                ]}
              >
                {st.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {formState.estado !== 'inaccesible' && (
          <>
            <Text style={styles.label}>Lectura Actual (m³)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              placeholderTextColor="#8C9BA5"
              keyboardType="numeric"
              value={formState.lecturaActual}
              onChangeText={(val) => updateField('lecturaActual', val)}
            />
            <Text style={styles.calcText}>Consumo estimado: {consumoCalculado.toFixed(1)} m³</Text>
          </>
        )}

        {esAnomalo && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ ALERTA DE CONSUMO ANÓMALO</Text>
            <Text style={styles.warningText}>El consumo excede 3x la lectura anterior.</Text>
          </View>
        )}

        {(formState.estado === 'inaccesible' || formState.estado === 'dañado' || esAnomalo) && (
          <>
            <Text style={styles.label}>
              {formState.estado === 'inaccesible' ? 'Motivo de Inaccesibilidad *' : 'Descripción del Daño / Observación *'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ingrese el detalle aquí..."
              placeholderTextColor="#8C9BA5"
              multiline
              value={formState.observacion}
              onChangeText={(val) => updateField('observacion', val)}
            />
          </>
        )}

        <Text style={styles.label}>
          Evidencia Fotográfica {fotoObligatoria ? '(OBLIGATORIA)' : '(Opcional)'}
        </Text>
        <TouchableOpacity
          style={styles.photoButton}
          onPress={() => setCameraVisible(true)}
          disabled={saving}
        >
          <Text style={styles.photoButtonText}>
            {formState.fotoUri ? '📷 Cambiar Fotografía' : '📸 Tomar Fotografía'}
          </Text>
        </TouchableOpacity>

        {formState.fotoUri && (
          <>
            <Image source={{ uri: formState.fotoUri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => updateField('fotoUri', null)}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Quitar fotografía"
            >
              <Text style={styles.removePhotoButtonText}>Quitar fotografía</Text>
            </TouchableOpacity>
          </>
        )}

        {fotoObligatoria && !formState.fotoUri && (
          <Text style={styles.requiredPhotoText}>
            La fotografía es obligatoria para guardar este registro.
          </Text>
        )}

        {saveError && (
          <View style={styles.saveErrorBox} accessibilityRole="alert">
            <Text style={styles.saveErrorText}>{saveError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: saving, busy: saving }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Lectura</Text>
          )}
        </TouchableOpacity>
      </View>

      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCapture={(uri) => updateField('fotoUri', uri)}
        isMandatory={fotoObligatoria}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.background,
    flexGrow: 1,
  },
  draftBanner: {
    backgroundColor: '#FFF9E5',
    borderWidth: 1,
    borderColor: '#E8D891',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  draftText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#1A2530',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  statusButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  statusButtonTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'left',
  },
  calcText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: '#EEF2FA',
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningBox: {
    backgroundColor: '#FCEEEE',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  warningTitle: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 6,
  },
  warningText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  photoButton: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF3FC',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  photoButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  removePhotoButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  removePhotoButtonText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 14,
    resizeMode: 'cover',
  },
  requiredPhotoText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
    lineHeight: 20,
  },
  saveErrorBox: {
    backgroundColor: '#FCEEEE',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  saveErrorText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    minHeight: 60,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
