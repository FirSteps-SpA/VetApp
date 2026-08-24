## Why

VetApp es una PWA que se usa en el teléfono (el veterinario en consulta, el cliente en su móvil), pero tiene tres defectos que rompen la experiencia móvil real:

- **Sin safe-area**: instalada en iOS (standalone), el header queda bajo el notch y el contenido bajo el home-indicator.
- **Nav se desborda**: la navegación del staff en móvil es un `flex` sin scroll ni wrap; con 5-6 ítems se corta o fuerza scroll horizontal de toda la página.
- **Nav móvil degradada**: la instancia móvil de la navegación no recibe `reservasPendientes` ni `esDev`, así que en teléfono no se ve el badge de reservas ni el enlace Admin.

Son fallas, no preferencias. Esta capa arregla lo roto; el rediseño de navegación (bottom nav) y la densidad de targets quedan explícitamente fuera.

## What Changes

- Se declara `viewport-fit=cover` y se respeta el **safe-area** del dispositivo: los headers fijos despejan el borde superior y el contenido despeja el borde inferior en standalone.
- La **navegación del staff en móvil** deja de desbordarse (scroll horizontal contenido, sin cortar la página).
- La navegación móvil muestra **lo mismo que la de escritorio**: badge de reservas y enlace Admin (se le pasan las props que hoy faltan).
- Se aplica también al **layout del portal** (safe-area en header y contenido).
- No es **BREAKING**; no cambia rutas ni datos.

## Capabilities

### New Capabilities
- `responsive-ui`: Comportamiento responsivo/móvil de la app — navegación primaria accesible en móvil y respeto del área segura del dispositivo en modo standalone.

### Modified Capabilities
<!-- Ninguna: primera captura de esta capacidad. -->

## Impact

- **Viewport/metadata**: `viewport-fit=cover` en el `viewport` de `src/app/layout.tsx`.
- **CSS**: utilidades de safe-area (`env(safe-area-inset-*)`) en `globals.css`.
- **Layouts**: `src/app/(staff)/layout.tsx` (header, nav móvil, main) y `src/app/portal/layout.tsx` (header, main).
- **Nav**: pasar `reservasPendientes` y `esDev` a la instancia móvil de `NavLinks`; hacer el contenedor scrollable.
- **Sin** cambios de base de datos ni de rutas.
