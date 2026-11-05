import type { EstadoMedidor, Medidor } from '@/types/medidor';
import type { LecturaGPS, NuevaLecturaGPS } from '@/types/lectura-gps';
import type { CoordenadaGPS, UbicacionAPI } from '@/types/ubicacion';

import { api } from './api';
import { actualizarMedidorEnCache } from './cache';

const MEDIDORES_ENDPOINT = '/medidores';
const LECTURAS_ENDPOINT = '/lecturas';
const ESTADOS_VALIDOS: EstadoMedidor[] = ['normal', 'inaccesible', 'dañado'];

/** Forma flexible de una lectura tal como llega desde MockAPI. */
interface LecturaAPI {
  id?: string | number;
  medidorId?: string | number;
  codigoMedidor?: string;
  lecturaActual?: string | number;
  consumoEstimado?: string | number;
  fechaLectura?: string;
  estado?: string;
  observacion?: string | null;
  fotoUrl?: string | null;
  localId?: string | null;
  ubicacion?: unknown;
  isManualLocation?: boolean;
}

/** Forma flexible de un medidor tal como llega desde MockAPI. */
interface MedidorAPI {
  id?: string | number;
  codigo?: string;
  cuentaContrato?: string;
  titular?: string;
  direccion?: string;
  parroquia?: string;
  lecturaAnterior?: string | number;
  fechaLecturaAnterior?: string | null;
  latitud?: string | number;
  longitud?: string | number;
  activo?: boolean;
}

function esErrorNoEncontrado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { status?: unknown } }).response?.status === 'number' &&
    (error as { response?: { status?: number } }).response?.status === 404
  );
}

/**
 * MockAPI devuelve un arreglo al listar y un objeto cuando la consulta
 * filtrada coincide con un solo registro. Esta función unifica ambos casos.
 */
function aLista<T>(data: T | T[] | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  return data ? [data] : [];
}

function aNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function normalizarEstado(valor: unknown): EstadoMedidor {
  return ESTADOS_VALIDOS.includes(valor as EstadoMedidor)
    ? (valor as EstadoMedidor)
    : 'normal';
}

function normalizarFotoUrl(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const url = valor.trim();
  if (!url) return undefined;
  return /^(https?:\/\/|file:\/\/)/i.test(url) ? url : undefined;
}

/**
 * Acepta la ubicación nueva (`{ latitud, longitud }`) y también valores
 * heredados en texto o con nombres en inglés para no romper registros viejos.
 */
export function normalizarUbicacion(valor: unknown): CoordenadaGPS | null {
  if (valor === null || valor === undefined || valor === '') return null;

  if (Array.isArray(valor) && valor.length >= 2) {
    const latitud = aNumero(valor[0]);
    const longitud = aNumero(valor[1]);
    return latitud !== null && longitud !== null
      ? { latitude: latitud, longitude: longitud }
      : null;
  }

  if (typeof valor === 'string') {
    const texto = valor.trim();
    if (!texto) return null;

    try {
      return normalizarUbicacion(JSON.parse(texto));
    } catch {
      const partes = texto.split(',').map((parte) => aNumero(parte.trim()));
      const latitud = partes[0];
      const longitud = partes[1];
      if (partes.length === 2 && latitud !== null && longitud !== null) {
        return { latitude: latitud, longitude: longitud };
      }
      return null;
    }
  }

  if (typeof valor === 'object') {
    const objeto = valor as Record<string, unknown>;
    const latitud = aNumero(objeto.latitud ?? objeto.latitude ?? objeto.lat);
    const longitud = aNumero(objeto.longitud ?? objeto.longitude ?? objeto.lng ?? objeto.lon);

    if (latitud !== null && longitud !== null) {
      return { latitude: latitud, longitude: longitud };
    }
  }

  return null;
}

function aUbicacionAPI(ubicacion: CoordenadaGPS | null | undefined): UbicacionAPI | null {
  if (!ubicacion) return null;
  return {
    latitud: ubicacion.latitude,
    longitud: ubicacion.longitude,
  };
}

