# 🧪 Guía de Verificación y Pruebas (TESTING_GUIDE.md)
# EPMAPS — Registro de Lecturas de Medidores en Campo

Esta guía detalla el paso a paso para verificar y demostrar el cumplimiento de los **10 Requisitos Clave** durante la defensa oral de la aplicación móvil EPMAPS.

---

### R1. Autenticación y Sesión Persistente (`@auth_session`)
1. Ingrese cualquier usuario/código de técnico y contraseña en la pantalla de inicio (`login.tsx`).
2. Presione **Iniciar Sesión**. La app guardará las credenciales en `AsyncStorage` y redirigirá al menú principal (`/(tabs)`).
3. Cierre completamente la aplicación (swipe up en recientes) y vuelva a abrirla.
4. **Verificación:** La sesión se mantiene iniciada automáticamente sin volver a requerir credenciales.

---

### R2. Validación Estricta de Formato de Medidor
1. En la pantalla principal de búsqueda (`/(tabs)/index.tsx`), escriba un formato incompleto o inválido (ej. `MED-123` o `123456`).
2. Presione **Buscar Medidor**.
3. **Verificación:** La app muestra un mensaje de error amigable en rojo y **NO** realiza ninguna petición HTTP al servidor MockAPI.

---

### R3. Caché Local de Medidores (`@medidores_cache`)
1. Con conexión a internet activa, busque y consulte medidores (se descargan del MockAPI y se guardan en `@medidores_cache`).
2. Active el **Modo Avión** en el dispositivo móvil.
3. Busque nuevamente un medidor previamente consultado.
4. **Verificación:** Los datos del medidor se sirven de inmediato desde el caché local sin errores de red.

---

### R4. Operación Offline-First Integral
1. Sin conexión a internet (Modo Avión activo), complete el formulario de captura para un medidor.
2. Presione **Guardar Lectura**.
3. **Verificación:** El registro se almacena localmente y se encola en `@sync_queue` con el indicador de pendiente, mostrando confirmación instantánea.

---

### R5. Selector de Estado del Medidor y Reglas Condicionales
1. Abra el formulario de captura de cualquier medidor (`/capture/[codigo]`).
2. Seleccione entre los estados: **Normal**, **Inaccesible** o **Dañado**.
3. **Verificación:** 
   - *Normal*: Exige lectura numérica válida.
   - *Inaccesible*: Exige motivo/observación y deshabilita la lectura obligatoria.
   - *Dañado*: Exige descripción del daño con lectura opcional.

---

### R6. Detección de Consumo Anómalo y Advertencia
1. Ingrese una lectura actual que supere el triple (3x) de la lectura anterior (ej. lectura anterior: 100, lectura actual: 350).
2. Presione **Guardar Lectura**.
3. **Verificación:** Se despliega una alerta visual de **Consumo Anómalo** exigiendo confirmación explícita del operador.

---

### R7. Evidencia Fotográfica Obligatoria y Manejo de Permisos
1. Genere una condición anómale (R6) o marque el medidor como **Dañado** (R5).
2. Intente guardar sin tomar la foto.
3. **Verificación:** El sistema exige la fotografía como obligatoria, abre la cámara mediante `expo-camera` y maneja los permisos con un modal explicativo si fuesen denegados.

---

### R8. Prevención de Pérdida de Datos en Formularios (`@draft_form`)
1. Comience a llenar un formulario de captura de lectura (ingrese estado, lectura y observaciones).
2. Cierre forzosamente la aplicación a mitad del proceso.
3. Vuelva a ingresar a la pantalla de captura de ese medidor.
4. **Verificación:** Se detecta el borrador previo en `AsyncStorage` (`@draft_form_[codigo]`) y se restauran los datos ingresados.

---

### R9. Sincronización Automática en Segundo Panatalla (`@sync_queue`)
1. Observe el indicador superior (`OfflineBanner`) que muestra el conteo de lecturas pendientes acumuladas sin red.
2. Desactive el **Modo Avión** (recupere la señal de internet).
3. **Verificación:** El servicio de sincronización detecta el cambio de red mediante `NetInfo`, procesa la cola de forma automática y vacía los pendientes al servidor MockAPI.

---

### R10. Gestión de Lecturas, Edición y Prevención de Duplicados
1. Ingrese a la pestaña **Pendientes** (`/(tabs)/pending.tsx`).
2. Visualice la lista de registros locales y pendientes.
3. **Verificación:** Permite editar registros aún no sincronizados, bloquea la modificación de lecturas ya enviadas al servidor y previene registros duplicados para el mismo medidor en el mismo periodo.
