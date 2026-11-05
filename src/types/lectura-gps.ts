import type { EstadoMedidor } from './medidor';
import type { CoordenadaGPS } from './ubicacion';

export type { CoordenadaGPS } from './ubicacion';

/**
 * Lectura normalizada a partir de la respuesta de MockAPI (`/lecturas`).
 *
 * MockAPI conserva los nombres de campo en español usados por el resto del
 * proyecto; la aplicación transforma `ubicacion` a coordenadas estándar para
 * que los mapas no dependan del formato almacenado.
 */
export interface LecturaGPS {
  id: string;
  /** ID interno del medidor en MockAPI (`/medidores/:id`). */
  medidorId: string;
  codigoMedidor: string;
  lecturaActual: number;
  consumoEstimado?: number;
  fechaLectura: string;
  estado: EstadoMedidor;
  observacion?: string;
  fotoUrl?: string;
  /** Identificador generado en el dispositivo para evitar duplicados al sincronizar. */
  localId?: string;
  ubicacion: CoordenadaGPS | null;
  isManualLocation: boolean;
}

/** Datos aceptados por el servicio para crear una lectura en MockAPI. */
export interface NuevaLecturaGPS {
  codigoMedidor: string;
  lecturaActual: number;
  ubicacion?: CoordenadaGPS | null;
  isManualLocation?: boolean;
  medidorId?: string;
  consumoEstimado?: number;
  fechaLectura?: string;
  estado?: EstadoMedidor;
  observacion?: string;
  fotoUrl?: string;
  localId?: string;
}
