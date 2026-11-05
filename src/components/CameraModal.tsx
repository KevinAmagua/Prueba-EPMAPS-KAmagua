import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '@/constants/Colors';

interface CameraModalProps {
  /** Controla si el modal está abierto. */
  visible: boolean;
  /** Cierra el modal sin modificar la fotografía actual. */
  onClose: () => void;
  /** Entrega al formulario la URI local de la fotografía capturada. */
  onCapture: (photoUri: string) => void;
  /** Indica si el flujo que abrió la cámara requiere evidencia fotográfica. */
  isMandatory?: boolean;
}

/** Presenta la cámara, solicita permiso cuando hace falta y captura evidencia. */
export function CameraModal({ visible, onClose, onCapture, isMandatory = false }: CameraModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [capturing, setCapturing] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
            <Text style={styles.permissionText}>
              EPMAPS requiere acceso a la cámara para adjuntar la evidencia fotográfica obligatoria en este registro (consumo anómalo o medidor dañado).
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
              <Text style={styles.buttonText}>Conceder Permiso</Text>
            </TouchableOpacity>
            {!isMandatory && (
              <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Continuar sin Foto</Text>
              </TouchableOpacity>
            )}
            {isMandatory && (
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  /**
   * Evita capturas concurrentes, toma una imagen y entrega su URI al
   * formulario; el estado de captura se restablece aunque ocurra un error.
   */
  const takePicture = async () => {
    if (cameraRef.current && !capturing) {
      try {
        setCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          skipProcessing: true,
          quality: 0.8,
        });
        if (photo && photo.uri) {
          onCapture(photo.uri);
          onClose();
        }
      } catch (error) {
        console.error('[CameraModal] Error al tomar foto:', error);
      } finally {
        setCapturing(false);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.overlay}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Evidencia Fotográfica EPMAPS</Text>
              {isMandatory && <Text style={styles.badgeMandatory}>OBLIGATORIA</Text>}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.captureButton, capturing && styles.disabledButton]}
                onPress={takePicture}
                disabled={capturing}
              >
                {capturing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.captureInner} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(15,28,48,0.72)',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    marginRight: 8,
  },
  badgeMandatory: {
    backgroundColor: Colors.danger,
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(15,28,48,0.72)',
  },
  closeButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 26,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    minHeight: 56,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    width: '100%',
    minHeight: 52,
    backgroundColor: '#EAEAEA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelButton: {
    width: '100%',
    minHeight: 52,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