function normalizarMedidor(data: MedidorAPI): Medidor {
  return {
    id: String(data.id ?? ''),
    codigo: String(data.codigo ?? ''),
    cuentaContrato: String(data.cuentaContrato ?? ''),
    titular: String(data.titular ?? ''),
    direccion: String(data.direccion ?? ''),
    parroquia: String(data.parroquia ?? ''),
    lecturaAnterior: aNumero(data.lecturaAnterior) ?? 0,
    fechaLecturaAnterior:
      typeof data.fechaLecturaAnterior === 'string'
        ? data.fechaLecturaAnterior
        : null,
    latitud: aNumero(data.latitud) ?? undefined,
    longitud: aNumero(data.longitud) ?? undefined,
    activo: Boolean(data.activo),
  };
}

function mapLectura(data: LecturaAPI): LecturaGPS {
  return {
    id: String(data.id ?? ''),
    medidorId: String(data.medidorId ?? ''),
    codigoMedidor: String(data.codigoMedidor ?? ''),
    lecturaActual: aNumero(data.lecturaActual) ?? 0,
    consumoEstimado: aNumero(data.consumoEstimado) ?? undefined,
    fechaLectura: typeof data.fechaLectura === 'string' ? data.fechaLectura : '',
    estado: normalizarEstado(data.estado),
    observacion: typeof data.observacion === 'string' ? data.observacion : undefined,
    fotoUrl: normalizarFotoUrl(data.fotoUrl),
    localId: typeof data.localId === 'string' ? data.localId : undefined,
    ubicacion: normalizarUbicacion(data.ubicacion),
    isManualLocation: Boolean(data.isManualLocation),
  };
}

