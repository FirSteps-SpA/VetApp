# Design

## Context

- `consultas` ya tiene `tipo` con el valor `control`, y las columnas `motivo`, `diagnostico` y `tratamiento` obligatorias. Por eso un control se guarda como una fila más de `consultas`, sin tabla nueva.
- `crearConsulta` (`consultas/actions.ts`) inserta en secuencia la consulta, la receta opcional y los exámenes, y devuelve errores parciales ("Consulta guardada, pero falló la receta…"). El trigger `set_peso_paciente` actualiza el peso del paciente en cada insert.
- Desde la spec 3, `veterinario_id` debe ser un veterinario elegible (trigger `validar_veterinario_responsable`) y el selector es `SelectorVeterinario`.
- Para las citas, `crearCita` (`agenda/actions.ts`) busca al dueño principal y guarda al usuario actual como veterinario. La hora de pared se convierte con `instanteEnZona` (`lib/utils/zona.ts`).
- La ficha (`tabs.tsx`, `ConsultaItem`), el detalle de la consulta, el panel de exportación y el PDF del historial (`HistorialDoc` en `src/lib/pdf/documents.tsx`) reciben la lista plana `ConsultaConVet[]` de `getConsultas`.

## Goals / Non-Goals

**Goals:**
- Que un control se registre en menos de un minuto: un formulario corto, precargado, y un solo campo obligatorio nuevo.
- Una sola función que agrupe controles bajo su consulta, usada por la ficha, el panel de exportación y el PDF, para que todos coincidan.

**Non-Goals:**
- Portal del dueño (`portal_consultas`) y resumen lateral de la ficha: sin cambios.
- Selección de consultas en la carta de derivación: los controles siguen apareciendo como consultas seleccionables.
- Exámenes adjuntos en el formulario de control: se pueden adjuntar después desde la pestaña de exámenes, como hoy.
- Mostrar en el PDF todos los campos de la consulta: es la spec 5 (`historial-clinico-completo`).

## Decisions

1. **Esquema**: `consultas.consulta_origen_id uuid references consultas(id)` (nullable), `consultas.evolucion text` y un índice parcial por `consulta_origen_id`. Más una `check (consulta_origen_id is null or tipo = 'control')`. No se usa una tabla `controles` aparte: la consulta ya tiene todos los campos, y así el portal, la auditoría (`audit_trigger`), el peso y las recetas funcionan sin cambios.
2. **Trigger `validar_consulta_origen()`** `BEFORE INSERT OR UPDATE OF consulta_origen_id`:
   - En `UPDATE`, rechaza cualquier cambio del valor, porque el origen no se edita.
   - En `INSERT` con origen, exige que la consulta de origen sea del mismo paciente y que no tenga a su vez un origen.

   Error: `errcode '23514'`. El `security definer` no hace falta, porque quien inserta (clínico) ya puede leer consultas. Se deja `set search_path`, como el resto.
3. **Aplanado en la action**: `crearControl(origenId, input)` carga la consulta indicada. Si ella misma tiene `consulta_origen_id`, usa ese origen. La regla también está en la BD (decisión 2); la action la aplica antes para que el flujo "control de un control" funcione en vez de fallar.
4. **`crearControl`** sigue el patrón de `crearConsulta`:
   - Valida la evolución y el veterinario (`esVeterinarioElegible`).
   - Inserta la consulta con `tipo = 'control'`, el origen, el paciente del origen y la `fecha` actual.
   - Si hay medicamentos, inserta la receta con el mismo veterinario.
   - Si hay próximo control, inserta la cita: dueño principal, `veterinario_id` del control, motivo "Control", `duracion_minutos` 30, estado `pendiente` y `fecha_hora = instanteEnZona(fecha, hora)`.

   Los errores parciales se informan igual que en `crearConsulta`. Se extrae el bloque de receta compartido (`MedRow`, filas de medicamentos) del drawer a un componente reutilizable (`RecetaEditor`), para no duplicarlo en el formulario de control.
5. **Página `pacientes/[id]/consultas/[cId]/control`**, en lugar de un drawer: carga el origen (aplanado) en el servidor y no agrega peso a la ficha. Funciona bien en el móvil y deja un enlace directo "Registrar control". Al guardar, vuelve al detalle de la consulta de origen.
6. **Agrupación pura** en `src/lib/consultas/agrupar.ts`:
   - `agruparControles(incluidas, todas)` devuelve las entradas principales en orden descendente.
   - Cada entrada es una consulta con sus `controles` (ascendentes) o un control huérfano en el rango con `origenFecha`, que se toma de `todas`.
   - Los controles sin origen (antiguos) cuentan como consultas.

   Tiene tests unitarios con Vitest (ver tareas). La usan `tabs.tsx`, el panel de exportación (rango y resumen "N consultas") y `HistorialDoc`.
7. **Presentación**:
   - **Ficha:** `ConsultaItem` muestra "N controles" en el encabezado y, al expandirse, sus controles (fecha, veterinario, evolución, tratamiento) y el botón "Registrar control".
   - **Detalle de una consulta:** sección "Controles" con enlaces y el botón.
   - **Detalle de un control:** bloque "Evolución" y el enlace "Control de la consulta del dd-mm-aaaa".
   - **Edición:** si la consulta es de tipo control, se muestra el campo Evolución.

## Risks / Trade-offs

- [Los errores parciales dejan el control guardado sin receta o sin cita] → mismo comportamiento y mensajes que `crearConsulta`, conocidos por la clínica. Una transacción vía RPC queda fuera de alcance.
- [Los controles antiguos de tipo `control` sin origen no se agrupan] → se muestran como hoy. Vincularlos a mano queda fuera de alcance, porque el origen no se edita.
- [La cita del próximo control usa el veterinario del control y no el usuario actual] → es intencional y coherente con la spec 3. La agenda sigue sin selector propio.
- [Cambiar `getConsultas` a una lista agrupada rompería a otros consumidores] → `getConsultas` no cambia. La agrupación se hace donde se presenta.

## Migration Plan

1. `supabase/migrations/20261114000000_consulta_control.sql`: columnas, `check`, índice, función y trigger. No modifica datos.
2. Local: `supabase migration up --local` y `npm run test:rls`. El job `rls` del CI aplica todo desde cero.
3. Producción: `supabase db push` al pasar a `main`, junto con la migración pendiente de la spec 3.
4. Rollback: `drop trigger`, `drop function`, `alter table consultas drop constraint …, drop column evolucion, drop column consulta_origen_id`. Se pierden los enlaces y las evoluciones registrados, así que antes se respalda con `respaldo.sh`.
