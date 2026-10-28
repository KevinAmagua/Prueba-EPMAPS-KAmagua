/** Estados admitidos para describir la condición observada del medidor. */
export type EstadoMedidor = 'normal' | 'inaccesible' | 'dañado';

/** Datos identificativos y última lectura conocida de un medidor. */
export interface Medidor {
  id: string;
  codigo: string;
  cuentaContrato: string;
  titular: string;
  direccion: string;
  parroquia: string;
  lecturaAnterior: number;
  fechaLecturaAnterior: string | null;
  /** Coordenadas opcionales de ubicación del medidor. */
  latitud?: number;
  longitud?: number;
  activo: boolean;
}

/** Lectura lista para enviar o guardada en la cola local. */
export interface Lectura {
  id: string;
  medidorId: string;
  codigoMedidor: string;
  lecturaActual: number;
  consumoEstimado?: number;
  fechaLectura: string;
  estado: EstadoMedidor;
  /** Motivo o detalle asociado a un estado no normal, si aplica. */
  observacion?: string;
  /** URL remota o URI local de la evidencia fotográfica asociada. */
  fotoUrl?: string;
}

/** Forma de una lectura antes de que el servidor le asigne un identificador. */
export type NuevaLectura = Omit<Lectura, 'id'>;

/**
 * Envoltorio persistido para sincronizar una lectura local y su evidencia.
 * `sincronizado` indica que el servidor confirmó el envío.
 */
export interface PendingSyncItem {
  /** Identificador creado en el dispositivo y enviado junto a la lectura. */
  localId: string;
  /** Fecha local de creación del elemento de la cola. */
  creadaEn: string;
  /** Cantidad de intentos fallidos registrados para el envío. */
  intentos: number;
  /** Mensaje del último fallo, cuando existe. */
  ultimoError?: string;
  /** El tipo actual representa elementos aún no sincronizados. */
  sincronizado: false;
  /** URI del archivo local pendiente de subir, si hay foto adjunta. */
  fotoLocalUri?: string;
  lectura: NuevaLectura;
}
