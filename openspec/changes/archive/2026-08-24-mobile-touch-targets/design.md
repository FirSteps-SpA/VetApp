## Context

Las acciones de fila hoy son links `text-xs hover:underline` agrupados en `flex gap-3`. Varias filas tienen 3-5 acciones. Ya existe un patrón de popover con cierre por clic-fuera (el menú "Más" de la bottom nav). Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Targets táctiles cómodos (~44px) en móvil.
- Filas de acciones legibles y tocables (no 5 links pegados).

**Non-Goals:**
- Auditar/agrandar todos los controles ya decentes (botones primarios grandes, inputs).
- Rediseñar los formularios (ya colapsan a 1 columna en móvil).

## Decisions

**Menú kebab para 3+ acciones.** Componente `ActionMenu` reutilizable: botón "⋯" (target ≥44px) que abre una hoja con las acciones secundarias; cierra al elegir o al hacer clic fuera (mismo patrón que el "Más" de la bottom nav). Cada acción es `{ label, onClick, danger? }` o un link. La acción **primaria** de cada fila queda visible fuera del menú. *Alternativa rechazada:* agrandar + envolver todas las acciones — filas altas y aún densas.

**Qué es primario por superficie.**
- Dueños: *Editar* visible; kebab con Marcar principal, Quitar, Invitar/Revocar.
- Cita (agenda): la acción positiva según estado (*Confirmar* o *Iniciar consulta*) visible; kebab con No asistió, Cancelar.
- Usuarios/Sucursales: *Editar* visible; kebab con Eliminar/Desactivar.
- Exámenes: *Abrir/Descargar* visible; kebab con Eliminar. (2 acciones → puede quedar visible + kebab de 1, o ambas agrandadas.)

**Target mínimo ~44px en móvil.** Los controles de acción usan padding/altura suficientes (p. ej. `min-h-11` o `py` que llegue a ~44px de área tocable) en móvil. En escritorio pueden ser más compactos.

**Casos que no son "muchas acciones".** Reservas (input fecha/hora + Confirmar/Rechazar) se **apila** en móvil (`flex-col`) con botones grandes, en vez de kebab. La nav de agenda (← Hoy →) agranda los botones.

## Risks / Trade-offs

- **z-index del kebab vs bottom nav / drawer** → el menú abre hacia arriba/abajo según espacio; se mantiene por debajo del drawer (`z-30`) y por encima del contenido.
- **Acciones destructivas en kebab** (Quitar/Eliminar/Cancelar) → se marcan en rojo (`danger`) y conservan su confirmación actual.
- **Consistencia** → un solo `ActionMenu` evita divergencias entre filas.
