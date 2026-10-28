# ADR-007: Usar Expresiones Regulares (RegEx) y Validaciones de Negocio Nativas para entradas del usuario

## Estado
Aceptado.

## Fecha
2026-10-28

## Requisitos relacionados
R2 (Validación estricta del código de medidor), R5 (Estados del medidor) y R6 (Lógica de consumo anómalo).

## Contexto
La aplicación debe validar el código con el formato `MED-` seguido de 6 dígitos (R2), requerir los campos correspondientes a los estados Normal, Inaccesible y Dañado (R5), y pedir confirmación cuando la lectura actual supere tres veces la lectura anterior (`lecturaActual > lecturaAnterior * 3`) (R6). La regla implementada compara con la lectura anterior, no con un promedio mensual.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **Expresiones Regulares (RegEx) + Funciones TypeScript nativas** | Cero dependencias adicionales. Rendimiento inmediato al evaluar strings y números durante la escritura. | La lógica de validaciones condicionales complejas se escribe a mano en controladores o utilidades. |
| **Zod / React Hook Form** | Declaración formal de esquemas con inferencia de tipos estricta y gestión de errores en formularios. | Agrega librerías externas adicionales al proyecto para reglas de negocio que pueden resolverse con condicionales simples. |

## Decisión
Se utilizan expresiones regulares nativas (`/^MED-\d{6}$/`) y funciones utilitarias en `src/utils/validators.ts`. La pantalla aplica la validación del código, y el formulario de captura comprueba los datos requeridos y solicita confirmación para la lectura anómala.

## Consecuencias
* Mantener la aplicación liviana sin dependencias de esquemas externas.
* **Riesgo / Desventaja:** Las expresiones regulares estrictas deben probarse con múltiples casos de borde para evitar bloquear entradas válidas del técnico.

## Verificación
* Probar que el campo de búsqueda rechace códigos como `MED-12345` (incompleto) o `123456` (sin prefijo).
* Verificar que una lectura actual superior a tres veces la lectura anterior requiera confirmación explícita antes de guardar.
* Comprobar los campos requeridos en cada estado del medidor.

## Uso de IA
Se le pidió a la IA comparar validaciones nativas con una biblioteca de esquemas para los campos de lectura. La IA recomendó evaluar Zod para declarar reglas y mensajes de validación. Se descartó añadir esa dependencia para las reglas actuales; se utilizaron una expresión regular y validaciones TypeScript en `src/utils/validators.ts` y en el formulario de captura.

