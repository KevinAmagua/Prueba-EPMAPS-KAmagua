# ADR-010: Validación de Lecturas Duplicadas por Mes, Consumo Estimado y Recuperación de Borradores

## Estado
Aceptado.

## Fecha
2026-10-28

## Requisitos relacionados
R8 (Recuperación y descarte de borradores), R9 (Sincronización automática y banner de red persistente) y R10 (Prevención de registros duplicados por medidor en el mismo mes y edición exclusiva de pendientes).

## Contexto
La aplicación de campo requiere garantizar la integridad y robustez de los datos registrados por los técnicos:
1. Al guardar una lectura, se debe calcular y almacenar el consumo estimado respecto a la lectura anterior.
2. Si la aplicación o el formulario se interrumpen a mitad de un registro, al volver a ingresar se debe ofrecer al usuario la opción de continuar el borrador o descartarlo (R8).
3. No se debe permitir registrar dos veces el mismo medidor en el mismo mes, validando tanto en la cola local como contra el servidor central (R10).
4. El indicador de conectividad y estado de la cola debe ser permanente en todas las pantallas (R9), y las listas deben actualizarse automáticamente al enfocar las pestañas.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **Validación dual (Cola local + API MockAPI) y Alerta de Borradores** | Cobertura total offline/online para evitar duplicados mensuales y pérdida de datos de campo sin requerir arquitecturas complejas de servidor. | Requiere manejo de excepciones cuando el servidor no está accesible (fallback a validación local). |
| **Validación exclusivamente local** | Implementación más simple sin llamadas de red adicionales al guardar. | Si los datos anteriores ya fueron sincronizados y borrados de la cola local, no detectaría el duplicado del mes actual. |

## Decisión
Se implementó:
* Cálculo automático del `consumoEstimado` en cada lectura guardada.
* Una alerta interactiva en `useMeterForm` que pregunta al usuario si desea continuar o descartar un borrador previo al abrir el formulario de un medidor.
* Una doble validación en `CaptureScreen` para R10 que comprueba contra el almacenamiento local (`@sync_queue`) y contra el servidor (`GET /lecturas`) si ya existe un registro para el medidor en el mes en curso.
* Un banner de red persistente en el layout raíz (`RootLayout`) y actualización automática de listas mediante `useFocusEffect`.

## Consecuencias
* Máxima protección contra duplicación de lecturas por período mensual tanto con conexión como sin ella.
* Mejor experiencia de usuario al no perder capturas incompletas y tener visibilidad constante de la red y elementos pendientes.

## Verificación
* Intentar registrar dos veces el mismo medidor en el mismo mes y verificar que la app muestre una alerta de duplicado.
* Interrumpir una captura y regresar para comprobar que el diálogo ofrece continuar o descartar.
* Comprobar que el banner de conectividad e indicador de pendientes aparece permanentemente en todas las vistas.
