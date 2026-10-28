# ADR-001: Usar Expo Router para la navegación basada en archivos

## Estado
Aceptado.

## Fecha
2026-10-28

## Requisitos relacionados
R8 (Persistencia de borradores e interrupciones) y R1 (Autenticación y navegación basada en sesión).

## Contexto
La aplicación contiene pantallas de acceso, búsqueda de medidores, captura de lectura, lecturas y perfil. Las rutas se organizan mediante layouts de Stack y Tabs dentro de `src/app/`. Al iniciar, la aplicación consulta la sesión guardada y redirige al acceso o a las pestañas. El borrador se recupera al abrir la captura del medidor correspondiente; no se navega automáticamente a una ruta de borrador independiente.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **Expo Router** | Integrado en el proyecto Expo. La navegación basada en archivos hace explícitas las rutas y permite definir layouts Stack y Tabs. | Requiere respetar la convención de rutas dentro de `src/app/`; los archivos de pantalla en esa carpeta se interpretan como rutas. |
| **Configuración manual de React Navigation** | Permite declarar y configurar los navegadores directamente. | Requiere mantener manualmente el registro de rutas, navegadores y opciones de navegación. |

## Decisión
Se utiliza **Expo Router** para declarar las rutas y layouts de la aplicación, además que ya viene siendo parte del proyecto generado y su navegación basada en archivos en `src/app/`, incluidos el acceso, las pestañas y la captura de lecturas. Se adopta Expo Router para la navegación de la aplicación, aprovechando su sistema de rutas basado en archivos y su integración nativa con Expo. Esta solución simplifica la organización de pantall  as y layouts (Stack y Tabs), facilita la redirección según el estado de la sesión y se ajusta a la estructura actual del proyecto sin requerir configuraciones adicionales.

## Consecuencias
* No se agregan librerías de navegación de terceros al `package.json`.
* Los componentes auxiliares, servicios y hooks se mantienen fuera de `src/app/` para no generar rutas indeseadas.
* **Riesgo / Desventaja:** La lectura de la sesión y la restauración del borrador son asíncronas; las pantallas deben contemplar su estado de carga para evitar mostrar información incompleta.

## Verificación
* `src/app/` contiene los layouts y las rutas de la aplicación.
* La ruta inicial redirige según la sesión existente y el botón de retroceso nativo de Android permite regresar entre las pantallas.
* Al abrir la captura de un medidor con borrador, se restauran sus campos desde AsyncStorage.

## Uso de IA
Se le pidió a la IA comparar Expo Router con React Navigation para una aplicación de registro en varios pasos. La IA recomendó Expo Router, coincidiendo con la decisión. Se descartó su sugerencia de guardar el paso actual en los parámetros de la ruta, porque esos parámetros no se restauran automáticamente al cerrar y volver a abrir la aplicación, por lo que no resuelven R8.
