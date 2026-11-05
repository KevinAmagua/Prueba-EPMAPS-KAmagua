import { FirebaseError } from 'firebase/app';

const mensajes: Record<string, string> = {
  'auth/email-already-in-use': 'Ya existe una cuenta registrada con ese correo.',
  'auth/invalid-email': 'Ingresa un correo electrónico válido.',
  'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Contacta con soporte.',
  'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
  'auth/wrong-password': 'El correo o la contraseña no son correctos.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión a internet.',
  'auth/operation-not-allowed':
    'El acceso con correo y contraseña no está habilitado en Firebase.',
  'auth/email-not-verified':
    'Debes verificar tu correo antes de ingresar. Revisa tu bandeja de entrada.',
  'auth/no-current-user': 'No hay una sesión activa.',
  'profile/invalid-name': 'Escribe tu nombre para continuar.',
};

export function obtenerMensajeErrorFirebase(error: unknown): string {
  if (error instanceof FirebaseError) {
    return mensajes[error.code] ?? 'Ocurrió un error al conectarse con Firebase. Inténtalo de nuevo.';
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return mensajes[error.code] ?? 'Ocurrió un error al procesar la solicitud.';
  }

  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
