export function validarCorreo(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

export function validarClave(clave: string): boolean {
  return clave.length >= 6;
}

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}
