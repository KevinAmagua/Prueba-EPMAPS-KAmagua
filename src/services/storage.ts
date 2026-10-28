import { createClient } from '@supabase/supabase-js';
import { File } from 'expo-file-system';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET_NAME = 'medidores-fotos';

let supabaseClient: ReturnType<typeof createClient> | undefined;

/**
 * Valida la configuración y crea el cliente Supabase solo una vez.
 * @returns Cliente reutilizable para las operaciones de Storage.
 * @throws Si faltan las variables de entorno o la URL no es válida.
 */
function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY para subir fotos.');
  }

  let projectUrl: URL;
  try {
    projectUrl = new URL(SUPABASE_URL);
  } catch {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL debe ser la URL base del proyecto Supabase.');
  }

  if (!['https:', 'http:'].includes(projectUrl.protocol) || projectUrl.pathname !== '/') {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL debe ser la URL base del proyecto, sin /rest/v1.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(projectUrl.origin, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
}

/**
 * Sube una imagen local a `medidores-fotos/lecturas` y obtiene su URL pública.
 * @param uri URI local del archivo capturado.
 * @param fileName Nombre destino; se normaliza para evitar caracteres no válidos.
 * @returns URL pública del archivo almacenado.
 * @throws Si el archivo, la configuración o la subida no son válidos.
 */
export async function uploadMeterPhoto(uri: string, fileName: string): Promise<string> {
  const file = new File(uri);
  if (!file.exists) {
    throw new Error('No se encuentra el archivo local de la fotografía.');
  }

  // El nombre se limita a caracteres seguros antes de construir la ruta remota.
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safeFileName) {
    throw new Error('El nombre del archivo de evidencia no es válido.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(`lecturas/${safeFileName}`, file, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`No se pudo subir la fotografía a Supabase: ${error.message}`);
  }

  // La URL se construye a partir de la ruta confirmada por Storage.
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
