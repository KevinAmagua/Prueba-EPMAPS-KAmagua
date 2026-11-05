# Guion de video: demostración, login, animaciones, Uniwind y Firebase

Guion paso a paso para un video de aproximadamente **4–5 minutos**. El orden empieza con la app y sus animaciones para que el público vea el resultado antes de recorrer el código y explicar las librerías.

## Preparación

1. Inicia la app en la pantalla de login y deja abierta la vista de autenticación.
2. Ten listos en el editor los archivos de la sección [Orden del recorrido por el código](#orden-del-recorrido-por-el-código).
3. Para demostrar el error sin usar una cuenta, deja vacío el correo y pulsa **Ingresar**.
4. Si mostrarás un acceso correcto, prepara una cuenta de prueba verificada. No grabes ni reveles la contraseña; introdúcela fuera de cámara o tapa los campos durante la captura.
5. No muestres `.env`, claves de Firebase, tokens ni credenciales.

## Monólogo y acciones, en el orden de grabación

### 0:00–0:15 — Abrir con la app

**Mostrar:** el login en el emulador o teléfono. Deja que aparezca la gota y la tarjeta; no abras todavía el editor.

**Decir:**  
“Voy a empezar mostrando la experiencia del inicio de sesión y sus animaciones. Después explicaré paso a paso qué parte del código produce cada efecto y cómo se integran Reanimated, Uniwind y Firebase.”

### 0:15–1:20 — Demostrar las animaciones

**Mostrar y hacer, en este orden:**  
1. Si la pantalla aún no está abierta, entra al login para ver la gota EPMAPS y la tarjeta aparecer.  
2. Toca el campo de correo y luego el de contraseña.  
3. Pulsa **Ingresar** con el correo vacío para mostrar el error.  
4. Pulsa y suelta un botón habilitado para apreciar su compresión y rebote.

**Decir:**  
“Al abrir el login, la gota EPMAPS aparece con un rebote y la tarjeta entra desde arriba con un resorte. Ahora toco los campos: el borde cambia al azul institucional y se resalta el campo activo. Para ver la respuesta de validación, pulso Ingresar sin completar el correo: el formulario hace un movimiento lateral y el mensaje entra suavemente. Finalmente pulso y suelto el botón para ver cómo se comprime y rebota a su tamaño normal.

Estas animaciones tienen un propósito funcional: indicar dónde estamos, qué campo está activo, cuándo algo salió mal y que el toque fue recibido. No bloquean el formulario ni sustituyen los mensajes.”

### 1:20–1:45 — Mostrar el inicio de sesión

**Mostrar:** si tienes una cuenta de prueba verificada, inicia sesión y deja ver la navegación a las pestañas principales. Mantén las credenciales ocultas. Si no tienes una cuenta disponible, conserva el login y señala los campos; no simules un acceso exitoso.

**Decir:**  
“El usuario puede ingresar con su correo y contraseña. Mientras se procesa la solicitud, el botón muestra carga. Si Firebase acepta la cuenta verificada, se abre la sección principal; si la cuenta requiere verificación, se dirige al flujo correspondiente. Ya vimos la experiencia; ahora voy a seguir el recorrido en el código.”

### 1:45–2:15 — Paso 1: pantalla y flujo de autenticación

**Mostrar:** `src/app/login.tsx`; enfoca `LoginScreen` y `enviarFormulario`.

**Decir:**  
“El primer paso del código está en `login.tsx`. Aquí se guardan correo, contraseña, error y carga. `enviarFormulario` valida el correo y comprueba que la contraseña no esté vacía. Si falta información, actualiza el mensaje y cambia `shakeKey`; ese cambio es la señal para reproducir el aviso animado. Si la validación pasa, llama a `iniciarSesion`. En éxito navega a las pestañas; en error no verificado dirige a verificación y los demás errores se convierten en mensajes legibles.”

### 2:15–3:20 — Paso 2: componentes y cómo funcionan las animaciones

**Mostrar:** `src/components/auth-ui.tsx`, en este orden: `AuthScreen`, `AuthInput`, `AuthFeedback` y `AuthButton`. Después muestra `src/components/animated-icon.tsx`, `AnimatedBrandMark`.

**Decir:**  
“El segundo paso está en los componentes reutilizables. `AnimatedBrandMark` envuelve la gota en `Animated.View` y usa `BounceIn.duration(650)`: la entrada se reproduce cuando el componente se monta.

En `AuthScreen`, `FadeInDown.springify()` anima la entrada de la tarjeta con un resorte. Para los campos, `AuthInput` guarda un valor compartido que empieza en cero. Al enfocar, pasa a uno con `withTiming` en 180 milisegundos; al desenfocar vuelve a cero. `useAnimatedStyle` lee ese valor y cambia el color y grosor del borde, además de escalar un poco el contenedor. `interpolateColor` convierte el progreso numérico en un color entre borde neutral y azul.

Cuando cambia `shakeKey`, `AuthScreen` usa `withSequence` para ejecutar los desplazamientos laterales uno tras otro y terminar en cero. `AuthFeedback` anima la aparición del mensaje con `FadeInDown`. En conjunto, el movimiento y el texto forman un solo aviso de error.

`AuthButton` usa otro valor compartido para la escala: `onPressIn` aplica un resorte que lo comprime; `onPressOut` ejecuta la secuencia de rebote y vuelve a uno. Reanimated actualiza esos estilos animados sin tener que cambiar manualmente el diseño en cada fotograma.”

### 3:20–3:50 — Paso 3: integración de Reanimated y Uniwind

**Mostrar:** `package.json`, `metro.config.js`, `src/global.css` y el import inicial de `src/app/_layout.tsx`.

**Decir:**  
“Reanimated y React Native Worklets están instalados en las versiones del proyecto para Expo SDK 57. Expo configura automáticamente el soporte de Babel con `babel-preset-expo`; no hay que añadir un plugin manual. Los valores compartidos guardan el progreso, los controladores como `withTiming` y `withSpring` definen cómo cambia, y `useAnimatedStyle` conecta ese cambio con la vista.

Uniwind se registra en la configuración de Metro, que apunta a `src/global.css`. El CSS importa Tailwind y Uniwind, y el layout raíz carga esa hoja global. Esta configuración habilita la migración a `className`, pero no convierte por sí sola los estilos existentes: el formulario todavía usa `StyleSheet`.”

### 3:50–4:40 — Paso 4: Firebase y cierre

**Mostrar:** `src/config/firebase.ts`, `src/config/firebase-auth.ts`, `src/config/firebase-auth.web.ts` y `src/context/sesion.tsx`. No abras valores secretos.

**Decir:**  
“Firebase se inicializa desde `src/config/firebase.ts`. En Android e iOS, Auth conserva la sesión en AsyncStorage; en web usa la persistencia local del navegador. `SesionProvider` escucha `onAuthStateChanged` para restaurar el usuario y compartir el estado de sesión.

Al iniciar sesión, el contexto llama a `signInWithEmailAndPassword`, recarga el usuario y comprueba `emailVerified`. El mismo contexto también contiene las operaciones de registro y verificación, recuperación de contraseña y cierre de sesión.

En resumen, primero vimos el resultado en la app; luego seguimos el flujo desde la pantalla hasta los componentes. Reanimated anima las respuestas visuales, Uniwind proporciona la infraestructura de estilos y Firebase gestiona la autenticación y la sesión. Con esto termina el recorrido.”

## Mapa rápido de las cinco demostraciones

| Demostración | Acción | Código |
|---|---|---|
| Rebote de la gota EPMAPS | Abrir/montar una pantalla de autenticación | `src/components/animated-icon.tsx`, `AnimatedBrandMark` |
| Entrada de la tarjeta | Abrir/montar una pantalla de autenticación | `src/components/auth-ui.tsx`, `AuthScreen` |
| Realce del campo | Tocar correo y contraseña | `src/components/auth-ui.tsx`, `AuthInput` |
| Aviso de error | Pulsar Ingresar con correo vacío | `src/app/login.tsx`, `enviarFormulario`; `src/components/auth-ui.tsx`, `AuthScreen` y `AuthFeedback` |
| Rebote del botón | Pulsar y soltar un botón habilitado | `src/components/auth-ui.tsx`, `AuthButton` |

El aviso de error reúne dos efectos coordinados —temblor del formulario y entrada del mensaje— y se presenta como una sola respuesta funcional al error.

## Orden del recorrido por el código

1. **`src/app/login.tsx`** — `LoginScreen`, estados del formulario y `enviarFormulario`.
2. **`src/components/auth-ui.tsx`** — `AuthScreen` (tarjeta y error), `AuthInput` (foco), `AuthFeedback` (mensaje) y `AuthButton` (presión).
3. **`src/components/animated-icon.tsx`** — `AnimatedBrandMark` y su entrada `BounceIn`.
4. **`package.json`** — versiones instaladas de Expo, Reanimated y Worklets.
5. **`metro.config.js`, `src/global.css`, `src/app/_layout.tsx`** — configuración, hoja de estilos global e importación de Uniwind.
6. **`src/config/firebase.ts`, `src/config/firebase-auth.ts`, `src/config/firebase-auth.web.ts`** — inicialización y persistencia de Auth por plataforma.
7. **`src/context/sesion.tsx`** — escucha de sesión y operaciones de autenticación.

## Referencias oficiales

- [Reanimated para Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/)
- [Uniwind Quickstart](https://docs.uniwind.dev/quickstart.md)
