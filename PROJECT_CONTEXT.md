# Guía de Prompts e Integración IA (React Native + Firebase)

Este documento contiene un conjunto de **prompts preconfigurados** y recomendaciones para usarlos con modelos de Inteligencia Artificial (ChatGPT, Claude, Cursor, Copilot, Gemini) para implementar **Leaflet en WebView**, **Animaciones Lottie**, y los **Estilos UI/UX recomendados** para la evaluación del Taller 7.

---

## 📋 Contexto Tecnológico del Proyecto
- **Framework Mobile:** React Native (CLI o Expo)
- **Autenticación & DB:** Firebase (Auth, Firestore / Realtime Database)
- **Mapas:** Leaflet.js cargado dentro de un `react-native-webview` + OpenStreetMap
- **Animaciones:** `lottie-react-native`
- **Ubicación:** `expo-location` o `@react-native-community/geolocation`

---

## 🎨 Guía de Estilos y Diseño UI/UX (Para Ganar el Punto Adicional)

### 1. Paleta de Colores Profesional
- **Color Principal (Brand):** `#1E40AF` (Azul corporativo / industrial)
- **Color Secundario (Acento):** `#3B82F6` (Azul interactivo)
- **Éxito (Lectura guardada):** `#10B981` (Verde esmeralda)
- **Fondo General:** `#F8FAFC` (Gris claro / neutro)
- **Superficie / Cards:** `#FFFFFF` (Blanco puro con bordes suavizados)
- **Texto Principal:** `#1E293B` (Gris oscuro de alta legibilidad)

### 2. Principios de Interfaz Móvil
- **Tarjetas Elevadas (Cards):** Bordes de `border-radius: 16`, sombras suaves (`shadowOpacity: 0.08`, `elevation: 3`).
- **Estados Claras mediante Lottie:**
  - Peticiones en curso: Modal translucido central con spinner Lottie.
  - Guardado exitoso: Animación de *check mark* Lottie con cierre automático tras 2 segundos.
- **Visualización de Mapa:**
  - Contenedor con bordes redondeados (`overflow: 'hidden'`, `border-radius: 16`).
  - Toggle switch o botón estilizado para alternar entre modo **"GPS Automático"** y **"Marcador Manual"**.

---

## 🚀 Prompts de Integración para la IA

Copia y pega estos prompts completos a tu IA para solicitar el código exacto adaptado a tu proyecto.

### Prompt 1: Componente de Mapa Leaflet en WebView (Captura GPS + Manual)

```text
Actúa como un desarrollador senior experto en React Native y Firebase.

Necesito que crees un componente reutilizable llamado `MeterLocationMap.js` (o `.tsx`) que funcione dentro de un proyecto de React Native.

Requerimientos exactos:
1. Usa `react-native-webview` para renderizar una página HTML que instancie Leaflet con OpenStreetMap.
2. Debe permitir dos modos de operación:
   - GPS Automático: Obtiene la ubicación actual del dispositivo usando `navigator.geolocation` o pasándole la posición del dispositivo y centra el mapa.
   - Modo Manual: Un botón o switch que habilita la capacidad de mover un marcador (draggable) o hacer tap en el mapa para ajustar la latitud y longitud.
3. Comunica las coordenadas seleccionadas (lat, lng) desde el WebView hacia React Native usando `window.ReactNativeWebView.postMessage`.
4. El diseño debe incluir estilos limpios (bordes redondeados `border-radius: 16`, sombras suaves y toggle responsivo).

Por favor proporciona el código completo del componente y la explicación de cómo recibir las coordenadas en la pantalla principal.
```

---

### Prompt 2: Pantalla de Registro de Lectura con Lottie y Firebase

```text
Actúa como un desarrollador móvil experto en React Native y Firebase backend.

Tengo un proyecto React Native donde el técnico registra lecturas de medidores. Necesito implementar la pantalla `RegisterReadingScreen.jsx` que cumpla con el flujo del Taller 7:

1. Campos del formulario: ID de Medidor, Valor de Lectura actual.
2. Incluir el componente `MeterLocationMap` para obtener latitud y longitud obligatoriamente.
3. Integración de Lottie (`lottie-react-native`):
   - Muestra una animación Lottie de "Cargando/Procesando" durante el guardado en Firebase Firestore.
   - Muestra una animación Lottie de "Éxito" cuando la operación se complete con éxito en Firebase.
4. Aplica las recomendaciones visuales:
   - Colores: Principal `#1E40AF`, Acento verde `#10B981`, Fondo `#F8FAFC`.
   - Cards redondeados, botones estilizados con feedback táctil.
5. Código listo para guardar en Firebase Firestore en la colección `readings` con la siguiente estructura:
   {
     meterId: string,
     readingValue: number,
     location: { latitude: float, longitude: float },
     timestamp: serverTimestamp(),
     isManualLocation: boolean
   }

Dame el código completo estructurado y los imports necesarios.
```

---

### Prompt 3: Pantalla de Consulta de Medidores con Mapa de Ubicación Grabada

```text
Actúa como un desarrollador senior en React Native.

Necesito la pantalla `MeterDetailScreen.jsx` para consultar una lectura de medidor previa guardada en Firebase.

Requerimientos:
1. Recibe por props/parámetros la información de la lectura del medidor (incluyendo `latitude` y `longitude`).
2. Muestra los detalles de la lectura (ID, valor, fecha) en tarjetas estilizadas visualmente atractivas.
3. Renderiza un `WebView` con Leaflet mostrando el mapa con un marcador estático fijo en las coordenadas de la lectura grabada.
4. Muestra una animación Lottie de carga (`loading`) mientras se descargan los datos desde Firebase.
5. Incluye botón para regresar o consultar otro medidor.

Dame el código completo optimizado con un diseño limpio y moderno.
```

---

### Prompt 4: Refactorización y Pulido de Diseño UI/UX (Punto Adicional)

```text
Actúa como un diseñador UX/UI especializado en aplicaciones móviles React Native.

Revisa mi código [INSERTAR_CÓDIGO_O_PANTALLA] y aplícale un rediseño completo manteniendo la lógica funcional. 

Quiero competir por el punto adicional de diseño visual del taller, aplicando:
1. Tarjetas con bordes redondeados (`borderRadius: 16`) y elevación sutil.
2. Jerarquía tipográfica clara (Títulos en Negrita `#1E293B`, subtítulos `#64748B`).
3. Feedback de estados mediante modales limpios con animaciones Lottie.
4. Estilización del mapa WebView con contenedor adaptado al diseño de la app.
5. Botones primarios y secundarios con estados activos/deshabilitados legibles.

Dame el bloque de estilos `StyleSheet.create` y la estructura JSX refactorizada.
```

---

## 📌 Pasos para Ejecutar con la IA

1. Copia el contenido de `PROJECT_CONTEXT.md` (o adjúntalo en la conversación).
2. Pega uno de los prompts de este archivo según el componente que quieras construir o mejorar.
3. Solicita revisiones o ajustes de código específicos sobre las respuestas obtenidas.