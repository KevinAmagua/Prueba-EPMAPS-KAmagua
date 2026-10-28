# EPMAPS UI STYLE GUIDE
# Material Design 3 + Fluent Design

Versión: 1.0

---

# Filosofía de Diseño

La interfaz de EPMAPS deberá combinar:

- Material Design 3 como base funcional.
- Microsoft Fluent Design como referencia visual corporativa.

El objetivo es crear una aplicación que transmita:

- Profesionalismo.
- Confiabilidad.
- Eficiencia operativa.
- Claridad visual.
- Robustez institucional.

La estética debe parecer un sistema utilizado por técnicos de infraestructura crítica y no una aplicación de consumo o red social.

---

# Distribución de Influencia

Material Design 3: 70%

Fluent Design: 30%

---

# Principios Visuales

## Claridad Primero

Toda pantalla debe permitir identificar rápidamente:

- Ubicación actual.
- Medidor seleccionado.
- Acción principal.

No usar elementos visuales que distraigan.

---

## Información Jerarquizada

La información debe organizarse en niveles visuales claros:

1. Acción principal.
2. Información crítica.
3. Información secundaria.
4. Información contextual.

---

## Prioridad Operativa

La velocidad y precisión son más importantes que la apariencia decorativa.

---

# Componentes Material Design 3

La aplicación debe utilizar:

- Top App Bar
- Bottom Navigation
- Cards
- Floating Action Button (cuando aplique)
- Snackbars
- Dialogs
- Inputs Outlined
- Lists
- Tabs
- Chips
- Progress Indicators

Respetar los patrones oficiales de Material Design 3.

---

# Elementos Tomados de Fluent Design

## Espaciado Generoso

Mantener espacios amplios entre:

- Secciones
- Tarjetas
- Formularios
- Botones

Evitar interfaces saturadas.

---

## Tarjetas Elevadas

Las tarjetas deben:

- Tener sombras suaves.
- Bordes redondeados.
- Aspecto limpio.
- Separar claramente los bloques de información.

---

## Jerarquía Empresarial

Utilizar:

- Títulos claros.
- Subtítulos descriptivos.
- Datos destacados.

El usuario nunca debe preguntarse dónde mirar.

---

## Simplicidad Visual

Reducir:

- Bordes innecesarios.
- Decoraciones.
- Animaciones excesivas.

---

# Sombras

Utilizar sombras suaves y modernas.

Ejemplo:

Elevación baja:

```css
0px 2px 8px rgba(0,0,0,0.08)
```

Elevación media:

```css
0px 4px 12px rgba(0,0,0,0.12)
```

No usar sombras fuertes o dramáticas.

---

# Bordes

Border Radius estándar:

```text
12dp
```

Elementos principales:

```text
12dp - 16dp
```

Inputs:

```text
12dp
```

Tarjetas:

```text
16dp
```

---

# Transparencias y Blur

Permitido únicamente en:

- Modal de usuario.
- Menús secundarios.
- Pantalla de bienvenida.

Intensidad máxima:

```text
Blur suave
```

No utilizar glassmorphism completo.

---

# Animaciones

Las animaciones deben ser:

- Cortas.
- Útiles.
- Discretas.

Duración recomendada:

```text
150ms - 250ms
```

Usar:

- Fade
- Scale
- Slide

Evitar:

- Rebotes exagerados.
- Giros.
- Efectos llamativos.

---

# Diseño de Tarjetas

Cada tarjeta debe contener:

- Información principal visible.
- Estado visual.
- Acción inmediata.

Ejemplo:

Código Medidor

00124589

Cliente:
Juan Pérez

Última Lectura:
1254 m³

[ Registrar Lectura ]

---

# Formularios

Los formularios deben priorizar:

- Campos grandes.
- Alto contraste.
- Espaciado amplio.
- Navegación sencilla.

No utilizar formularios densos.

---

# Estados Visuales

Todos los estados deben combinar:

- Color.
- Icono.
- Texto.

Nunca comunicar información únicamente mediante color.

Ejemplo:

✅ Lectura registrada

⚠ Consumo anómalo

❌ Error de sincronización

---

# Estética General

Debe sentirse similar a:

- Microsoft Field Service
- Power Apps
- ArcGIS