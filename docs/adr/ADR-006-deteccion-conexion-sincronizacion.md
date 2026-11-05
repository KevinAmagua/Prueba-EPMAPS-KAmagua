# ADR-006: Usar NetInfo para detectar conectividad y procesar la cola mientras la app está activa

## Estado
Aceptado.

## Fecha
2026-10-28

## Requisitos relacionados
R9 (Sincronización automática de pendientes e indicador global) y R10 (Restricciones de reenvío).

## Contexto
El técnico puede tomar lecturas en zonas sin señal de internet (R4). La aplicación necesita observar cambios de conectividad y procesar las lecturas guardadas localmente cuando vuelve a haber conexión (R9). La implementación invoca el procesador desde la app al cambiar el estado de red y al encolar una lectura; no configura una tarea de sincronización en segundo plano del sistema operativo.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **`@react-native-community/netinfo` + cola personalizada** | Proporciona un listener de conectividad y permite activar una cola local cuando la app recibe el cambio de estado. | Requiere implementar y mantener persistencia, reintentos y actualización del estado de cada lectura. No garantiza ejecución con la app suspendida o terminada. |
| **Polling por temporizador (`setInterval`)** | Realiza peticiones de prueba a la API a intervalos fijos de tiempo. | Consume batería innecesariamente y genera peticiones fantasma continuas cuando no hay red disponible. |

## Decisión
Se utiliza **NetInfo** en `useNetworkStatus` para observar la conectividad. Cuando la app está activa y se detecta conexión, se llama a `processSyncQueue` para leer la cola persistida en AsyncStorage, subir las fotos pendientes a Supabase Storage y enviar las lecturas a MockAPI. La cola marca cada elemento como sincronizado cuando recibe respuesta satisfactoria y registra intentos fallidos para reintentar después. El campo `localId` se envía con la lectura, pero el código no implementa una garantía de idempotencia del servidor.

## Consecuencias
* Se agrega `@react-native-community/netinfo` a las dependencias.
* El indicador de conectividad y el contador de pendientes se presentan desde el layout raíz mientras la aplicación está abierta.
* **Riesgo / Desventaja:** La sincronización no está programada como tarea nativa de fondo, por lo que depende de que la aplicación pueda ejecutar el procesador. Además, si el servidor acepta una lectura pero se pierde su respuesta, un reintento podría duplicarla; enviar `localId` no evita por sí mismo ese caso sin soporte de idempotencia en el servidor.
* **Política de reintentos:** Se debe establecer un límite máximo de intentos (*max retries*) por registro en la cola de sincronización para evitar bucles continuos de reenvío y saturación de la red ante errores persistentes del servidor (códigos 5xx).

## Verificación
* Verificar la librería `@react-native-community/netinfo` en `package.json`.
* Simular modo avión, guardar una lectura, volver a conectar con la app activa y comprobar el procesamiento de la cola.
* Interrumpir una sincronización y comprobar que los elementos exitosos queden marcados individualmente y los fallidos conserven su estado pendiente.
* No considerar garantizada la ejecución con la app suspendida ni la deduplicación del servidor sin pruebas específicas.

## Uso de IA
Se le pidió a la IA proponer cómo detectar la recuperación de red y reintentar el envío de lecturas pendientes. La IA recomendó un hook basado en NetInfo que invoque el procesador de la cola. Se implementó ese enfoque con `useNetworkStatus` y `processSyncQueue`, que registra los intentos fallidos por elemento. No se adoptó una tarea nativa de ejecución en segundo plano, por lo que el procesamiento depende de que la aplicación pueda ejecutarse.

