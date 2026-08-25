## Context

El panel vive en `export-panel.tsx` como un drawer lateral cargado con `dynamic(..., { ssr:false })` desde `export-button.tsx` (así `@react-pdf/renderer` no entra al bundle inicial de la ficha). Genera 4 tipos de documento (`historial | receta | derivacion | vacunacion`) usando los componentes de `src/lib/pdf/documents.tsx`, cada uno un `<Document>` con un `<Page>`.

Restricciones que moldean el enfoque:

- `RecetaDoc` es hoy `<Document><Page>…</Page></Document>` (un solo `<Page>`). Se usa además en la **impresión contextual** de una receta (tab de recetas y vista de consulta), que debe seguir funcionando idéntica.
- La generación de PDF (`pdf(doc).toBlob()`) es cara; en móvil conviene **no** regenerar en cada tecla.
- El spec `clinical-document-export` exige que impresión y exportación de un mismo elemento produzcan **el mismo documento** (misma fuente de documento).
- `recetas.pdf_url` / bucket `recetas-pdf`: escritos solo por `setRecetaPdf`, sin ningún lector en la app.

## Goals / Non-Goals

**Goals:**
- Un flujo del panel donde el usuario entiende qué va a generar antes de generarlo.
- La vista previa nunca muestra contenido que ya no corresponde a la selección.
- No se pueden producir documentos vacíos o inválidos.
- El rango de fechas del historial se aplica de forma consistente a todo lo incluido.
- Recetas múltiples en un único PDF combinado, reutilizando la misma fuente de documento que la impresión contextual.

**Non-Goals:**
- Auto-regenerar la vista previa en cada cambio (se elige invalidar, no regenerar).
- Dropear la columna `recetas.pdf_url` ni el bucket `recetas-pdf` (limpieza de datos futura; quedan inertes).
- Tocar la impresión contextual, el portal del cliente, o los documentos de derivación/vacunación en su contenido.
- Persistir la selección entre aperturas del panel.

## Decisions

### 1. PDF combinado de recetas: extraer `RecetaPage`
`RecetaDoc` pasa de recibir `receta` (una) a recibir una lista. Se extrae el cuerpo de la página actual a un `RecetaPage` (`<Page>…</Page>`) y `RecetaDoc` queda como:

```
<Document title=…>
  {items.map(({ receta, veterinario }) => <RecetaPage receta={receta} veterinario={veterinario} … />)}
</Document>
```

- La impresión contextual (single) pasa `[{ receta, veterinario }]` → **mismo documento** que exportar esa receta sola (cumple "impresión y exportación coinciden").
- N recetas marcadas → un `<Document>` de N páginas.
- Nombre de archivo: 1 receta → `{ficha}_{numero_receta}.pdf`; 2+ → `{ficha}_recetas.pdf`.

*Alternativa descartada:* un `RecetasDoc` separado que envuelva varios `RecetaDoc`. No sirve: react-pdf no anida `<Document>` dentro de `<Document>`; hay que combinar a nivel de `<Page>`.

### 2. Vista previa "honesta" por invalidación (no auto-regenerado)
Estado `previewStale: boolean`. Cualquier cambio de selección (tipo, completo/rango, fechas, checkboxes, recetas marcadas, destino/motivo/consultas de derivación) marca `previewStale = true`. Generar la vista previa la limpia. Mientras esté `stale` y haya un preview visible, se muestra un badge **"desactualizada · actualizar"** sobre el iframe.

*Por qué no auto-regenerar:* el costo de `toBlob()` en cada cambio es alto en móvil; invalidar da la honestidad buscada sin el costo. (Elección del usuario.)

### 3. Resumen "Incluye: …" en vivo
Derivado (memoizado) de la selección actual, **sin** generar PDF: cuenta consultas/recetas/exámenes/vacunas que entrarían. Para Historial refleja completo/rango + checkboxes; para Recetas, cuántas marcadas; para Derivación, cuántas consultas seleccionadas.

### 4. Validez por tipo → acciones deshabilitadas con motivo
Un predicado `motivoInvalido(tipo, selección): string | null`:
- **historial**: en "Rango", si `desde`/`hasta` invierten o el resultado no incluye nada → motivo; sin ninguna sección incluida → motivo.
- **receta**: 0 recetas marcadas → motivo.
- **derivacion**: sin destino, o sin al menos una consulta seleccionada → motivo.
- **vacunacion**: sin vacunas registradas → motivo.

Si hay motivo, *Vista previa* y *Descargar* quedan deshabilitados y se muestra el motivo (no un error genérico post-clic).

### 5. Rango consistente
Se centraliza el filtro por fecha. Con "Historial completo" no se filtra nada; con "Rango" el mismo `[desde, hasta]` recorta consultas, recetas, exámenes **y** vacunas antes de armar el `HistorialDoc`. (Hoy recetas y vacunas se pasan sin filtrar: es el bug a corregir.)

### 6. Quitar "Guardar en ficha" y `setRecetaPdf`
Se elimina el botón, la subida al bucket `recetas-pdf` y el import/uso de `setRecetaPdf`; se remueve la acción `setRecetaPdf` de `consultas/actions.ts` (sin llamadores restantes). La columna y el bucket quedan sin escritores (se anota como limpieza opcional).

### 7. Accesibilidad y correctitud del drawer
`role="dialog"` + `aria-modal="true"` + `aria-label`; cierre con **Escape**; foco inicial al abrir; `aria-label` en el botón ✕. Revocar los blob URLs de preview al cambiar de tipo y al desmontar/cerrar (hoy hay fugas).

## Risks / Trade-offs

- **Refactor de `RecetaDoc` toca 3 llamadores** (panel, impresión contextual del tab, impresión desde consulta). Riesgo de romper la impresión contextual; se mitiga con el requisito de paridad impresión/exportación y verificación de que el single-caso produce el mismo binario.
- **Preview por invalidación** deja al usuario apretar "actualizar"; es un clic extra, pero evita el costo y la mentira silenciosa. Aceptado por el usuario.
- **Conteos "Incluye"** deben coincidir exactamente con lo que termina en el PDF; si divergen, confunden más que ayudar. Se derivan de la misma función de filtro que arma el documento (única fuente).
- **Columna/bucket huérfanos**: quedan datos muertos hasta la limpieza futura; inertes, sin lectores.
