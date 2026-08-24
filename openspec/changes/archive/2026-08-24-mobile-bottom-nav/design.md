## Context

Tras la Capa 1, el staff tiene una fila de nav superior desplazable (`sm:hidden`) y ambos layouts respetan safe-area. Los layouts ya calculan `reservasPendientes` (staff) y `noLeidas` (portal). Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Navegación primaria móvil alcanzable con el pulgar (barra inferior).
- Coherencia staff + portal en móvil.
- No degradar escritorio.

**Non-Goals:**
- Cambiar la navegación de escritorio.
- Rediseñar densidad de acciones dentro de las páginas (otra capa).

## Decisions

**Barra inferior fija, solo móvil.** Componente `sm:hidden` con `position: fixed; bottom: 0`. En escritorio se mantiene la top nav. *Alternativa rechazada:* bottom bar en todos los tamaños — el escritorio tiene espacio para la top nav y la bottom bar se ve fuera de lugar.

**4 destinos + "Más" (staff).** Inicio, Pacientes, Agenda, Reservas (badge) visibles; "Más" abre una hoja (popover sobre la barra) con Vacunas y Admin (dev). Mantener ≤5 slots hace la barra legible con el pulgar. Salir queda en el header (logout de un toque, sin enterrar). *Nota:* Inicio se deja visible (no en "Más") porque es el destino más frecuente.

**Portal: 4 destinos, sin "Más".** Inicio, Mascotas, Citas, Notificaciones (badge). Caben sin desbordamiento.

**Íconos emoji.** Cero assets, consistente con el uso actual (portal ya usa 🐾/🔔). *Alternativa diferida:* set SVG con `<Icon>` — más pulido pero requiere proveer los assets.

**Safe-area + padding del contenido.** La barra lleva `padding-bottom: env(safe-area-inset-bottom)` para despejar el home-indicator. El `main` recibe padding inferior en móvil (alto de la barra + inset) para que el contenido no quede tapado por la barra fija. Se reutiliza el patrón `env()` de la Capa 1.

**Estado activo y badges por `usePathname`.** El componente cliente marca el destino activo comparando el pathname y muestra el badge (reservas/notificaciones) que le pasa el layout.

## Risks / Trade-offs

- **La barra fija tapa el contenido** → Mitigación: padding inferior del `main` en móvil.
- **z-index vs. drawer de consulta** → El drawer es full-screen `z-30`; la barra va por debajo (`z-20`) para que el drawer la cubra al abrirse.
- **Render de emoji varía por plataforma** → Aceptable para esta capa; migrable a SVG después.
- **"Más" abierto y navegación** → al elegir un ítem, la hoja se cierra; clic fuera también la cierra.
