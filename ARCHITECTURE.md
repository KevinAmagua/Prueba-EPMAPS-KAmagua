# Arquitectura y Justificación Técnica (ARCHITECTURE.md)
# EPMAPS — Registro de Lecturas de Medidores en Campo

Este documento describe la arquitectura **Offline-First**, el patrón de sincronización en segundo plano y la matriz estricta de justificación de dependencias para el proyecto EPMAPS.

---

## 1. Arquitectura Offline-First y Patrón de Sincronización

La aplicación está diseñada bajo el principio de que **la conectividad a internet en campo es un recurso inestable**. Por tanto, la arquitectura prioriza la operatividad local continua:

1. **Fuente Primaria de Verdad Local (`AsyncStorage`):**
   - Al iniciar la jornada, el técnico descarga el padrón de medidores, el cual se persiste localmente bajo la clave `@medidores_cache`.
   - Durante la ruta, las consultas de medidores (por código o número de cuenta) se resuelven instantáneamente desde el caché local, garantizando cero latencia.

2. **Captura y Cola de Sincronización (`@sync_queue`):**
   - Cuando el operador registra una lectura (con o sin red), la aplicación valida localmente los datos, genera un registro y lo almacena inmediatamente en `@sync_queue` con el indicador `sincronizado: false`.
   - Se confirma el éxito del guardado local al usuario en menos de 100ms, evitando esperas en zonas sin cobertura.

3. **Monitoreo de Red y Background Sync (`NetInfo`):**
   - El hook `useNetworkStatus` supervisa de forma continua el estado del adaptador de red mediante `@react-native-community/netinfo`.
   - Al detectar la recuperación de conectividad, el servicio `syncQueueService` procesa de forma automática y secuencial los elementos pendientes en la cola.
   - **Idempotencia:** Cada elemento pendiente incluye un identificador único local (`localId`). El servicio reintenta el envío de forma segura y solo elimina el elemento de la cola tras recibir la confirmación HTTP 201/200 del servidor MockAPI, previniendo duplicados (R10).

---

## 2. Prevención de Pérdida de Datos en Formularios (`@draft_form`)
A través del hook personalizado `useMeterForm`, cada pulsación o cambio en el formulario de captura actualiza un borrador persistente en AsyncStorage (`@draft_form`). Si el sistema operativo cierra la app por gestión de memoria, al reabrir la aplicación se detecta el borrador pendiente y se ofrece un modal interactivo para **Continuar** o **Descartar** el registro previo.

---

## 3. Matriz de Justificación Técnica de Dependencias

Cada dependencia instalada en el proyecto responde estrictamente a un requerimiento funcional o arquitectónico del sistema, evitando redundancias:

| Dependencia | Versión (Ref) | Requisito / Propósito en EPMAPS | Justificación Técnica Estricta |
| :--- | :--- | :--- | :--- |
| **`@react-native-async-storage/async-storage`** | `^2.1.2` | R1, R3, R4, R8 | Almacén clave-valor asíncrono indispensable para persistir el caché de medidores (`@medidores_cache`), la cola offline (`@sync_queue`), la sesión del técnico (`@auth_session`) y el borrador de formularios (`@draft_form`). |
| **`@react-native-community/netinfo`** | `^11.4.1` | R3, R9 | Monitoreo nativo en tiempo real de la conectividad de red (WiFi/Celular). Permite activar dinámicamente la sincronización en segundo plano y actualizar el indicador de estado de red en la UI. |
| **`expo-camera`** | `~16.0.18` | R7 | Acceso nativo optimizado a la cámara del dispositivo para la captura obligatoria de evidencia fotográfica en casos de consumo anómalo o medidores dañados, con manejo robusto de permisos. |
| **`axios`** | `^1.7.9` | R3, R9 | Cliente HTTP robusto con soporte para interceptores, tiempos de espera (`timeouts`) configurables y gestión estructurada de errores de red para la comunicación con MockAPI.io. |
| **`expo-router`** | `~4.0.17` | Navegación | Sistema de enrutamiento basado en archivos (`file-based routing`) provisto nativamente por Expo. Organiza las pantallas de forma limpia en `src/app/` optimizando el rendimiento de navegación nativa en Android e iOS. |

---

## 4. Verificación y Estándares de Calidad
Antes de cada entrega o compilación de producción, se ejecutan obligatoriamente las herramientas de verificación estática del ecosistema Expo:
- `npx expo lint` (Validación de reglas ESLint y estilo de código)
- `npx tsc --noEmit` (Verificación estricta de tipos TypeScript sin emitir archivos)
- `npx expo-doctor` (Diagnóstico de dependencias y compatibilidad de SDK)
