# Proposal

## Why

Cuando un paciente vuelve a control, el veterinario hoy tiene que crear una consulta completa y volver a escribir motivo, diagnóstico y tratamiento, aunque solo quiera anotar la evolución. Además, el control queda suelto en el historial, sin relación con la consulta que lo originó. La clínica pidió una forma rápida de registrarlo. Es la spec #4 del roadmap de VetApp (`1stDocs/005-roadmap/001-VetApp.md`).

## What Changes

- Acción **"Registrar control"** en el detalle de una consulta y en la fila expandida del historial de la ficha.
- Abre un **formulario reducido**, precargado desde la consulta de origen:
  - Veterinario responsable, con el selector de la spec 3.
  - **Evolución**: obligatoria y campo nuevo.
  - Peso y temperatura.
  - Motivo, diagnóstico y tratamiento heredados y editables. El tratamiento sirve para registrar el ajuste.
  - **Receta opcional**, con el mismo bloque de la nueva consulta.
  - **Próximo control opcional** (fecha y hora): al guardar crea una cita pendiente en la agenda con el mismo veterinario.
- El control se guarda como una consulta de tipo `control` con referencia a su consulta de origen (`consulta_origen_id`). Un control registrado desde otro control queda enlazado a la misma consulta de origen: no se anidan.
- **La ficha agrupa los controles bajo su consulta.** El historial muestra la consulta con la cantidad de controles, y al expandirla, sus controles en orden cronológico. El detalle de la consulta lista sus controles, y el del control enlaza a su origen.
- **El PDF del historial** muestra los controles dentro del bloque de su consulta. Si el rango de fechas incluye un control pero no su consulta, el control aparece igual, con la referencia a la consulta de origen.
- La edición de una consulta de control permite editar la evolución.
- Las consultas de tipo `control` registradas antes de este cambio (sin origen) se siguen mostrando como hasta ahora.

## Capabilities

### New Capabilities
- `consultation-follow-up`: registro rápido de controles enlazados a su consulta de origen, su presentación agrupada en la ficha y el historial, y el agendamiento del próximo control.

### Modified Capabilities
<!-- Ninguna: los requisitos existentes del PDF (rango de fechas, resumen) siguen valiendo; la agrupación se define en la capacidad nueva. -->

## Impact

- **Base de datos**: migración nueva:
  - Columnas `consultas.consulta_origen_id` (FK a `consultas`) y `consultas.evolucion`.
  - Índice por origen.
  - Restricción y trigger que validan el enlace: solo tipo `control`, mismo paciente y un origen que no sea a su vez un control enlazado.
- **Server actions**: `crearControl` nueva (consulta + receta opcional + cita opcional) y `actualizarConsulta`, que agrega `evolucion`.
- **UI**:
  - Página nueva `pacientes/[id]/consultas/[cId]/control`.
  - Cambios en `consultas/[cId]/page.tsx`, `tabs.tsx` y el formulario de edición.
  - Cambios en el PDF del historial (`src/lib/pdf/documents.tsx`) y en el resumen del panel de exportación.
- **Tipos**: `Consulta` agrega los dos campos.
- **Pruebas**: controles nuevos en `test:rls` y tests unitarios de la agrupación.
- **Sin impacto en**:
  - El portal del dueño: `portal_consultas` no cambia y el control se ve como hoy una consulta de tipo control.
  - El resumen lateral de la ficha.
  - La agenda, salvo la cita que se crea.
