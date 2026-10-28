import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EstadoMedidor } from '@/types/medidor';

export interface MeterFormState {
  estado: EstadoMedidor;
  lecturaActual: string;
  observacion: string;
  fotoUri: string | null;
}

/** Evita mezclar borradores de medidores distintos en el almacenamiento. */
const getDraftKey = (codigoMedidor: string) => `@draft_form_${codigoMedidor}`;

/**
 * Mantiene el formulario de un medidor y lo persiste como borrador local.
 * Devuelve el estado, los controles de actualización y el estado de carga.
 */
export function useMeterForm(codigoMedidor: string) {
  const [formState, setFormState] = useState<MeterFormState>({
    estado: 'normal',
    lecturaActual: '',
    observacion: '',
    fotoUri: null,
  });
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [loadingDraft, setLoadingDraft] = useState<boolean>(true);

  // Cargar el borrador asociado al medidor cuando cambia el código de ruta.
  useEffect(() => {
    if (!codigoMedidor) return;
    loadDraft();
  }, [codigoMedidor]);

  // No sobrescribir el borrador guardado hasta terminar la carga inicial;
  // cada cambio posterior se persiste inmediatamente, sin debounce.
  useEffect(() => {
    if (!codigoMedidor || loadingDraft) return;
    saveDraft(formState);
  }, [formState, codigoMedidor, loadingDraft]);

  /** Restaura del almacenamiento los campos guardados para este medidor o permite descartarlos. */
  const loadDraft = async () => {
    try {
      const draftJson = await AsyncStorage.getItem(getDraftKey(codigoMedidor));
      if (draftJson) {
        const parsed = JSON.parse(draftJson) as MeterFormState;
        if (parsed) {
          const hasData = parsed.lecturaActual.trim() !== '' || parsed.observacion.trim() !== '' || parsed.fotoUri !== null || parsed.estado !== 'normal';
          if (hasData) {
            Alert.alert(
              'Captura pendiente encontrada',
              'Tienes un registro en curso sin guardar para este medidor. ¿Deseas continuar donde te quedaste o descartarlo?',
              [
                {
                  text: 'Descartar',
                  style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.removeItem(getDraftKey(codigoMedidor));
                    setFormState({
                      estado: 'normal',
                      lecturaActual: '',
                      observacion: '',
                      fotoUri: null,
                    });
                    setHasDraft(false);
                  },
                },
                {
                  text: 'Continuar',
                  onPress: () => {
                    setFormState(parsed);
                    setHasDraft(true);
                  },
                },
              ],
              { cancelable: false }
            );
          }
        }
      }
    } catch (error) {
      console.error('[useMeterForm] Error al cargar borrador:', error);
    } finally {
      setLoadingDraft(false);
    }
  };

  /** Serializa y guarda el estado actual bajo la clave específica del medidor. */
  const saveDraft = async (state: MeterFormState) => {
    try {
      await AsyncStorage.setItem(getDraftKey(codigoMedidor), JSON.stringify(state));
    } catch (error) {
      console.error('[useMeterForm] Error al guardar borrador:', error);
    }
  };

  /** Elimina el borrador y restablece el formulario a sus valores iniciales. */
  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(getDraftKey(codigoMedidor));
      setFormState({
        estado: 'normal',
        lecturaActual: '',
        observacion: '',
        fotoUri: null,
      });
      setHasDraft(false);
    } catch (error) {
      console.error('[useMeterForm] Error al descartar borrador:', error);
    }
  };

  /** Actualiza un solo campo sin reemplazar el resto del formulario. */
  const updateField = useCallback(<K extends keyof MeterFormState>(key: K, value: MeterFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    formState,
    updateField,
    clearDraft,
    hasDraft,
    loadingDraft,
  };
}
