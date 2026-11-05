# ADR-002: Usar AsyncStorage para el almacenamiento local y la persistencia en el dispositivo

## Estado
Aceptado.

## Fecha
2026-10-28

## Requisitos relacionados
R1, R3, R4, R8 y R9.

## Contexto
Los técnicos realizan lecturas en zonas sin cobertura de red. La app necesita almacenar localmente la sesión del usuario (R1), guardar en caché la información de los medidores consultados (R3), persistir borradores de formularios interrumpidos (R8) y mantener una cola de lecturas pendientes por sincronizar (R4, R9).

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **AsyncStorage (`@react-native-async-storage/async-storage`)** | Solución ligera clave-valor, madura, altamente compatible con Expo y suficiente para estructuras JSON no relacionales pequeñas. | Operaciones de lectura/escritura asíncronas no optimizadas para consultas complejas o grandes volúmenes de datos relacionales. |
| **SQLite (`expo-sqlite`)** | Motor de base de datos relacional con soporte para consultas SQL complejas. | Agrega complejidad innecesaria de esquemas y migraciones para los requerimientos ligeros de caché y cola de la prueba. |

## Decisión
Se utiliza **AsyncStorage** para persistir datos JSON bajo las claves `@auth_session`, `@medidores_cache` y `@sync_queue`. Los borradores se almacenan por medidor con la clave `@draft_form_${codigoMedidor}`. Se utiliza AsyncStorage para persistir la sesión, la caché de medidores, los borradores y la cola de sincronización, permitiendo que la aplicación continúe operando correctamente en entornos con conectividad limitada o inexistente.

## Consecuencias
* La sesión, los borradores y la cola pueden leerse o guardarse localmente sin conexión. Los datos de medidores pueden recuperarse desde la caché mediante el servicio correspondiente.
* **Riesgo / Desventaja:** AsyncStorage no ofrece consultas relacionales ni cifrado propio y no es adecuado para grandes volúmenes de datos. El alcance actual se limita a registros JSON y una caché pequeña; la información sensible requiere valorar por separado sus necesidades de protección.

## Verificación
* Revisar en `package.json` la dependencia `@react-native-async-storage/async-storage`.
* Comprobar la persistencia de sesión, caché, borradores por código y cola en las claves utilizadas por `src/services/auth.ts`, `src/services/cache.ts`, `src/services/syncQueue.ts` y `src/hooks/useMeterForm.ts`.
* Probar que `getMedidoresWithCache` en `src/services/cache.ts` recupere la caché si no hay conectividad o falla la API.

## Uso de IA
Se le pidió a la IA comparar AsyncStorage con SQLite para guardar sesiones, borradores y lecturas pendientes sin conexión. La IA recomendó considerar SQLite para consultas y volúmenes de datos mayores. Se eligió AsyncStorage para el alcance actual porque los datos se guardan como estructuras JSON sencillas; se reconoce que habría que reconsiderar la decisión si se necesitan consultas relacionales, más volumen o requisitos de protección adicionales.

