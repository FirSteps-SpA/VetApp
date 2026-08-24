## Why

En móvil, muchas acciones son links `text-xs` de ~16px de alto (por debajo del target táctil recomendado de ~44px) y varias filas apilan 4-5 acciones en línea (dueños: Editar/Marcar principal/Quitar/Invitar/Revocar; agenda: Confirmar/Iniciar/No asistió/Cancelar). Con el pulgar es fácil errar el toque. Esta capa sube los targets y descomprime las filas densas.

## What Changes

- Las agrupaciones densas de acciones (filas con 3+ acciones) dejan **1-2 acciones primarias visibles** y mueven el resto a un **menú de desbordamiento ("⋯")** por fila.
- Los controles de acción alcanzan un **target táctil mínimo (~44px)** en móvil (padding/altura adecuados).
- Se ordenan los clusters más apretados: **agenda** (acciones de cita + nav ← Hoy →), **reservas** (fecha/hora + Confirmar/Rechazar), y las **filas de admin/dueños/exámenes**.
- Alcance acotado a los **peores ofensores**; no se re-audita cada botón ya decente.
- No es **BREAKING**; no cambia rutas ni datos.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `responsive-ui`: agrega el comportamiento de tamaño mínimo tocable y de desbordamiento de acciones densas en móvil.

## Impact

- **Nuevo componente**: `ActionMenu` (kebab "⋯") cliente reutilizable, con cierre por selección/clic fuera.
- **Componentes afectados**: `manage-duenos`, `cita-actions` (agenda), `reservas/solicitud-actions`, `agenda/page` (nav), `usuarios-manager`, `sucursales-manager`, `examenes-tab`, y los botones de acción de receta.
- **Sin** cambios de base de datos ni de rutas.
