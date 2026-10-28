# ADR-005: Usar Expo Camera y Supabase Storage para la evidencia fotográfica

## Estado
Aceptado.

## Fecha
2026-10-28

## Requisitos relacionados
R7 (Respaldo fotográfico obligatorio en lecturas anómalas, medidores dañados o inaccesibles).

## Contexto
El requisito R7 requiere adjuntar evidencia fotográfica a las lecturas que lo necesiten. MockAPI.io recibe el registro de lectura, mientras que Supabase Storage almacena el archivo y devuelve una URL pública. La captura se implementa con `expo-camera`. Si no hay conexión, la URI local se conserva en la cola y la subida se intenta al procesarla. En la implementación actual, la foto es obligatoria para lecturas anómalas o con estado dañado; el estado inaccesible no la exige automáticamente.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **Supabase Storage** | Ofrece almacenamiento de archivos y una URL pública que se puede asociar al registro de lectura. | La subida requiere conectividad y políticas de acceso válidas; deben configurarse y verificarse en el proyecto de Supabase. |
| **ImgBB / Cloudinary API** | Integración directa mediante peticiones HTTP POST enviando la imagen codificada en Base64. | Menor control sobre la persistencia y gestión privada de los archivos; dependencia de APIs de terceros con cuotas restrictivas en capas gratuitas. |

## Decisión
Se utiliza **Supabase Storage** con el bucket `medidores-fotos`. `CameraModal` captura la imagen con `expo-camera`; `src/services/storage.ts` carga el archivo y obtiene su URL pública. `src/services/syncQueue.ts` conserva y procesa la URI local junto con la lectura, e intenta subir la fotografía antes de enviar el registro a MockAPI. La decisión se fundamenta en la necesidad de almacenar evidencias fotográficas de las lecturas sin incrementar la complejidad del backend del proyecto. Supabase Storage proporciona un servicio administrado para el almacenamiento de archivos, integración sencilla con aplicaciones Expo/React Native y generación de URL públicas que pueden asociarse fácilmente a los registros almacenados en MockAPI.

## Consecuencias
* Se incorpora la librería `@supabase/supabase-js` al archivo `package.json`.
* Se configuran las variables de entorno obligatorias (`EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`) en el proyecto.
* El acceso efectivo depende de la configuración del bucket y sus políticas en Supabase; estas políticas se deben verificar fuera del código de la aplicación.
* **Riesgo / Desventaja:** La subida requiere conexión y puede fallar; el registro permanece pendiente mientras la cola vuelve a intentarlo. El código actual no exige fotografía para el estado inaccesible, aunque el requisito R7 lo contempla; esa diferencia requiere confirmación del responsable del requisito.
* **Nota de seguridad y privacidad:** Actualmente se utiliza un bucket público con políticas RLS para lectura/escritura anónima y obtención de URLs públicas. Para implementaciones futuras que requieran estricta confidencialidad de las imágenes de los medidores, se evaluará el uso de URLs firmadas (*signed URLs*).

## Verificación
* Comprobar `expo-camera` y `@supabase/supabase-js` en `package.json`.
* Verificar en `src/components/CameraModal.tsx` la captura y en `src/services/storage.ts` la subida al bucket `medidores-fotos` y la obtención de URL.
* Validar en el proyecto Supabase que el bucket y sus políticas permitan las operaciones previstas.
* Probar el guardado local de una lectura con foto sin conexión y el intento de subida al procesar la cola con conexión.

## Uso de IA
Se le pidió a la IA comparar opciones para guardar fotografías asociadas a lecturas enviadas a MockAPI. La IA propuso Supabase Storage, Cloudinary e ImgBB. Se eligió Supabase Storage para separar los archivos del registro JSON y obtener una URL que pueda asociarse a la lectura; la disponibilidad de la subida depende de la conexión y de la configuración de acceso del bucket.
