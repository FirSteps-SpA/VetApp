# Tasks

## 1. Base de datos

- [x] 1.1 Crear `supabase/migrations/20261114000000_consulta_control.sql` con:
  - Las columnas `consulta_origen_id` y `evolucion`.
  - La `check (consulta_origen_id is null or tipo = 'control')`.
  - El índice parcial.
  - La función `validar_consulta_origen()` con su trigger: mismo paciente, origen sin origen, origen no editable.

  Aplicar con `supabase migration up --local` y verificar que aplica sin errores.
- [x] 1.2 Agregar a `scripts/test-rls.mjs`, con la sesión del veterinario:
  - Crea un control enlazado a una consulta.
  - Se rechazan: control enlazado a una consulta de otro paciente, control enlazado a otro control, consulta de tipo distinto de `control` con origen, y cambio del origen de un control existente.

  Verificar que `npm run test:rls` pasa todos los controles.
- [x] 1.3 Agregar `consulta_origen_id` y `evolucion` a la interfaz `Consulta` (`src/lib/types/db.ts`). Verificar con `npx tsc --noEmit`.

## 2. Agrupación

- [x] 2.1 Crear `src/lib/consultas/agrupar.ts` con `agruparControles(incluidas, todas)` (ver design, decisión 6) y `src/lib/consultas/agrupar.test.ts` con estos casos:
  - Consulta con dos controles en orden ascendente.
  - Control antiguo sin origen tratado como consulta.
  - Control en rango con origen fuera de rango: aparece suelto con `origenFecha`.
  - Orden descendente de las entradas.
  - Conteo de consultas sin controles.

  Verificar con `npm run test`.

## 3. Registro del control

- [x] 3.1 Extraer el bloque de receta del `NuevaConsultaDrawer` a un componente `RecetaEditor` reutilizable, sin cambiar su comportamiento. Verificar en la app que la nueva consulta con receta sigue guardando sus medicamentos.
- [x] 3.2 Crear `crearControl` en `consultas/actions.ts` (ver design, decisiones 3 y 4):
  - Origen aplanado.
  - Evolución obligatoria.
  - Validación del veterinario.
  - Receta opcional.
  - Cita opcional con `instanteEnZona`.

  Agregar `evolucion` a `actualizarConsulta`. Verificar con `npx tsc --noEmit`.
- [x] 3.3 Crear la página `pacientes/[id]/consultas/[cId]/control` con el formulario reducido, con estos campos:
  - Veterinario responsable.
  - Evolución.
  - Peso y temperatura.
  - Motivo, diagnóstico y tratamiento precargados.
  - `RecetaEditor` plegado.
  - Próximo control (fecha y hora).

  Al guardar vuelve al detalle del origen. Verificar en la app:
  - Un control con solo la evolución se guarda enlazado y con los datos heredados.
  - Un control con receta y próximo control crea la receta y la cita pendiente a la hora indicada en la agenda.
  - Guardar sin evolución muestra el error.
  - Abrir "Registrar control" desde un control enlaza al origen.

## 4. Presentación en la ficha y en el detalle

- [x] 4.1 En `tabs.tsx`, usar `agruparControles` en el historial. `ConsultaItem` muestra "N controles" y, al expandirse, los controles y el botón "Registrar control". Verificar en la app con una consulta con dos controles y con un control antiguo sin origen.
- [x] 4.2 En `consultas/[cId]/page.tsx`:
  - Sección "Controles" con enlaces y botón "Registrar control" en las consultas.
  - En los controles, bloque "Evolución" y el enlace "Control de la consulta del dd-mm-aaaa".

  En `edit-consulta-form.tsx`, campo Evolución cuando `tipo = 'control'`. Verificar en la app la navegación en ambos sentidos y la edición de la evolución.

## 5. Exportación

- [x] 5.1 En el panel de exportación y en `HistorialDoc`, usar `agruparControles`. El PDF muestra los controles dentro del bloque de su consulta, y los controles huérfanos del rango con "Control de la consulta del dd-mm-aaaa". El resumen cuenta solo consultas. Verificar generando el PDF del historial completo y de un rango que incluya solo el control, y revisando su texto.

## 6. Verificación integral

- [x] 6.1 Recorrer en la app el flujo completo con cronómetro: abrir una consulta, "Registrar control", escribir la evolución y guardar, en menos de un minuto. Ejecutar `npm run test`, `npm run lint`, `npx tsc --noEmit` y `npm run build` sin errores.

## Workflow follow-up

- Abrir el PR contra `develop`.
- Al pasar a `main`, aplicar las migraciones pendientes en producción con `supabase db push` (spec 3 y esta).
- Archivar con `/opsx:archive` y marcar la spec #4 como ✅ en `1stDocs/005-roadmap/001-VetApp.md`.
