# Tasks

## 1. Formularios de consulta

- [x] 1.1 En `nueva-consulta-drawer.tsx` (sección "Diagnóstico y tratamiento"), mover el `<label>` de "Diagnóstico diferencial" antes del de "Diagnóstico *". Verificar en `npm run dev` que el drawer muestra Diagnóstico diferencial → Diagnóstico → Tratamiento y que una consulta sin diagnóstico diferencial se guarda.
- [x] 1.2 En `consultas/[cId]/editar/edit-consulta-form.tsx`, mover el `<label>` de "Diagnóstico diferencial" antes del de "Diagnóstico *", sin cambiar `sm:col-span-2`. Verificar en el navegador que la edición muestra el nuevo orden con los valores precargados y que guardar conserva ambos campos.

## 2. Vistas de lectura

- [x] 2.1 En `consultas/[cId]/page.tsx`, mover el `<Bloque>` de "Diagnóstico diferencial" antes del de "Diagnóstico". Verificar en el detalle de una consulta con ambos campos que el diferencial aparece primero, y en una sin diferencial que solo aparece "Diagnóstico".
- [x] 2.2 En `pacientes/[id]/tabs.tsx` (fila expandida de la consulta), mover el `<Campo>` de "Diagnóstico diferencial" antes del de "Diagnóstico". El resumen de la fila colapsada no cambia. Verificar en la pestaña de consultas de la ficha al expandir una consulta.

## 3. Verificación integral

- [x] 3.1 Revisar que no queden otras vistas del staff con el orden antiguo: `grep -rn "diferencial" src` solo debe mostrar las cuatro vistas ya cambiadas, `actions.ts` y los tipos. Confirmar que el PDF (`src/lib/pdf/documents.tsx`) sigue sin mostrar el diagnóstico diferencial, así que no requiere cambios.
- [x] 3.2 Ejecutar `npm run lint` y `npm run build` sin errores.

## Workflow follow-up

- Abrir el PR contra `develop` (no contra `main`).
- Archivar el change con `/opsx:archive` cuando el PR esté aprobado.
- Marcar la spec #1 como ✅ en `1stDocs/005-roadmap/001-VetApp.md` y anotar en la spec #5 (`historial-clinico-completo`) que el PDF debe respetar el orden diferencial → diagnóstico.
