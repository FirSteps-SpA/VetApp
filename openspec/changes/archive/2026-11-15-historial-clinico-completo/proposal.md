# Proposal

## Why

El PDF del historial que exporta el staff solo trae motivo, diagnóstico y tratamiento de cada consulta, más las notas si se piden. Faltan la anamnesis, el examen físico, el diagnóstico diferencial, el peso y la temperatura, que el veterinario sí registró. Por eso el historial impreso no sirve como registro clínico completo, por ejemplo para derivar o entregar el caso. La clínica lo pidió ("imprimir historial: no se incluye toda la info de la consulta"). Es la spec #5 del roadmap de VetApp (`1stDocs/005-roadmap/001-VetApp.md`).

## What Changes

- Cada consulta del historial del staff muestra todos sus campos clínicos, en el mismo orden que el detalle de la consulta:
  - motivo
  - anamnesis
  - examen físico
  - peso y temperatura
  - **diagnóstico diferencial antes que el diagnóstico**
  - tratamiento
  - notas, solo si se piden
- Los campos vacíos no se imprimen.
- Dos casillas nuevas en el panel de exportación, ambas marcadas por defecto. Se suman a las que ya existen para recetas, vacunas, exámenes y notas internas:
  - **Incluir anamnesis y examen físico**
  - **Incluir signos vitales** (peso y temperatura)
- El diagnóstico diferencial va siempre junto al diagnóstico, sin casilla propia.
- **Controles enlazados (spec 4):** muestran la evolución y el tratamiento, más el examen físico y los signos vitales si se registraron y su casilla está activa. Motivo, diagnóstico y diagnóstico diferencial aparecen solo si difieren de los de la consulta de origen, para no repetirlos.
- **No cambia** el historial del portal del dueño. Sigue mostrando solo las columnas permitidas (auditoría #5).

## Capabilities

### New Capabilities
- `staff-clinical-history-content`: qué datos de cada consulta y de cada control contiene el historial que exporta el staff, en qué orden, qué secciones son opcionales y su separación del historial del portal.

### Modified Capabilities
<!-- Ninguna. consultation-record-layout ya exige el orden diferencial → diagnóstico en los documentos del staff, y esta spec lo cumple. clinical-document-export (alcance, vista previa, resumen) no cambia. -->

## Impact

- `src/lib/pdf/documents.tsx`: `OpcionesHistorial` (dos opciones nuevas) y `ConsultaHistorial` (campos nuevos y comparación con el origen en los controles).
- `src/app/(staff)/pacientes/[id]/export/export-panel.tsx`: casillas nuevas y sus valores por defecto. Cambiar una casilla ya marca la vista previa como desactualizada.
- El origen de un control se obtiene de `todasConsultas`, que ya se pasa al PDF.
- Tests unitarios para decidir qué campos de un control se repiten.
- Sin migraciones, sin cambios en RLS ni en el portal (`HistorialClienteDoc` y las funciones `portal_*` no cambian).
