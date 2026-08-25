## Why

El panel de exportación de documentos clínicos funciona, pero es confuso y por momentos engañoso:

- La **vista previa miente en silencio**: se genera bajo demanda, pero al cambiar una opción (checkbox, fechas, receta) el iframe sigue mostrando el documento viejo sin ninguna señal de que quedó desactualizado.
- Se pueden **descargar documentos inválidos o vacíos**: derivación sin destino ni consultas, tipo "receta" sin recetas, historial con un rango que no cubre nada.
- El tipo **"Historial completo"** ofrece a la vez un filtro Desde/Hasta: la etiqueta se contradice con la función, y "fechas vacías = todo" es un comportamiento oculto.
- Hay un **bug de rango**: al filtrar el historial por fechas, se recortan consultas y exámenes pero **no** recetas ni vacunas.
- El selector de tipo son pills chicas y apretadas; las acciones ("Guardar en ficha", "Vista previa", "Descargar") compiten sin jerarquía clara.
- **"Guardar PDF en la ficha" es funcionalidad muerta**: escribe `recetas.pdf_url` y sube al bucket `recetas-pdf`, pero ningún lado lee ese PDF (el portal y el staff generan la receta al vuelo).

## What Changes

Rediseño del flujo del panel (sobre un bosquejo validado con el usuario):

- **Selector de tipo como tarjetas 2×2** (Historial · Recetas · Vacunas · Derivación), con buen área táctil; una activa a la vez.
- **Historial**: elección explícita **Historial completo / Rango** (radio). Las fechas Desde/Hasta solo aparecen en "Rango", y el rango recorta **de forma consistente** todo lo incluido (consultas, recetas, exámenes, vacunas). Checkboxes de inclusión en grid de 2 columnas.
- **Recetas**: **multi-selección** con checklist; las recetas marcadas se exportan en **un único PDF combinado**.
- **Vista previa honesta**: se marca "desactualizada" en cuanto cambia cualquier opción, para no mostrar contenido viejo.
- **Resumen "Incluye: …" en vivo**: antes de generar, se ve cuántas consultas/recetas/exámenes/vacunas entran según la selección.
- **Descargar/Vista previa deshabilitados** (con motivo visible) cuando la selección produciría un documento inválido o vacío.
- **Se elimina "Guardar PDF en la ficha"** y la lógica de subida a Storage; se remueve la acción `setRecetaPdf` (código muerto).
- Prolijos de accesibilidad y correctitud: `role="dialog"`, cierre con Escape, foco inicial, y revocación de los blob URLs al cambiar de tipo y al cerrar.

Fuera de alcance (se deja anotado): dropear la columna `recetas.pdf_url` y el bucket `recetas-pdf` (migración/limpieza aparte, no urgente porque quedan inertes).

## Capabilities

### New Capabilities
<!-- Ninguna capability nueva: los requisitos nuevos son comportamiento del mismo panel. -->

### Modified Capabilities
- `clinical-document-export`: se modifica el requisito del panel de documentos compuestos (ahora historial completo/rango, recetas múltiples combinadas, derivación) y se agregan requisitos de vista previa no-engañosa, validación de estados inválidos, consistencia del rango y resumen de contenido; se retira el flujo de guardar la receta como PDF en Storage.

## Impact

- **UI**: `src/app/(staff)/pacientes/[id]/export/export-panel.tsx` (rediseño), `export-button.tsx` (sin cambios de contrato).
- **Documentos**: `src/lib/pdf/documents.tsx` → `RecetaDoc` pasa a aceptar N recetas (PDF combinado).
- **Server actions**: se elimina `setRecetaPdf` de `src/app/(staff)/pacientes/[id]/consultas/actions.ts`.
- **Datos**: `recetas.pdf_url` y el bucket `recetas-pdf` quedan sin escritores (limpieza opcional futura). Sin cambios en lectura porque nadie los consumía.
- **Sin impacto** en la impresión contextual (receta desde el tab / consulta, ficha de vacunación) ni en el portal del cliente.
