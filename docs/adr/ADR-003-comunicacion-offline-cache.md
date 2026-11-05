# ADR-003: Usar Axios para la comunicación HTTP y respaldar consultas con caché local

## Estado
Aceptado.

## Fecha
2026-10-28

## Requisitos relacionados
R3 (Consulta de medidores y caché local) y R9 (Envío de lecturas pendientes).

## Contexto
La aplicación consulta medidores y envía lecturas a MockAPI.io. Axios centraliza la configuración HTTP, incluido un tiempo límite configurable. Existe además un servicio de caché que consulta la API cuando hay conexión y recurre a los datos locales cuando no hay conexión o falla la solicitud. La pantalla actual de búsqueda invoca la API directamente, por lo que no todas las consultas usan hoy ese respaldo. 

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **Axios** | Permite configurar *timeouts*, interceptores y manejo estandarizado de respuestas y errores HTTP. | Agrega una dependencia externa y requiere entender su configuración y sus errores. |
| **Fetch API nativo** | Incluido nativamente en la plataforma JavaScript de React Native sin instalar paquetes. | Requiere implementar manualmente la lógica de *timeouts*, parseo de JSON y captura de errores HTTP status (> 400). |

## Decisión
Se elige **Axios** para el cliente HTTP en `src/services/api.ts`. El tiempo límite se lee de `EXPO_PUBLIC_API_TIMEOUT` y usa 5000 ms si la variable no está definida. `getMedidoresWithCache`, en `src/services/cache.ts`, intenta obtener los medidores de la API cuando hay conexión y utiliza AsyncStorage como respaldo (R3). Esta estrategia se complementa con la gestión de caché offline y cola detallada en el **ADR-008** (R4, R9). Se utiliza Axios para centralizar las solicitudes HTTP y un servicio de caché basado en AsyncStorage para respaldar la consulta de medidores cuando no hay conexión o la API no está disponible. Esta decisión facilita la configuración de red y fortalece el soporte offline de la aplicación.

## Consecuencias
* Se instala el paquete `axios` en el proyecto.
* El timeout tiene un valor predeterminado de 5000 ms y puede configurarse mediante `EXPO_PUBLIC_API_TIMEOUT`.
* **Riesgo / Desventaja:** La estrategia de respaldo no se aplica automáticamente a las pantallas que llaman a `api` directamente; la pantalla de búsqueda actual no usa `getMedidoresWithCache`.
* **Referencia cruzada:** Se vincula estrechamente con el **ADR-008** para garantizar la coherencia entre las solicitudes HTTP y la persistencia local de la cola de sincronización.

## Verificación
* Verificar la presencia de `axios` en `package.json`.
* Comprobar en `src/services/api.ts` la configuración de Axios y el timeout.
* Probar por separado que `getMedidoresWithCache` devuelva datos de caché cuando no haya conexión o falle la solicitud.
* Verificar qué pantallas invocan el servicio de caché y cuáles realizan solicitudes directas.

## Uso de IA
Se le pidió a la IA proponer una forma de centralizar las solicitudes HTTP y manejar fallos de conexión. La IA recomendó usar Axios con un tiempo límite y tratamiento explícito de errores, además de recurrir a la caché cuando la API no respondiera. Se adoptó Axios y se implementó el respaldo en `getMedidoresWithCache`; la pantalla de búsqueda todavía llama a la API directamente, así que ese respaldo no está integrado en ese flujo.



