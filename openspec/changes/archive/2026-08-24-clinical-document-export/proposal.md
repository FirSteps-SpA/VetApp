## Why

Imprimir un documento clínico desde el staff hoy obliga a salir de lo que se está viendo y navegar el panel de "Exportar" (elegir tipo → elegir cuál → descargar). El portal del cliente ya ofrece la acción con un botón contextual junto a cada receta; el staff no. Falta esa affordance donde el ojo ya está, y el gesto real en el mostrador es **imprimir a papel**, no bajar un archivo.

## What Changes

- **Botón "Imprimir" contextual en cada receta del staff**: en el tab Recetas y en la vista de consulta. Abre el PDF de la receta **listo para imprimir** (papel).
- **Botón "Imprimir" para la ficha de vacunación** en el tab Vacunas (documento de toda la mascota).
- La impresión **reutiliza los documentos PDF existentes** (`RecetaDoc`, `VacunacionDoc`) — una sola fuente de verdad; no se crea una representación HTML paralela.
- La generación se **carga de forma diferida** (react-pdf solo al hacer clic), para no engrosar el bundle de la ficha.
- El panel "Exportar" se mantiene para los documentos **compuestos/curados** (historial con rango, derivación con selección). No se elimina ni se duplica.
- No es **BREAKING**: solo agrega puertas de acceso a una capacidad que ya existe.

## Capabilities

### New Capabilities
- `clinical-document-export`: Cómo el staff obtiene documentos clínicos desde la app — puertas contextuales de impresión para objetos únicos (receta, ficha de vacunación) y el panel para documentos compuestos.

### Modified Capabilities
<!-- Ninguna: primera captura de esta capacidad (adopción orgánica de specs). -->

## Impact

- **UI**: `RecetaItem` (`tabs.tsx`), `RecetaBloque` (vista de consulta) y `VacunasTab` — nuevo botón "Imprimir".
- **Nuevo componente cliente** de impresión con `dynamic import` (ssr:false) + helper compartido `abrirParaImprimir(doc)`.
- **Plumbing**: bajar `clinica`, `paciente` y `dueño` (ya fetcheados en la ficha para "Exportar") hasta los tabs.
- **Docs**: reutiliza `RecetaDoc` / `VacunacionDoc` en `src/lib/pdf/documents.tsx`.
- **Sin** cambios de base de datos.
