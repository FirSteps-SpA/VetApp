## Context

Los layouts staff y portal usan un `<header className="sticky top-0">` y un `<main>`. Tailwind no trae utilidades de safe-area por defecto. El `viewport` se define en `src/app/layout.tsx` (hoy sin `viewport-fit`). `NavLinks` acepta `reservasPendientes` y `esDev`, pero el layout staff los pasa solo a la instancia de escritorio. Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Que en standalone (iOS/Android) nada quede tapado por notch ni home-indicator.
- Que la navegación móvil sea usable sin cortar contenido ni perder funciones.

**Non-Goals:**
- Bottom navigation bar (Capa 2, cambio aparte).
- Rediseño de densidad / tamaños de touch target (Capa 2).
- Cambiar la navegación de escritorio.

## Decisions

**Safe-area con `env()` + utilidades Tailwind.** Se agrega `viewport-fit=cover` (necesario para que `env(safe-area-inset-*)` reporte valores) y unas utilidades en `globals.css` (p. ej. `.pt-safe`, `.pb-safe`, y padding lateral) que usan `env(safe-area-inset-*)`. *Alternativa rechazada:* estilos inline por elemento — repetitivo y fácil de olvidar.

**Dónde se aplica el inset.** Top inset → al header fijo (su padding superior despeja el notch). Bottom inset → al `main` (el contenido despeja el home-indicator al hacer scroll hasta el final). Insets laterales → al contenedor, para el notch en landscape. Se hace en ambos layouts (staff y portal).

**Overflow del nav móvil → scroll horizontal contenido.** El contenedor del nav móvil pasa a `overflow-x-auto` con `flex-nowrap` (y ocultar la barra de scroll), de modo que los ítems se deslizan en una línea sin cortar la página. *Alternativa rechazada:* envolver a dos líneas — header más alto y sigue apretado. *Alternativa diferida:* bottom nav — es Capa 2.

**Paridad de la nav móvil.** Se pasan `reservasPendientes` y `esDev` a la instancia móvil de `NavLinks` (hoy se omiten). Es la corrección de la regresión, sin lógica nueva.

## Risks / Trade-offs

- **`env(safe-area-inset-*)` es 0 en navegador normal / Android sin notch** → No pasa nada: el padding extra es 0; solo suma donde el dispositivo lo reporta.
- **Scroll horizontal del nav puede pasar desapercibido** → Mitigación aceptable para Capa 1; la solución "descubrible" real es la bottom nav de Capa 2.
- **Ocultar la scrollbar del nav** requiere CSS cross-browser (`-webkit-scrollbar` + `scrollbar-width`) → utilidad puntual en `globals.css`.
