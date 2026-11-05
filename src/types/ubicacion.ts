/** Coordenadas normalizadas que consumen los mapas y las pantallas. */
export interface CoordenadaGPS {
  latitude: number;
  longitude: number;
}

/**
 * Forma en la que MockAPI guarda la ubicación dentro de una lectura.
 * Se usan nombres en español para mantener consistencia con el resto
 * de campos del endpoint (`lecturaActual`, `fechaLectura`, etc.).
 */
export interface UbicacionAPI {
  latitud: number;
  longitud: number;
}
