import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStyledAlert } from '@/components/StyledAlert';
import { EstadoMedidor } from '@/types/medidor';
import type { CoordenadaGPS } from '@/types/ubicacion';

export interface MeterFormState {
  estado: EstadoMedidor;
  lecturaActual: string;
  observacion: string;
  fotoUri: string | null;
  ubicacion: CoordenadaGPS | null;
  isManualLocation: boolean;
}

/** Evita mezclar borradores de medidores distintos en el almacenamiento. */
const getDraftKey = (codigoMedidor: string) => `@draft_form_${codigoMedidor}`;

function crearEstadoInicial(): MeterFormState {
  return {
    estado: 'normal',
    lecturaActual: '',
    observacion: '',
    fotoUri: null,
    ubicacion: null,
    isManualLocation: false,
  };
}

/** Normaliza borradores creados antes de que existiera el campo de ubicación. */
function normalizarBorrador(parsed: Partial<MeterFormState> | null): MeterFormState {
  const base = crearEstadoInicial();
  if (!parsed) return base;

  return {
    ...base,
    ...parsed,
    estado: parsed.estado ?? 'normal',
    lecturaActual: parsed.lecturaActual ?? '',
    observacion: parsed.observacion ?? '',
    fotoUri: parsed.fotoUri ?? null,
    ubicacion: parsed.ubicacion ?? null,
    isManualLocation: Boolean(parsed.isManualLocation),
  };
}

/**
 * Mantiene el formulario de un medidor y lo persiste como borrador local.
 * Devuelve el estado, los controles de actualización y el estado de carga.
 */
export function useMeterForm(codigoMedidor: string) {
  const showAlert = useStyledAlert();
  const [formState, setFormState] = useState<MeterFormState>(crearEstadoInicial);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [loadingDraft, setLoadingDraft] = useState<boolean>(true);

  /** Restaura del almacenamiento los campos guardados para este medidor o permite descartarlos. */
  const loadDraft = useCallback(async () => {
    try {
      const draftJson = await AsyncStorage.getItem(getDraftKey(codigoMedidor));
      if (draftJson) {
        const parsed = JSON.parse(draftJson) as Partial<MeterFormState> | null;
        if (parsed) {
          const borrador = normalizarBorrador(parsed);
          const hasData =
            borrador.lecturaActual.trim() !== '' ||
            borrador.observacion.trim() !== '' ||
            borrador.fotoUri !== null ||
            borrador.ubicacion !== null ||
            borrador.estado !== 'normal';

          if (hasData) {
            showAlert(
              'Captura pendiente encontrada',
              'Tienes un registro en curso sin guardar para este medidor. ¿Deseas continuar donde te quedaste o descartarlo?',
              [
                {
                  text: 'Descartar',
                  style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.removeItem(getDraftKey(codigoMedidor));
                    setFormState(crearEstadoInicial());
                    setHasDraft(false);
                    setLoadingDraft(false);
                  },
                },
                {
                  text: 'Continuar',
                  onPress: () => {
                    setFormState(borrador);
                    setHasDraft(true);
                    setLoadingDraft(false);
                  },
                },
              ],
              { cancelable: false }
            );
            return;
          }
        }
      }
      setLoadingDraft(false);
    } catch (error) {
      console.error('[useMeterForm] Error al cargar borrador:', error);
      setLoadingDraft(false);
    }
  }, [codigoMedidor, showAlert]);

  /** Serializa y guarda el estado actual bajo la clave específica del medidor. */
  const saveDraft = useCallback(async (state: MeterFormState) => {
    try {
      await AsyncStorage.setItem(getDraftKey(codigoMedidor), JSON.stringify(state));
    } catch (error) {
      console.error('[useMeterForm] Error al guardar borrador:', error);
    }
  }, [codigoMedidor]);

  // Cargar el borrador asociado al medidor cuando cambia el código de ruta.
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDraft();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDraft]);

  // No sobrescribir el borrador guardado hasta terminar la carga inicial o la decisión.
  useEffect(() => {
    if (!codigoMedidor || loadingDraft) return;
    void saveDraft(formState);
  }, [formState, codigoMedidor, loadingDraft, saveDraft]);

  /** Elimina el borrador y restablece el formulario a sus valores iniciales. */
  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(getDraftKey(codigoMedidor));
      setFormState(crearEstadoInicial());
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
