# Implementación técnica: lecturas con ubicación y animaciones Lottie

## Alcance y arquitectura

La implementación se divide en dos etapas funcionales:

1. Capturar coordenadas GPS o manuales durante el registro de una lectura, asociarlas al formulario y conservarlas localmente antes de sincronizar.
2. Comunicar carga y éxito de forma visual mediante Lottie en las pantallas de registro, consulta e inicio de sesión.

La aplicación es Expo/React Native con Expo Router. La captura del mapa combina React Native, `expo-location`, `react-native-webview` y Leaflet. La persistencia de lecturas es offline-first: el primer guardado se realiza en AsyncStorage y la cola `@sync_queue`; cuando hay conectividad se sincroniza con MockAPI. Firebase se utiliza para autenticación, no para almacenar lecturas.

## 1. Captura de medidores y ubicación

### 1.1 Componentes y contratos

| Archivo | Responsabilidad |
|---|---|
| `src/app/capture/[codigo].tsx` | Pantalla de captura: carga los datos del medidor, presenta el mapa y valida la ubicación antes de guardar. |
| `src/components/MeterLocationMap.jsx` | Implementación nativa del mapa Leaflet dentro de un WebView y puente de mensajes con React Native. |
| `src/components/MeterLocationMap.web.jsx` | Alternativa web que muestra OpenStreetMap mediante un `iframe`; usa la geolocalización del navegador y no comparte el mapa Leaflet nativo. |
| `src/hooks/useMeterForm.ts` | Estado y borrador local por código de medidor, incluidos `ubicacion` e `isManualLocation`. |
| `src/types/ubicacion.ts` | Contratos de coordenadas normalizadas y del formato remoto. |
| `src/types/lectura-gps.ts` | Contratos de lectura GPS de dominio/API. |
| `src/services/syncQueue.ts` | Persistencia local de la captura y procesamiento secuencial de pendientes. |
| `src/services/readings.ts` | Normalización de respuestas y conversión entre el modelo de la aplicación y MockAPI. |

El mapa entrega las coordenadas al formulario en la forma normalizada:

```ts
interface CoordenadaGPS {
  latitude: number;
  longitude: number;
}
```

La forma remota utiliza los nombres de campo ya establecidos por la API:

```ts
interface UbicacionAPI {
  latitud: number;
  longitud: number;
}
```

La transformación se realiza al serializar (`aUbicacionAPI`) y al leer (`normalizarUbicacion`). El normalizador también acepta formatos históricos habituales —coordenadas en arreglo, texto JSON, texto separado por coma y alias como `lat`/`lng`— para mantener la compatibilidad con registros anteriores.

### 1.2 Inicialización y modo GPS

Al montar el mapa editable, `MeterLocationMap` solicita una ubicación una sola vez. Un `gpsRequestedRef` evita repetir automáticamente la solicitud durante renders posteriores. En modo de solo lectura el GPS no se solicita.

La secuencia de ubicación automática es:

1. `locateDevice` solicita permiso en primer plano mediante `Location.requestForegroundPermissionsAsync()`.
2. Si el permiso se rechaza, muestra el mensaje de permiso y pasa al modo manual para que el técnico pueda continuar con el mapa.
3. Si el permiso se concede, intenta obtener la última posición con `getLastKnownPositionAsync`, aceptando una antigüedad máxima de 120 segundos y exactitud requerida de 250 metros.
4. Si no existe posición reciente, obtiene la posición actual con `getCurrentPositionAsync` y precisión `Balanced`.
5. Si el componente continúa montado, actualiza el estado React y la referencia de posición. Después envía la nueva coordenada al WebView y notifica a la pantalla mediante `onLocationChange` con `isManualLocation: false`.
6. Mientras espera, el componente mantiene un estado de carga de ubicación. Si la consulta falla, conserva el formulario y permite ajustar el marcador manualmente.

La posición inicial de Quito solo sirve para centrar el mapa cuando todavía no existe una coordenada capturada; no reemplaza la comprobación obligatoria del formulario. La pantalla de captura rechaza el guardado si `formState.ubicacion` todavía es `null`.

### 1.3 Mapa Leaflet y puente WebView

La versión nativa prepara HTML local en `MAP_HTML`, carga Leaflet y las teselas de OpenStreetMap dentro de `react-native-webview`. El HTML establece un mapa, atribución, controles de zoom y un marcador personalizado. El contenedor visual recorta el WebView con bordes redondeados (`borderRadius: 16`, `overflow: 'hidden'`).

La comunicación es bidireccional:

- **React Native → Leaflet:** `sendToMap` serializa un comando y lo entrega mediante `injectJavaScript`. La página expone `window.__meterMapReceive`, que procesa `setPosition`, `setMode`, y `setReadOnly`.
- **Leaflet → React Native:** el HTML envía eventos serializados con `window.ReactNativeWebView.postMessage`. El handler `handleMapMessage` interpreta `ready`, `location` y `error`.

