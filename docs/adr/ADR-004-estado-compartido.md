# ADR-004: Usar estado local y hooks personalizados para formularios y conectividad

## Estado
Aceptado.

## Fecha
2026-10-28

## Requisitos relacionados
R1, R8 (Recuperación de borradores en formulario multitarea).

## Contexto
La aplicación mantiene información de sesión, borradores de captura y estado de red. En la implementación actual, la sesión se gestiona mediante funciones de servicio, el borrador por medidor mediante `useMeterForm` y AsyncStorage, y la conectividad mediante `useNetworkStatus`. No se utiliza React Context ni una biblioteca de estado global.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **Estado local, servicios y hooks personalizados (implementación actual)** | Aprovecha React y los servicios existentes; los hooks encapsulan la recuperación y persistencia de borradores y el estado de conectividad. | No proporciona por sí solo un almacén global compartido; el estado no persiste entre pantallas salvo que el servicio o hook lo guarde explícitamente. |
| **React Context** | Permite compartir valores entre componentes sin pasar props por varios niveles. | Requiere definir y mantener proveedores; cambios frecuentes pueden volver a renderizar componentes consumidores. |
| **Zustand** | Ofrece estado global con suscripciones selectivas y una API compacta. | Añade una dependencia y una capa de estado que el alcance actual no utiliza. |

## Decisión
La implementación utiliza hooks y servicios por responsabilidad: `useMeterForm` mantiene y persiste el borrador del medidor activo; `useNetworkStatus` observa la conectividad y la cola; `src/services/auth.ts` lee y escribe la sesión. No hay `AuthContext`, `FormContext` ni hook `useAuth` en el código actual. Se decide mantener la gestión de estado mediante hooks y servicios especializados. useMeterForm administra los borradores, useNetworkStatus controla la conectividad y auth.ts gestiona la sesión. No se utiliza React Context ni una biblioteca de estado global, ya que el alcance actual de la aplicación no lo requiere y una solución más compleja no aportaría beneficios significativos.

## Consecuencias
* No se agrega una biblioteca de estado global externa.
* El hook del formulario persiste el borrador en AsyncStorage ante cambios de estado; actualmente no aplica *debounce*.
* **Riesgo / Desventaja:** La persistencia y el estado compartido dependen de cada hook o servicio. Si crecen las necesidades de estado transversal, será necesario evaluar Context u otra solución.

## Verificación
* Verificar la implementación del borrador en `src/hooks/useMeterForm.ts` y la conectividad en `src/hooks/useNetworkStatus.ts`.
* Comprobar que la sesión se gestiona desde `src/services/auth.ts` y que no se afirme el uso de Context si no se incorpora al código.

## Uso de IA
Se le pidió a la IA comparar opciones para manejar sesión, borradores y conectividad. La IA sugirió Redux Toolkit como almacén global. No se adoptó esa propuesta: la implementación actual mantiene el formulario y la conectividad en hooks y la sesión en un servicio, sin React Context ni una biblioteca de estado global. Esta decisión corresponde al alcance actual y podría revisarse si más pantallas necesitan compartir estado complejo.




