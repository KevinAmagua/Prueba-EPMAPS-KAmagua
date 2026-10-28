# ADR-008: Usar AsyncStorage y NetInfo para la cola persistente de sincronización offline

## Estado
Aceptado.

## Fecha
2026-10-28

## Requisitos relacionados
R4 (Operatividad sin red) y R9 (Sincronización de lecturas pendientes).

## Contexto
La aplicación debe permitir guardar lecturas en zonas sin cobertura y procesarlas cuando haya conexión. Esta decisión se centra en la cola durable de escrituras: las lecturas se guardan en AsyncStorage y NetInfo permite intentar procesarlas cuando la aplicación observa conectividad. La caché de consultas de medidores se describe por separado en ADR-002 y ADR-003. TanStack Query puede administrar y persistir cachés de consultas, pero una cola de escrituras de dominio con fotos, estados por elemento y reintentos requiere lógica de mutaciones y persistencia adicional.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **AsyncStorage + NetInfo (elegida)** |  Control total y determinista del ciclo de vida de la cola de escrituras. Persistencia local garantizada de URIs fotográficas (`expo-camera`) y metadatos de campo. Implementación ligera sin sobrecarga de dependencias externas adicionales, ideal para despliegues en dispositivos móviles limitados. |  Requiere lógica manual de reintentos, control de estados por ítem y gestión de concurrencia. La sincronización automática ocurre en primer plano al detectar conectividad mediante `NetInfo`. |
| **TanStack Query** |  Excelente gestión declarativa para caché de consultas (queries), invalidación y reintentos automáticos en red. Integración estándar para sincronización de datos remotos basados en servidor. |  Diseñado principalmente para sincronización de servidores y consultas remotas, no como una cola transaccional persistente de escrituras locales (mutaciones complejas con archivos adjuntos/fotos). Incrementa la complejidad de configuración y añade una dependencia pesada no requerida por el dominio de campo. |

## Decisión
Se decide mantener la cola de escrituras de dominio con **AsyncStorage** y **`@react-native-community/netinfo`** (R4, R9). AsyncStorage persiste los elementos bajo `@sync_queue`; `processSyncQueue` procesa los registros, conserva el estado de sincronización y registra errores. No se incorpora TanStack Query para esta cola. Esta decisión no implica que TanStack Query sea incompatible con Expo ni que no pueda gestionar una caché de consultas. Dado que los requisitos actuales exigen una cola persistente de control detallado del ciclo de vida de las operaciones, AsyncStorage y NetInfo proporcionar una solución mas simple, predecible y alineada con los objetivos del sistema.

## Consecuencias
* `src/services/syncQueue.ts` implementa la persistencia y el procesamiento de la cola; `src/hooks/useNetworkStatus.ts` observa la conexión mientras la aplicación está activa.
* Los elementos sincronizados se marcan en la cola; la implementación no los elimina automáticamente.
* **Riesgo / Desventaja:** La sincronización no es una tarea nativa de fondo. La caché de medidores tiene un servicio separado y no todas las pantallas lo utilizan; esta decisión tampoco aporta invalidación automática de consultas.
* **Referencia cruzada:** Se vincula con el **ADR-003** para coordinar el comportamiento del cliente HTTP al interactuar con la API central y la caché local de medidores (R3).

## Verificación
* Comprobar en `package.json` la ausencia de `@tanstack/react-query`.
* Verificar en `src/services/syncQueue.ts` la escritura de elementos, los intentos de envío y la actualización de su estado.
* Simular una lectura sin conexión, cerrar y volver a abrir la aplicación, y comprobar que el elemento persiste y se procesa al recuperar conexión con la aplicación activa.
* Comprobar por separado el respaldo de consultas de medidores descrito en ADR-003.

## Uso de IA
Se le pidió a la IA evaluar TanStack Query para el manejo de datos offline. La IA recomendó considerar la persistencia de su caché con AsyncStorage. Se decidió no incorporar TanStack Query para la cola de lecturas porque esta también conserva fotos locales, el estado de cada elemento y sus reintentos; esa lógica de dominio se implementó explícitamente en `src/services/syncQueue.ts`. La decisión se limita a la cola y no afirma que TanStack Query sea incompatible con Expo ni que no pueda gestionar cachés de consultas.