Cuando Leaflet informa que está listo, React Native aplica el modo actual y, si existe, centra el mapa en la posición guardada. La entrada remota se valida convirtiendo latitud y longitud a número y descartando valores que no sean finitos.

### 1.4 Ajuste manual

El selector del mapa permite cambiar de GPS a marcador manual:

- En modo manual, un toque sobre el mapa actualiza el marcador y envía el par de coordenadas.
- También se puede arrastrar el marcador; al finalizar el gesto, Leaflet emite el mismo tipo de evento.
- El componente React recibe las coordenadas, cambia a modo manual y notifica el formulario con `isManualLocation: true`.
- Si se vuelve al modo GPS, el mapa solicita de nuevo la posición del dispositivo.
- Si se cambia a manual cuando ya hay posición, esa coordenada se conserva como punto inicial del ajuste; el usuario puede afinarla en el mapa.
- En `readOnly`, Leaflet deshabilita el arrastre y oculta los controles de zoom para presentar la ubicación registrada sin permitir cambios.

El fallback web utiliza el `iframe` de OpenStreetMap y la geolocalización del navegador. Mantiene una representación visual del punto, pero no ofrece el mismo puente de edición táctil que Leaflet en WebView nativo.

### 1.5 Borradores y guardado offline-first

`useMeterForm` conserva la ubicación junto con los demás campos de la captura, bajo la clave `@draft_form_${codigoMedidor}`. El borrador se restaura por medidor y se normalizan campos ausentes de borradores antiguos. Esto evita mezclar coordenadas de medidores distintos y permite recuperar la captura después de cerrar la aplicación.

Al guardar en `src/app/capture/[codigo].tsx`:

1. Se comprueba que exista el medidor y una ubicación.
2. Se ejecutan las validaciones del estado y lectura, incluida la confirmación de anomalía y la evidencia fotográfica cuando corresponde.
3. Se valida la duplicidad mensual local y se intenta contrastar con `/lecturas`.
4. Se crea el objeto de lectura incluyendo `ubicacion` e `isManualLocation`.
5. `enqueuePendingReading` serializa la escritura de `@sync_queue` con un `localId` y persiste el elemento antes de iniciar la sincronización en segundo plano.
6. Una vez encolada la lectura, se elimina el borrador. Sin conexión, queda pendiente; con conectividad, `processSyncQueue` la entrega a `sincronizarLecturaGPS`.
7. El servicio de lecturas convierte las coordenadas a `{ latitud, longitud }` para enviarlas a `/lecturas`. El `localId` acompaña la operación para que los reintentos busquen una lectura previamente creada.
8. El historial y detalle normalizan la ubicación recibida. El detalle puede presentar el mapa en modo `readOnly`.

La confirmación de registro en la pantalla corresponde al almacenamiento local exitoso en la cola, no necesariamente a una confirmación remota. El estado de sincronización se conserva por separado.

## 2. Integración de animaciones Lottie

### 2.1 Inventario de archivos

| Archivo | Función |
|---|---|
| `src/assets/lottie/loading.json` | Animación de carga. |
| `src/assets/lottie/success.json` | Animación de confirmación de guardado local. |
| `src/assets/lottie/login.json` | Ilustración de escudo y verificación para inicio de sesión. |
| `src/components/StatusAnimation.tsx` | Modal nativo reutilizable para estados `loading` y `success`. |
| `src/components/StatusAnimation.web.tsx` | Fallback web con indicador de actividad y marca de éxito. |
| `src/components/LoginAnimation.tsx` | Ilustración Lottie decorativa de acceso seguro. |
| `src/components/LoginAnimation.web.tsx` | Ilustración estática equivalente para web. |
| `src/app/capture/[codigo].tsx` | Activa carga/éxito durante el guardado local. |
| `src/app/login.tsx` | Inserta la animación decorativa en el formulario de acceso. |
| `src/screens/ReadingsHistoryScreen.tsx` | Presenta carga mientras obtiene el historial. |
| `src/screens/MeterDetailScreen.jsx` | Presenta carga durante la consulta del detalle. |
| `LOTTIE_INTEGRATION_SUMMARY.md` | Resumen breve de archivos, estados y rutas de los JSON. |

Las animaciones se referencian con `require` estático para que Metro pueda descubrir e incluir los JSON en el bundle:

```ts
const animations = {
  loading: require('../assets/lottie/loading.json'),
  success: require('../assets/lottie/success.json'),
} as const;
```

El proyecto utiliza Expo SDK 57 y `lottie-react-native` 7.3.8, ya presentes en `package.json`; esta integración no agrega dependencias.

### 2.2 `StatusAnimation`: modal de estado