function fechaParaOrdenar(fechaLectura: string): number {
  const timestamp = Date.parse(fechaLectura);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

/** Genera un identificador local único para reintentos idempotentes. */
export function generarLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Busca un medidor por su ID interno de MockAPI. */
export async function obtenerMedidorPorId(id: string): Promise<Medidor | null> {
  try {
    const response = await api.get<MedidorAPI>(`${MEDIDORES_ENDPOINT}/${id}`);
    return normalizarMedidor(response.data);
  } catch (error) {
    if (esErrorNoEncontrado(error)) return null;
    throw error;
  }
}

/** Busca un medidor por su código visible (`MED-XXXXXX`). */
export async function buscarMedidorPorCodigo(codigo: string): Promise<Medidor | null> {
  const codigoNormalizado = codigo.trim().toUpperCase();

  try {
    const response = await api.get<MedidorAPI | MedidorAPI[]>(MEDIDORES_ENDPOINT, {
      params: { codigo: codigoNormalizado },
    });

    const medidores = aLista(response.data);
    const encontrado = medidores.find(
      (medidor) => String(medidor.codigo ?? '').toUpperCase() === codigoNormalizado
    );

    return encontrado ? normalizarMedidor(encontrado) : null;
  } catch (error) {
    // MockAPI responde 404 cuando el filtro no encuentra coincidencias.
    if (esErrorNoEncontrado(error)) return null;
    throw error;
  }
}

/** Obtiene una lectura por su ID de MockAPI. */
export async function obtenerLecturaGPS(id: string): Promise<LecturaGPS | null> {
  try {
    const response = await api.get<LecturaAPI>(`${LECTURAS_ENDPOINT}/${id}`);
    return mapLectura(response.data);
  } catch (error) {
    if (esErrorNoEncontrado(error)) return null;
    throw error;
  }
}

/** Busca una lectura local ya enviada, usando `localId` como clave idempotente. */
export async function buscarLecturaPorLocalId(localId: string): Promise<LecturaGPS | null> {
  try {
    const response = await api.get<LecturaAPI | LecturaAPI[]>(LECTURAS_ENDPOINT, {
      params: { localId },
    });

    const lecturas = aLista(response.data);
    const encontrada = lecturas.find((lectura) => lectura.localId === localId);
    return encontrada ? mapLectura(encontrada) : null;
  } catch (error) {
    // MockAPI responde 404 cuando el filtro no encuentra coincidencias.
    if (esErrorNoEncontrado(error)) return null;
    throw error;
  }
}

/** Lista las lecturas de MockAPI, de la más reciente a la más antigua. */
export async function listarLecturasGPS(maximo = 100): Promise<LecturaGPS[]> {
  const response = await api.get<LecturaAPI | LecturaAPI[]>(LECTURAS_ENDPOINT);
  const lecturas = aLista(response.data);

  return lecturas
    .map(mapLectura)
    .sort((a, b) => fechaParaOrdenar(b.fechaLectura) - fechaParaOrdenar(a.fechaLectura))
    .slice(0, maximo);
}

/**
 * Actualiza una lectura existente en MockAPI. Se conserva el registro completo
 * porque `PUT` reemplaza el objeto y no debe perder campos no enviados.
 */
export async function actualizarLecturaGPS(
  id: string,
  cambios: Partial<Omit<LecturaGPS, 'id'>>
): Promise<LecturaGPS> {
  const actualResponse = await api.get<LecturaAPI>(`${LECTURAS_ENDPOINT}/${id}`);
  const payload: Record<string, unknown> = {
    ...actualResponse.data,
    ...cambios,
  };

  if (cambios.ubicacion !== undefined) {
    payload.ubicacion = aUbicacionAPI(cambios.ubicacion);
  }

  const response = await api.put<LecturaAPI>(`${LECTURAS_ENDPOINT}/${id}`, payload);
  return mapLectura(response.data);
}

/**
 * Actualiza la lectura anterior del medidor en MockAPI y refresca la caché
 * local. Es el paso que mantiene sincronizados `/medidores` y `/lecturas`.
 */
async function actualizarMedidorConLectura(
  medidor: Medidor,
  lectura: Pick<LecturaGPS, 'lecturaActual' | 'fechaLectura'>
): Promise<void> {
  if (!medidor.id) return;

  const medidorActualizado: Medidor = {
    ...medidor,
    lecturaAnterior: lectura.lecturaActual,
    fechaLecturaAnterior: lectura.fechaLectura,
  };

  const response = await api.put<MedidorAPI>(
    `${MEDIDORES_ENDPOINT}/${medidor.id}`,
    medidorActualizado
  );

  await actualizarMedidorEnCache(normalizarMedidor(response.data ?? medidorActualizado));
}

/**
 * Crea la lectura en MockAPI y actualiza el medidor asociado.
 *
 * Si se recibe `localId` y ya existe una lectura con ese identificador, se
 * reutiliza en lugar de crear un duplicado. Ese comportamiento permite que la
 * cola offline reintente sin miedo a duplicar registros.
 */
async function guardarLecturaGPSInterno(
  lectura: NuevaLecturaGPS
): Promise<LecturaGPS> {
  const codigoMedidor = lectura.codigoMedidor.trim().toUpperCase();
  const medidor =
    (lectura.medidorId ? await obtenerMedidorPorId(lectura.medidorId) : null) ??
    (await buscarMedidorPorCodigo(codigoMedidor));

  let lecturaRemota = lectura.localId
    ? await buscarLecturaPorLocalId(lectura.localId)
    : null;

  if (!lecturaRemota) {
    const payload = {
      medidorId: medidor?.id ?? lectura.medidorId ?? '',
      codigoMedidor: medidor?.codigo || codigoMedidor,
      lecturaActual: Number(lectura.lecturaActual),
      consumoEstimado:
        lectura.consumoEstimado ??
        Math.max(0, Number(lectura.lecturaActual) - (medidor?.lecturaAnterior ?? 0)),
      fechaLectura: lectura.fechaLectura ?? new Date().toISOString(),
      estado: lectura.estado ?? 'normal',
      observacion: lectura.observacion ?? '',
      fotoUrl: lectura.fotoUrl ?? '',
      localId: lectura.localId ?? generarLocalId(),
      ubicacion: aUbicacionAPI(lectura.ubicacion),
      isManualLocation: Boolean(lectura.isManualLocation),
    };

    const response = await api.post<LecturaAPI>(LECTURAS_ENDPOINT, payload);
    lecturaRemota = mapLectura(response.data);
  }

  if (medidor) {
    try {
      await actualizarMedidorConLectura(medidor, lecturaRemota);
    } catch (error) {
      console.warn('[Readings] La lectura se guardó, pero no se actualizó el medidor:', error);
    }
  }

  return lecturaRemota;
}

/**
 * Guarda una lectura desde el formulario en línea.
 * @returns El ID de la lectura creada en MockAPI.
 */
export async function crearLecturaGPS(lectura: NuevaLecturaGPS): Promise<string> {
  const lecturaRemota = await guardarLecturaGPSInterno(lectura);
  return lecturaRemota.id;
}

/**
 * La cola considera sincronizada una lectura cuando el registro remoto está
 * confirmado; actualizar el resumen del medidor es una operación secundaria.
 */
export async function sincronizarLecturaGPS(lectura: NuevaLecturaGPS): Promise<LecturaGPS> {
  return guardarLecturaGPSInterno(lectura);
}
