import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import MeterDetailScreen from '@/screens/MeterDetailScreen';
import { LecturaGPS } from '@/types/lectura-gps';

/**
 * Ruta de consulta. Normalmente recibe `id` (registro de MockAPI), pero
 * también admite coordenadas por parámetros para previsualizaciones.
 */
export default function LecturaDetalleRoute() {
  const params = useLocalSearchParams<{
    id?: string;
    meterId?: string;
    readingValue?: string;
    latitude?: string;
    longitude?: string;
    isManualLocation?: string;
    timestamp?: string;
  }>();

  const readingId = typeof params.id === 'string' ? params.id : undefined;
  const meterId = typeof params.meterId === 'string' ? params.meterId : '';
  const readingValue = typeof params.readingValue === 'string' ? params.readingValue : '';
  const latitude = typeof params.latitude === 'string' ? params.latitude : '';
  const longitude = typeof params.longitude === 'string' ? params.longitude : '';
  const isManualLocation =
    typeof params.isManualLocation === 'string' ? params.isManualLocation : 'false';
  const timestamp = typeof params.timestamp === 'string' ? params.timestamp : '';

  const initialReading = useMemo<LecturaGPS | null>(() => {
    if (readingId) return null;

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    if (
      !Number.isFinite(parsedLatitude) ||
      !Number.isFinite(parsedLongitude) ||
      !meterId
    ) {
      return null;
    }

    return {
      id: 'preview',
      medidorId: '',
      codigoMedidor: meterId,
      lecturaActual: Number(readingValue) || 0,
      fechaLectura: timestamp || new Date().toISOString(),
      estado: 'normal',
      ubicacion: {
        latitude: parsedLatitude,
        longitude: parsedLongitude,
      },
      isManualLocation: isManualLocation === 'true',
    };
  }, [isManualLocation, latitude, longitude, meterId, readingId, readingValue, timestamp]);

  return (
    <MeterDetailScreen
      key={readingId ?? 'preview'}
      readingId={readingId}
      initialReading={initialReading}
      onBack={() => router.back()}
      onNewReading={() => router.replace('/(tabs)')}
    />
  );
}