`StatusAnimation` recibe `visible`, `variant`, `title`, `message` y un `onAnimationFinish` opcional. El modal usa una capa semitransparente y una tarjeta centrada para dar prioridad visual al estado sin reemplazar la pantalla subyacente.

En nativo:

- `visible` controla el montaje del modal.
- `variant === 'loading'` activa `autoPlay` y `loop`.
- `variant === 'success'` usa `loop={false}`. Al finalizar una reproducción no cancelada, invoca `onAnimationFinish`.
- La `key` basada en estado y visibilidad reinicia la animación al cambiar de variante o volver a mostrar el modal.

En web, `StatusAnimation.web.tsx` mantiene las mismas props visuales. Como reemplazo de Lottie nativo, usa `ActivityIndicator` para carga y una marca estática para éxito; un temporizador de 1.25 segundos reproduce el cierre del ciclo de éxito para mantener el flujo de la pantalla.

### 2.3 Eventos de reproducción

#### Guardar lectura

En la pantalla `/capture/[codigo]`, después de validar los campos:

1. Se establece `saving = true` y `saveAnimation = 'loading'`.
2. Se persiste la lectura en la cola local y se elimina el borrador.
3. Si ambas operaciones terminan correctamente, se cambia a `success`.
4. La animación de éxito se reproduce una vez. Su evento de finalización cierra el modal y muestra las acciones para consultar lecturas o registrar otra.
5. Si el guardado local o la eliminación del borrador lanza un error, se cierra la animación, se muestra el error existente y no se presenta la confirmación de éxito.

Este comportamiento evita afirmar que una lectura se guardó en un backend cuando el evento confirmado aquí es su persistencia local. La sincronización remota ocurre aparte por la cola.

#### Consultar historial y detalle

El historial presenta la variante `loading` cuando la consulta está activa y todavía no hay lecturas para mostrar. El detalle usa el mismo componente mientras obtiene una lectura remota. Así se reutiliza el componente de estado, los assets y el estilo del modal en lugar de implementar loaders por separado en cada pantalla.

#### Inicio de sesión

`LoginAnimation` se muestra encima de los campos del formulario. En nativo reproduce `login.json` automáticamente en bucle como elemento visual de marca. No observa el resultado de Firebase ni controla la navegación: `enviarFormulario` mantiene su flujo actual de validación, llamada a `iniciarSesion` y navegación. En web se muestra un escudo con marca de verificación estático.

## 3. Paleta, estilos y accesibilidad visual

`src/constants/taller-colors.ts` centraliza los colores de la experiencia del taller:

- Azul corporativo: `#1E40AF`.
- Acento azul: `#3B82F6`.
- Éxito: `#10B981`.
- Fondo neutro: `#F8FAFC`.
- Superficie: blanco.
- Overlay: `rgba(15, 23, 42, 0.55)`.

`cardShadow` comparte elevación Android y sombra iOS (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`) entre tarjetas de estado y el componente de mapa. El mapa tiene un contenedor separado con clipping para que las esquinas redondeadas se apliquen al WebView.

Los componentes Lottie exponen texto accesible para estados y una etiqueta de imagen para la ilustración del login. El cambio entre texto, iconografía y animación ayuda a que el significado no dependa únicamente del color.

## 4. Validación y comprobaciones

Para comprobar la implementación en el proyecto:

```bash
npm run lint
npx tsc --noEmit
```

También se debe probar en un dispositivo o development build:

1. Abrir la captura y conceder permiso GPS; verificar que el mapa centre el punto y que la latitud/longitud se muestre en el formulario.
2. Denegar permiso o simular un error GPS; verificar el mensaje y que el modo manual permita seleccionar ubicación.
3. Tocar el mapa y arrastrar el marcador; verificar que cambien las coordenadas y que el origen quede marcado como manual.
4. Cerrar y reabrir la captura; verificar recuperación de coordenadas desde el borrador por medidor.
5. Guardar una lectura offline; verificar que primero quede pendiente local y que la animación de éxito no se presente hasta completar el guardado local.
6. Restablecer conectividad; verificar sincronización y lectura de coordenadas en historial/detalle.
7. Abrir login; verificar la animación en bucle sin afectar el envío de credenciales.
8. Probar los fallbacks web separadamente: usan geolocalización del navegador/iframe para mapa y representación estática para las animaciones.

## 5. Límites conocidos

- La carga de las teselas y del HTML de Leaflet depende de conectividad; la coordenada del GPS y el borrador pueden seguir conservándose localmente aunque el mapa no cargue.
- El fallback web es visual y no replica la edición de marcador de la implementación nativa.
- La animación `success` confirma el guardado en la cola local. No confirma el éxito de la sincronización de MockAPI.
- Firebase Authentication valida la sesión; no se usa como almacenamiento de las lecturas descritas aquí.
