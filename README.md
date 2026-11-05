# 💧 EPMAPS - Aplicación Móvil de Lectura de Medidores en Campo PARTE 1

Solución móvil desarrollada para la empresa de agua potable EPMAPS del Distrito Metropolitano de Quito. Diseñada para funcionar en condiciones de nula o baja conectividad celular en parroquias rurales como Nono, Lloa, Pacto, Nanegalito y Calacalí, asegurando la trazabilidad de las lecturas mediante fotos y almacenamiento sin señal.

---

## 🛠️ Tecnologías Utilizadas
- **Framework:** React Native con Expo SDK 57
- **Lenguaje:** TypeScript
- **Navegación:** Expo Router
- **Persistencia Local:** `@react-native-async-storage/async-storage`
- **Autenticación:** Firebase Authentication con sesión persistente y verificación de correo
- **Interfaz de acceso:** `react-native-svg`, Big Shoulders y Space Grotesk
- **Monitoreo de Red:** `@react-native-community/netinfo`
- **Captura Fotográfica:** `expo-camera` / `expo-image-picker`
- **Backend Simulado:** MockAPI.io

---

## 🚀 Instrucciones de Instalación y Ejecución Local

### Configuración de Firebase

- Copia `.env.example` a `.env` y completa las seis variables `EXPO_PUBLIC_FIREBASE_*` con la configuración de tu aplicación web de Firebase.
- En Firebase Console, habilita el proveedor **Correo electrónico/contraseña**.
- La aplicación permite registro, inicio de sesión, verificación por correo y recuperación de contraseña. El acceso a las rutas de medidores requiere una cuenta con correo verificado.
- Después de agregar módulos nativos, crea o actualiza el development build antes de probar la app en un dispositivo.

### Ejecutar con Expo Go o con development build

El proyecto tiene instalado `expo-dev-client`; por eso Expo intenta abrir un development build por defecto y puede mostrar el error `No development build ... is installed`. Para pruebas rápidas con **Expo Go**:

```bash
npm start                 # equivale a: expo start --go
npm run android:go        # abre directamente el emulador/dispositivo con Expo Go
```

Si necesitas el development build nativo:

```bash
npm run start:dev-client  # servidor para el development build
npm run android           # compila e instala el build nativo
```

> También puedes presionar `s` en la terminal de Expo para alternar entre Expo Go y development build.

### Error HTTP 404 al sincronizar lecturas

Las lecturas se guardan primero en el dispositivo. Si la tarjeta de una lectura pendiente muestra `HTTP 404`, revisa que `EXPO_PUBLIC_MOCK_API_URL` apunte a la URL base del proyecto MockAPI (sin añadir `/lecturas` ni `/medidores`) y que ese proyecto tenga creados ambos recursos. La aplicación conserva el registro local y detiene los reintentos automáticos de ese 404; después de corregir la configuración, usa **Sincronizar Cola Ahora** en Gestión de Lecturas para reintentarlo.

# Contexto del Proyecto: Sistema de Lectura de Medidores PARTE 2

## 1. Descripción General
Aplicación móvil/web para técnicos encargados del registro y consulta de lecturas de medidores de agua/luz. El sistema registra la lectura junto con la ubicación GPS del técnico (automática o manual) e imágenes asociadas.

## 2. Stack Tecnológico
- **Frontend:** React + Vite
- **UI & Mapas:** Leaflet + OpenStreetMap (`react-leaflet`)
- **Animaciones de Estado:** Lottie (`lottie-react`)
- **Backend:** Express.js (Node.js, inicializado en `index.js`) con Middleware de autenticación
- **Autenticación:** Firebase Auth (JSON credentials)
- **Datos de medidores y lecturas:** MockAPI (`/medidores` y `/lecturas`)
- **Almacenamiento de Imágenes:** Supabase

## 3. Requerimientos del Taller (Taller 7)
- **Flujo de Lectura con GPS:**
  1. El técnico ingresa la lectura del medidor.
  2. La app obliga a capturar la ubicación actual por GPS (automático por defecto).
  3. Permite al técnico ajustar la ubicación de forma manual mediante un marcador arrastrable/haciendo clic en el mapa.
- **Consulta de Medidores:**
  - Al consultar un medidor guardado, la vista debe renderizar el mapa con un marcador en las coordenadas grabadas.
- **Animaciones Lottie (mínimo 2 estados):**
  - Estado 1: Procesando/Cargando datos (`loading`).
  - Estado 2: Confirmación de lectura guardada (`success`) o falta de conexión.

## 4. Convenciones de Código
- Componentes funcionales en React utilizando Hooks (`useState`, `useEffect`, `useRef`).
- Respuestas de API estructuradas en JSON conteniendo `latitude` y `longitude` en formato float/double.