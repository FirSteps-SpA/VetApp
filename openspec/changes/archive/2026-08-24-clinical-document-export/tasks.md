## 1. Motor de impresión compartido

- [x] 1.1 Helper `abrirParaImprimir(doc)`: genera el blob del `Doc` y lo abre en pestaña listo para imprimir; intento de auto-print (iframe oculto) con fallback a "abrir"
- [x] 1.2 Componente cliente de impresión con `dynamic(..., { ssr:false })` de `@react-pdf/renderer` + los `Doc`, para que react-pdf no entre al bundle de la ficha

## 2. Botón contextual — Receta

- [x] 2.1 Bajar `clinica` / `paciente` / `dueño principal` desde la ficha hasta la sección de recetas (props a `FichaTabs` → `RecetaItem`)
- [x] 2.2 Botón "Imprimir" en `RecetaItem` (tab Recetas), junto a la vigencia, usando `RecetaDoc`
- [x] 2.3 Botón "Imprimir" en `RecetaBloque` (vista de consulta); la página de consulta debe fetchear `clinica` / `paciente` / `dueño principal`

## 3. Botón contextual — Ficha de vacunación

- [x] 3.1 Bajar `clinica` / `paciente` / `dueño principal` a `VacunasTab`
- [x] 3.2 Botón "Imprimir ficha de vacunación" arriba del tab Vacunas, usando `VacunacionDoc`

## 4. Verificación

- [x] 4.1 `npm run build` pasa; confirmar que `/pacientes/[id]` no aumentó su bundle (react-pdf sigue cargándose de forma diferida) — ficha 11.2 kB (sin react-pdf), react-pdf en chunk aparte
- [X] 4.2 Verificar impresión en navegador: receta desde el tab y desde la vista de consulta, y la ficha de vacunación desde su tab → abren el documento listo para imprimir
- [x] 4.3 Consistencia: impresión y exportación usan el mismo `RecetaDoc` / `VacunacionDoc` (misma fuente por construcción)
