# Proposal

## Why

La clínica pidió que el diagnóstico diferencial aparezca **antes** que el diagnóstico. Así sigue el razonamiento clínico: primero se consideran las hipótesis y después se fija el diagnóstico definitivo. Hoy todas las vistas de la consulta muestran el orden inverso: primero "Diagnóstico" y después "Diagnóstico diferencial". Es la spec #1 del roadmap de VetApp (`1stDocs/005-roadmap/001-VetApp.md`).

## What Changes

- Formulario de nueva consulta (drawer): el campo "Diagnóstico diferencial" pasa a estar antes de "Diagnóstico *".
- Formulario de edición de consulta: mismo cambio de orden.
- Detalle de la consulta (`/pacientes/[id]/consultas/[cId]`): "Diagnóstico diferencial" se muestra antes de "Diagnóstico".
- Pestaña de consultas de la ficha (fila expandida): mismo cambio de orden.
- Se fija como regla que todo documento del staff que muestre ambos campos use este orden. Hoy el PDF del historial del staff no incluye el diagnóstico diferencial: solo trae motivo, diagnóstico y tratamiento. Por eso este cambio no lo modifica. La spec #5 (`historial-clinico-completo`), que agrega el campo al PDF, tendrá que respetar esta regla.
- Sin cambios de datos, de esquema ni de validación: "Diagnóstico" sigue siendo obligatorio y "Diagnóstico diferencial" opcional.

## Capabilities

### New Capabilities
- `consultation-record-layout`: orden en que se presentan los campos clínicos de una consulta (captura, edición, lectura y documentos del staff), empezando por el orden diagnóstico diferencial → diagnóstico.

### Modified Capabilities
<!-- Ninguna: ninguna spec existente define el orden de los campos de la consulta. -->

## Impact

- **UI staff**:
  - `src/app/(staff)/pacientes/[id]/consultas/nueva-consulta-drawer.tsx` (sección "Diagnóstico y tratamiento")
  - `src/app/(staff)/pacientes/[id]/consultas/[cId]/editar/edit-consulta-form.tsx`
  - `src/app/(staff)/pacientes/[id]/consultas/[cId]/page.tsx`
  - `src/app/(staff)/pacientes/[id]/tabs.tsx` (componente de la fila de consulta)
- **Sin impacto en**:
  - Server actions (`consultas/actions.ts`), tipos (`src/lib/types/db.ts`) y migraciones.
  - El PDF (`src/lib/pdf/documents.tsx`), que hoy no muestra el diagnóstico diferencial.
  - El portal del dueño, que solo muestra el diagnóstico (auditoría #5).
  - El resumen de la fila colapsada de la pestaña de consultas, que sigue mostrando solo el diagnóstico.
