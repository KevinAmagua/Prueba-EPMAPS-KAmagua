/**
 * Utilidades de validación estricta para EPMAPS
 */

export const METER_CODE_REGEX = /^MED-\d{6}$/;

/**
 * Comprueba que el código tenga el formato `MED-` seguido de seis dígitos.
 * Elimina espacios exteriores y normaliza a mayúsculas antes de validar.
 * @param code Código introducido o recibido para el medidor.
 * @returns `true` si cumple el formato esperado; de lo contrario, `false`.
 */
export function validateMeterCode(code: string): boolean {
  return METER_CODE_REGEX.test(code.trim().toUpperCase());
}

/**
 * Determina si la lectura actual supera tres veces la lectura anterior.
 * Una lectura anterior menor que uno no produce anomalía según esta regla.
 * @param lecturaActual Valor actual leído del medidor.
 * @param lecturaAnterior Valor anterior usado como referencia.
 * @returns `true` solo si se supera el umbral de tres veces.
 */
export function isConsumoAnomalo(lecturaActual: number, lecturaAnterior: number): boolean {
  if (lecturaActual < lecturaAnterior) {
    return false;
  }
  // Si la lectura actual es mayor al triple de la anterior (cuando anterior > 0)
  if (lecturaAnterior > 0 && lecturaActual > lecturaAnterior * 3) {
    return true;
  }
  return false;
}
