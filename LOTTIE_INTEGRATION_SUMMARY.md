# Integración de animaciones Lottie

## Archivos agregados o actualizados

- `src/components/StatusAnimation.tsx`: componente reutilizable para mostrar los estados `loading` y `success` en un modal.
- `src/components/StatusAnimation.web.tsx`: alternativa visual para web, donde se muestra un indicador de carga y una confirmación gráfica de éxito.
- `src/components/LoginAnimation.tsx`: ilustración Lottie de acceso seguro, en bucle, mostrada en la pantalla de inicio de sesión.
- `src/components/LoginAnimation.web.tsx`: ilustración visual equivalente para web.
- `src/app/login.tsx`: incorpora la animación decorativa encima de los campos de acceso.
- `src/app/capture/[codigo].tsx`: conexión de los estados de guardado de lectura con `StatusAnimation`.
- `src/screens/ReadingsHistoryScreen.tsx` y `src/screens/MeterDetailScreen.jsx`: reutilizan el componente para mostrar la carga al consultar datos.
- `src/assets/lottie/login.json`: animación de escudo y marca de verificación para inicio de sesión.
- `src/assets/lottie/loading.json`: animación de carga en bucle.
- `src/assets/lottie/success.json`: animación de éxito de una sola reproducción.

## Integración y eventos

Al guardar una lectura, la pantalla de captura muestra la animación `loading` mientras persiste el registro en la cola local y elimina el borrador. Si ambas operaciones terminan correctamente, presenta `success`; al terminar esa animación, muestra las opciones para consultar las lecturas o iniciar otro registro. Si el guardado falla, el modal se cierra y se conserva el mensaje de error existente.

El historial y el detalle de lectura muestran `loading` mientras consultan sus datos. En plataformas nativas se utiliza `lottie-react-native`: la carga se repite (`loop`) y el éxito se reproduce una vez. En web se conserva la misma interfaz con indicadores nativos y un cierre de éxito equivalente.

La pantalla de inicio de sesión muestra la animación de acceso seguro sobre el formulario. Esta es decorativa y se reproduce en bucle; no altera ni retrasa la autenticación.

## Rutas de los JSON

- `src/assets/lottie/login.json`
- `src/assets/lottie/loading.json`
- `src/assets/lottie/success.json`

## Nota sobre persistencia

En este flujo las lecturas se guardan primero en AsyncStorage y en la cola offline; su sincronización remota usa MockAPI. Firebase se utiliza para autenticación, no como destino de guardado de lecturas. Por ello, la animación de éxito confirma el guardado local, no una confirmación de Firebase o del servidor remoto.
