## Context

Los documentos PDF ya existen en `src/lib/pdf/documents.tsx` (`RecetaDoc`, `VacunacionDoc`, etc.) y se generan client-side con `@react-pdf/renderer`. El panel "Exportar" (`export-button.tsx` → `export-panel.tsx`) los produce, cargando react-pdf con `dynamic(..., { ssr:false })` para que la ficha (`/pacientes/[id]`) siga en ~10.7kB. El portal del cliente ya expone descarga contextual por receta. Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Imprimir a papel una receta o la ficha de vacunación desde donde se están viendo, en un gesto.
- Que lo impreso sea idéntico al PDF que se guardaría/enviaría (una sola fuente).
- No engrosar la carga inicial de la ficha para quien no imprime.

**Non-Goals:**
- Reemplazar el panel "Exportar" (sigue para historial y derivación).
- Documento de impresión por consulta individual (no existe un Doc para eso; sería otro alcance).
- Auto-impresión 100% sin intervención en todos los navegadores (ver Risks).

## Decisions

**Imprimir = generar el PDF existente y abrirlo listo para imprimir (enfoque A).** El botón genera el blob del `Doc` correspondiente y lo abre en una pestaña nueva (visor del navegador con su botón de impresión). *Alternativa rechazada (B):* renderizar una versión HTML con `@media print` + `window.print()`; da impresión nativa pero introduce una **segunda representación** (PDF + HTML) que hay que mantener sincronizada — la "redundancia mala" que este change busca evitar.

**Auto-print como enhancement con fallback.** Se puede intentar un `<iframe>` oculto con el blob y `contentWindow.print()` para que el diálogo de impresión salga directo. Como el print de PDFs en iframe es inconsistente entre navegadores, el comportamiento **garantizado** es "abrir en pestaña listo para imprimir"; el auto-print es best-effort y cae a "abrir" si falla.

**Una sola implementación de impresión.** Un helper `abrirParaImprimir(doc)` (genera blob + abre/print). Las tres puertas (receta en tab, receta en consulta, ficha de vacunación) lo invocan con su `Doc`. La lógica no se duplica; solo las puertas.

**Carga diferida obligatoria.** El botón contextual hace `dynamic import` de react-pdf + los `Doc` al hacer clic (mismo patrón que `export-button`). react-pdf no entra al bundle de la ficha hasta que alguien imprime.

**Los `Doc` son la fuente compartida.** Receta usa `RecetaDoc` (versión staff); vacunación usa `VacunacionDoc`. Los mismos que usa el panel "Exportar" → consistencia sin esfuerzo.

**Frontera hub/contextual.** Objeto único → botón contextual (receta, ficha de vacunación). Documento compuesto/curado → panel "Exportar" (historial con rango, derivación con selección).

## Risks / Trade-offs

- **Auto-print de PDF en iframe es finicky cross-browser** → Mitigación: el requisito es "abrir listo para imprimir"; el auto-print es opcional con fallback.
- **Popup blocker al abrir pestaña** → Mitigación: la apertura ocurre dentro del gesto de clic (permitida); no se difiere la apertura fuera del handler.
- **Plumbing de datos a los tabs** (clinica/paciente/dueño) aumenta las props de `VacunasTab` y de la sección de recetas → Mitigación: ya se fetchean en la ficha para "Exportar"; se reutiliza esa data, sin queries nuevas.
- **Fuga de bundle si el botón importa react-pdf de forma estática** → Mitigación: el componente de impresión se carga con `dynamic(..., { ssr:false })`; verificar que la ficha siga liviana en el build.
