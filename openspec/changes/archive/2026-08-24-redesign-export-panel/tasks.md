## 1. Documento combinado de recetas

- [x] 1.1 En `src/lib/pdf/documents.tsx`: extraer el cuerpo actual de `RecetaDoc` a un `RecetaPage` (`<Page>…</Page>`) y hacer que `RecetaDoc` reciba una lista `items: { receta, veterinario }[]` y renderice un `<Document>` con un `RecetaPage` por ítem
- [x] 1.2 Actualizar los llamadores de impresión contextual para pasar un solo ítem: `print/imprimir-receta-button` (tab de recetas) y la impresión desde la vista de consulta (`consultas/[cId]` / `print-doc`)
- [x] 1.3 Confirmar que exportar/imprimir **una** receta produce el mismo documento (paridad impresión ↔ exportación) — por construcción: `RecetaPage` es idéntico al cuerpo previo y con 1 ítem el `<Document>` conserva el mismo título

## 2. Lógica de selección y filtros del panel

- [x] 2.1 Centralizar el filtro por rango y aplicarlo por igual a consultas, recetas, exámenes **y** vacunas (corrige que hoy recetas/vacunas ignoran el rango)
- [x] 2.2 Radio "Historial completo / Rango": mostrar Desde/Hasta solo en "Rango"; en "completo" no se filtra por fecha
- [x] 2.3 Recetas: reemplazar el `<select>` único por checklist multi-selección; armar el PDF combinado con las marcadas y nombrar el archivo (`{ficha}_{numero}.pdf` si es 1, `{ficha}_recetas.pdf` si son 2+)
- [x] 2.4 Predicado `motivoInvalido(tipo, selección): string | null` (receta sin marcar, derivación sin destino/consultas, rango vacío, sin secciones incluidas, sin vacunas)
- [x] 2.5 Resumen "Incluye: …" en vivo (memoizado, sin generar PDF) derivado de la misma función de filtro que arma el documento
- [x] 2.6 Estado `previewStale`: cualquier cambio de selección lo activa; generar la vista previa lo limpia

## 3. Rediseño visual del panel

- [x] 3.1 Selector de tipo como tarjetas 2×2 (1 columna en móvil), con buen área táctil y estado activo
- [x] 3.2 Renombrar el tipo "Historial completo" → "Historial"; checkboxes de inclusión en grid de 2 columnas
- [x] 3.3 Badge "desactualizada · actualizar" sobre el iframe cuando `previewStale` y hay preview visible
- [x] 3.4 Footer: *Vista previa* y *Descargar* deshabilitados cuando `motivoInvalido` no es null, con el motivo visible (no error genérico post-clic)
- [x] 3.5 Accesibilidad del drawer: `role="dialog"`, `aria-modal`, `aria-label`, foco inicial al abrir, cierre con Escape, `aria-label` en el botón ✕
- [x] 3.6 Revocar los blob URLs de preview al cambiar de tipo y al cerrar/desmontar

## 4. Quitar "Guardar en ficha"

- [x] 4.1 Eliminar del panel el botón "Guardar PDF en la ficha", la subida al bucket `recetas-pdf` y el import/uso de `setRecetaPdf`
- [x] 4.2 Eliminar la acción `setRecetaPdf` de `src/app/(staff)/pacientes/[id]/consultas/actions.ts` (sin llamadores restantes)
- [x] 4.3 Dejar anotado (comentario/PR) que `recetas.pdf_url` y el bucket `recetas-pdf` quedan inertes; su drop es limpieza opcional futura, no parte de este cambio

## 5. Verificación

- [x] 5.1 `npm run build` pasa
- [x] 5.2 En viewport móvil (DevTools): tarjetas 2×2 apilan, checklist de recetas funciona, badge de preview aparece al cambiar opciones, acciones se deshabilitan con motivo
- [x] 5.3 La impresión contextual de una receta (tab de recetas y vista de consulta) sigue funcionando igual que antes
