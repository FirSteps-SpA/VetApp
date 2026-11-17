# Proposal

## Why

La clínica pidió poder elegir el veterinario responsable al registrar una consulta, su receta o una vacuna. Hoy esos registros guardan siempre al usuario que inició sesión, aunque el caso lo haya atendido otro veterinario (p. ej. cuando un colega transcribe la consulta). Además, el selector que ya existe en los documentos muestra el usuario de desarrollo (`dev`), que no es un profesional de la clínica. Es la spec #3 del roadmap de VetApp (`1stDocs/005-roadmap/001-VetApp.md`).

## What Changes

- **Nueva consulta**: selector "Veterinario responsable". Por defecto queda el usuario actual si es un veterinario activo; si no lo es, el selector queda sin valor y es obligatorio.
- **Receta**: hereda el veterinario de su consulta. No tiene selector propio: se crea en el mismo formulario.
- **Edición de consulta**: se puede cambiar el veterinario responsable. El cambio se aplica también a las recetas de esa consulta.
- **Registro de vacuna**: selector con la misma regla de valor por defecto. La pestaña de vacunas muestra el veterinario de cada una.
- **Documentos legales y certificado de microchip**: usan el mismo selector. Ya no listan al usuario `dev` ni al emisor cuando no es veterinario. **BREAKING** para un usuario `dev`: ya no puede figurar como veterinario a cargo.
- **Regla única de elegibilidad**: solo usuarios con rol `veterinario` y activos. Se valida en las server actions y en la base de datos con un trigger que rechaza un veterinario inválido al insertar o al cambiar `veterinario_id` en consultas, recetas y vacunas. Los registros históricos no se tocan.
- `audit_log` sigue registrando como autor al usuario que hizo el cambio (`auth.uid()`), aunque el responsable sea otro. No requiere cambios.
- El detalle de la consulta, la ficha, el PDF de la receta y el historial ya muestran el veterinario de la consulta, así que reflejan el elegido sin cambios.

## Capabilities

### New Capabilities
- `responsible-veterinarian`: quién figura como veterinario responsable de un registro clínico (consulta, receta, vacuna), quiénes son elegibles y cómo se valida.

### Modified Capabilities
- `authorization-documents`: el requisito "El veterinario a cargo por defecto es el emisor" pasa a limitarse a veterinarios activos. El emisor queda por defecto solo si es elegible, y el selector no incluye al usuario `dev`.

## Impact

- **Base de datos**: migración nueva con la función y los triggers de validación sobre `consultas`, `recetas` y `vacunas`. Sin cambios de columnas.
- **Server actions**: `consultas/actions.ts` (`crearConsulta`, `actualizarConsulta`) y `vacunas/actions.ts` (`crearVacuna`).
- **Datos**: `src/lib/data/usuarios.ts` (`getVeterinarios` solo con rol `veterinario`) y `src/lib/data/vacunas.ts` (nombre del veterinario).
- **UI**:
  - `nueva-consulta-drawer.tsx`
  - `consultas/[cId]/editar/` (página y formulario)
  - `vacunas/vacunas-tab.tsx`
  - `documentos/documentos-panel.tsx`
  - `pacientes/[id]/page.tsx` y `tabs.tsx`, para pasar la lista de veterinarios
  - Componente compartido nuevo con el selector
- **Pruebas**: controles nuevos en `scripts/test-rls.mjs`.
- **Sin impacto en**:
  - Agenda y citas (`citas.veterinario_id`): fuera de alcance.
  - Portal del dueño.
  - Columnas de las tablas.
