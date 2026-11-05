# Changelog

Los cambios importantes de la app móvil EPMAPS se documentan en este archivo siguiendo [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). El proyecto no registra fechas para los hitos anteriores a 1.0.0; no se asignan fechas retroactivas. La etiqueta 1.0.0 describe una versión preparada para compilar el APK, no una publicación en tiendas.

## [1.0.0] - 2026-10-26

### Añadido

- Versión candidata a compilación APK con los flujos principales de campo definidos.
- Consulta de medidores y registro de lecturas con asociación al medidor correspondiente.
- Persistencia local de medidores en caché y lecturas pendientes para operación offline.
- Indicadores de conectividad y sincronización para distinguir lecturas locales de lecturas enviadas.
- Captura de evidencia fotográfica para lecturas anómalas o medidores dañados.
- Recuperación del borrador de captura ante interrupciones del flujo.

### Verificación pendiente antes de distribuir

- Configurar credenciales y URL de MockAPI.io para el entorno de compilación.
- Validar permisos de cámara, configuración de firma y generación del APK en el entorno de entrega.
- Confirmar los colores con el manual de identidad vigente de EPMAPS.

## [0.5.0]

### Añadido

- Recuperación de borradores para reanudar formularios de lectura interrumpidos.
- Confirmación al técnico para continuar o descartar un borrador recuperado.

## [0.4.0]

### Añadido

- Cola local de lecturas pendientes en AsyncStorage para registrar sin conexión.
- Reintento de sincronización al recuperar conectividad y conservación de lecturas que aún no se han confirmado en el servidor.
- Caché local de medidores para permitir consultas en sectores con señal limitada.

## [0.3.0]

### Añadido

- Flujo de captura de lecturas asociado al código del medidor.
- Validación de valores ingresados y registro de observaciones para lecturas anómalas.
- Captura de evidencia fotográfica para anomalías y daños del medidor.

## [0.2.0]

### Añadido

- Consulta y presentación de información de medidores desde MockAPI.io.
- Primer flujo de navegación para las tareas de campo.

## [0.1.0]

### Añadido

- Autenticación inicial para el acceso del técnico a la aplicación.
- Estructura base de la app móvil en React Native con Expo y TypeScript.