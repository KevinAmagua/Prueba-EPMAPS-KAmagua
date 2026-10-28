# Modelo de Datos y Contratos (DATA_MODEL.md)
# EPMAPS — Registro de Lecturas de Medidores en Campo

Este documento define los esquemas en TypeScript, contratos de MockAPI.io y la estructura de persistencia local en `AsyncStorage` para la aplicación móvil de EPMAPS.

---

## 1. Entidades en MockAPI.io

### 1.1 `Medidor`
Representa el padrón de medidores asignados al técnico para su recorrido en campo.

#### TypeScript
```ts
export interface Medidor {
  id: string;
  codigo: string;
  cuentaContrato: string;
  titular: string;
  direccion: string;
  parroquia: string;
  lecturaAnterior: number;
  fechaLecturaAnterior: string | null;
  latitud?: number;
  longitud?: number;
  activo: boolean;
}
```

#### JSON de Ejemplo
```json
{
  "id": "medidor-1001",
  "codigo": "MTR-0001001",
  "cuentaContrato": "CT-57001001",
  "titular": "Juan Pérez",
  "direccion": "Av. Amazonas N34-120 y Corel",
  "parroquia": "Iñaquito",
  "lecturaAnterior": 128.5,
  "fechaLecturaAnterior": "2026-09-26T15:00:00.000Z",
  "latitud": -0.1807,
  "longitud": -78.4843,
  "activo": true
}
```

---

### 1.2 `Lectura`
Representa el registro de la lectura efectuada en campo por el operador.

#### TypeScript
```ts
export type EstadoMedidor = 'normal' | 'inaccesible' | 'dañado';

export interface Lectura {
  id: string;
  medidorId: string;
  codigoMedidor: string;
  lecturaActual: number;
  fechaLectura: string;
  estado: EstadoMedidor;
  observacion?: string;
  fotoUrl?: string;
}

export type NuevaLectura = Omit<Lectura, 'id'>;
```

#### JSON de Ejemplo (Lectura Normal)
```json
{
  "medidorId": "medidor-1001",
  "codigoMedidor": "MTR-0001001",
  "lecturaActual": 136.2,
  "fechaLectura": "2026-10-26T14:30:00.000Z",
  "estado": "normal"
}
```

#### JSON de Ejemplo (Lectura con Anomalía y Evidencia)
```json
{
  "medidorId": "medidor-1001",
  "codigoMedidor": "MTR-0001001",
  "lecturaActual": 936.2,
  "fechaLectura": "2026-10-26T14:30:00.000Z",
  "estado": "dañado",
  "observacion": "Incremento inusual superior al 500% respecto al promedio histórico.",
  "fotoUrl": "https://api.mockapi.io/evidences/lectura-1001.jpg"
}
```

---

## 2. Almacenamiento Local en `AsyncStorage`

Toda la persistencia local se realiza serializando objetos a formato JSON mediante `JSON.stringify` y deserializando con `JSON.parse` bajo estrictos bloques de control de errores.

### 2.1 Caché de Medidores (`@medidores_cache`)
- **Propósito:** Almacena el listado completo de medidores descargados para permitir consultas offline durante la ruta.
- **Tipo TypeScript:** `Medidor[]`

```json
[
  {
    "id": "medidor-1001",
    "codigo": "MTR-0001001",
    "cuentaContrato": "CT-57001001",
    "titular": "Juan Pérez",
    "direccion": "Av. Amazonas N34-120 y Corel",
    "parroquia": "Iñaquito",
    "lecturaAnterior": 128.5,
    "fechaLecturaAnterior": "2026-09-26T15:00:00.000Z",
    "activo": true
  }
]
```

---

### 2.2 Cola de Sincronización Offline (`@sync_queue`)
- **Propósito:** Almacena las lecturas capturadas sin conexión para ser enviadas automáticamente al servidor cuando se restablezca la conectividad.
- **Tipo TypeScript:**

```ts
export interface PendingSyncItem {
  localId: string;
  creadaEn: string;
  intentos: number;
  ultimoError?: string;
  sincronizado: false;
  fotoLocalUri?: string;
  lectura: NuevaLectura;
}

export type ColaSincronizacion = PendingSyncItem[];
```

- **Ejemplo JSON:**
```json
[
  {
    "localId": "local-lectura-5001",
    "creadaEn": "2026-10-26T14:30:00.000Z",
    "intentos": 0,
    "sincronizado": false,
    "fotoLocalUri": "file:///data/app/pending-reading-photos/local-lectura-5001.jpg",
    "lectura": {
      "medidorId": "medidor-1001",
      "codigoMedidor": "MTR-0001001",
      "lecturaActual": 136.2,
      "fechaLectura": "2026-10-26T14:30:00.000Z",
      "estado": "normal"
    }
  }
]
```

`fotoLocalUri` es la copia persistente local de la evidencia y no se envía al API. Al sincronizar, la app sube el archivo a Supabase Storage y coloca la URL resultante en `lectura.fotoUrl`. El identificador `localId` se mantiene al reintentar y puede utilizarse como clave de idempotencia si el servicio remoto lo admite. No dependas de que MockAPI.io aplique deduplicación automáticamente.

#### Configuración de Supabase Storage

- `EXPO_PUBLIC_SUPABASE_URL` debe ser la URL base del proyecto (`https://<project-ref>.supabase.co`), sin `/rest/v1`.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` debe contener la publishable/anon key, nunca una `service_role` o secret key.
- Debe existir el bucket `medidores-fotos`. El código genera una URL pública con `getPublicUrl`; para que esa URL abra la evidencia, el bucket debe permitir lectura pública. Define políticas de escritura apropiadas para la app.
- No habilites escritura anónima irrestricta para una app de producción. La app actual debe integrar una identidad autenticada y reglas de Storage limitadas antes de usar datos reales.

---

### 2.3 Sesión del Técnico (`@auth_session`)
- **Propósito:** Almacena la información de autenticación y credenciales de la sesión activa del operador en campo.
- **Tipo TypeScript:**
```ts
export interface SesionTecnico {
  tecId: string;
  nombre: string;
  usuario: string;
  token: string;
  ultimoAcceso: string;
}
```

- **Ejemplo JSON:**
```json
{
  "tecId": "TECH-042",
  "nombre": "Esteban Quito",
  "usuario": "equito_epmaps",
  "token": "mock-jwt-token-epmaps-2026",
  "ultimoAcceso": "2026-10-26T08:00:00.000Z"
}
```

---

### 2.4 Borrador de Formulario (`@draft_form`)
- **Propósito:** Persiste el progreso en tiempo real de la lectura que se está ingresando para evitar pérdida de datos ante cierres forzosos de la aplicación (R8).
- **Tipo TypeScript:**
```ts
export interface BorradorFormulario {
  medidorId: string;
  lecturaActual: string;
  estado: EstadoLectura;
  observacion: string;
  fotoUri: string | null;
  actualizadoEn: string;
}
```

- **Ejemplo JSON:**
```json
{
  "medidorId": "medidor-1001",
  "lecturaActual": "136.2",
  "estado": "normal",
  "observacion": "",
  "fotoUri": null,
  "actualizadoEn": "2026-10-26T14:28:10.000Z"
}
```
