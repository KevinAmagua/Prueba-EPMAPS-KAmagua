# ADR-009: No adoptar formalmente SDD ni agentes especializados en esta iteración

## Estado
Aceptado

## Fecha
2026-10-28

## Requisitos relacionados
No aplica directamente a un requisito funcional. Se relaciona con la planificación, implementación y documentación del proyecto.

## Contexto
En esta iteración no se estableció un proceso formal de *Spec-Driven Development* (SDD), con especificaciones como fuente de verdad y trazabilidad sistemática entre requisitos, diseño, tareas y pruebas. Tampoco se definió un flujo de trabajo basado en agentes especializados que ejecutaran tareas independientes o coordinadas. Este ADR registra esa decisión de proceso; no implica que no se hayan utilizado herramientas de IA conversacional como apoyo.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **Desarrollo iterativo sin SDD formal ni agentes especializados (situación actual)** | Mantiene el flujo de trabajo directo y evita establecer herramientas, documentos o coordinación adicionales. | Puede dejar decisiones y trazabilidad distribuidas entre código, requisitos y ADR; la revisión y ejecución de tareas dependen de la persona que desarrolla. |
| **SDD formal** | Hace explícitas las especificaciones y facilita relacionar requisitos, decisiones, implementación y criterios de aceptación. | Requiere crear y mantener especificaciones y adaptar el flujo de trabajo cuando cambian los requisitos. |
| **Agentes especializados** | Pueden abordar tareas independientes en paralelo y aportar revisiones enfocadas. | Requieren delimitar tareas, integrar resultados y verificar consistencia; la delegación no elimina la revisión humana. |
| **SDD con agentes** | Combina especificaciones trazables con ejecución y revisión paralelas. | Tiene mayor coste de adopción y coordinación; necesita un proceso claro para mantener alineados los artefactos, el código y los resultados de los agentes. |

## Decisión
Para esta iteración no se adopta formalmente SDD ni un proceso con agentes especializados. Y para una aplicación React Native pequeña como esta, se puede usar unicamente el chat de una IA + documentación de archivos .md puede ser tambien mas eficiente que montar un flujo complejo con SDD y agentes especializados.

## Consecuencias
* El proyecto no exige que cada cambio se origine en una especificación formal ni que se ejecute mediante agentes.
* Los ADR documentan decisiones de arquitectura, pero no constituyen por sí solos un proceso completo de SDD ni una matriz de trazabilidad requisito-código-prueba.
* **Riesgo / Desventaja:** La ausencia de especificaciones vinculadas a criterios de aceptación puede dificultar comprobar cobertura y detectar requisitos omitidos. La ausencia de agentes puede reducir el paralelismo disponible en tareas que sí sean independientes.
* La decisión puede revisarse si cambian el tamaño del proyecto, la cantidad de colaboradores, la frecuencia de cambios o las necesidades de trazabilidad.

## Verificación
* Revisar si el repositorio contiene especificaciones que sean la fuente de verdad del desarrollo y una trazabilidad mantenida hacia implementación y pruebas.
* Revisar si existe un flujo documentado de agentes con responsabilidades, límites de tarea y revisión de resultados.
* Si se adopta cualquiera de esos procesos, actualizar el estado de este ADR y registrar el alcance, los criterios de aceptación y la forma de evaluar su utilidad.

## Uso de IA
Se consultó a la IA para preparar este ADR sobre la decisión de no adoptar formalmente SDD ni agentes especializados. La IA organizó alternativas, posibles consecuencias y riesgos. 


