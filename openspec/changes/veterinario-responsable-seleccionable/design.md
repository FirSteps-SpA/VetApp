# Design

## Context

- `consultas`, `recetas` y `vacunas` tienen `veterinario_id uuid not null references usuarios(id)`. `crearConsulta`, la receta creada dentro de ella y `crearVacuna` guardan siempre `auth.getUser().id`. `actualizarConsulta` no toca el veterinario.
- Solo `dev` y `veterinario` pueden escribir consultas, recetas y vacunas (`is_clinico()` en RLS). `usuarios_select` permite a `dev` y `veterinario` leer a todo el staff; la recepcionista solo ve su propia fila.
- `getVeterinarios()` (`src/lib/data/usuarios.ts`) filtra `rol in ('dev','veterinario')` y `activo`, y hoy solo la usa el panel de documentos. Ese panel arma la lista agregando además al emisor, aunque no sea veterinario.
- `audit_trigger()` ya guarda `auth.uid()` como `usuario_id`, así que el autor queda registrado sin cambios.
- Lo que se muestra al usuario ya sale del veterinario de la **consulta** (`veterinario:usuarios(nombre)`):
  - El detalle de la consulta y la ficha.
  - El PDF de la receta (`tabs.tsx` y `consultas/[cId]/page.tsx` le pasan el nombre del veterinario de la consulta).
  - El historial PDF.

  Las vacunas no muestran veterinario en ninguna parte.

## Goals / Non-Goals

**Goals:**
- Una sola definición de "veterinario elegible", usada por los selectores, las server actions y la base de datos.
- Un solo componente de selector, usado en la consulta, la vacuna y los documentos.

**Non-Goals:**
- Agenda y citas: `citas.veterinario_id` y la elección de veterinario en el portal (`portal/citas/actions.ts`) quedan como están.
- Corregir registros históricos cuyo veterinario es `dev`: se conservan.
- Que la recepcionista vea la lista de veterinarios en los documentos (RLS no se lo permite hoy y no emite documentos clínicos). Para ella el selector no aparece y los campos se llenan a mano, igual que hoy cuando la lista viene vacía.

## Decisions

1. **Elegibilidad = `rol = 'veterinario' and activo`**, definida en dos lugares:
   - `getVeterinarios()`, para las listas.
   - Una función SQL `public.es_veterinario_elegible(uuid)`, `stable`, `security definer` con `search_path` fijo, para validar.

   `security definer` permite validar aunque la lectura de `usuarios` cambie con RLS. La función solo devuelve un booleano sobre un id, así que no expone datos.
2. **Trigger `BEFORE INSERT OR UPDATE OF veterinario_id`** en `consultas`, `recetas` y `vacunas` (función `validar_veterinario_responsable()`):
   - Valida en `INSERT`, y en `UPDATE` solo si `new.veterinario_id is distinct from old.veterinario_id`.
   - Si el veterinario no es elegible, lanza `raise exception ... using errcode = '23514'` (check_violation).

   No se usa una `check constraint` con subconsulta, porque Postgres no lo permite. Tampoco una política RLS, porque habría que duplicarla en tres tablas y no distingue un cambio de valor. Así los registros históricos siguen siendo editables.
3. **Propagación a recetas en la BD**: un trigger `AFTER UPDATE OF veterinario_id ON consultas` actualiza `recetas.veterinario_id` de esa consulta. Así queda atómico, sin depender de dos llamadas desde la server action, y aplica también a escrituras por la API. Pasa por el trigger de validación de `recetas` (el nuevo valor ya es elegible) y por `audit_trigger`, que registra los cambios de las recetas con el mismo autor.
4. **Validación también en las server actions**, antes de escribir, para dar un mensaje claro: "El veterinario seleccionado no es válido." La BD es la garantía; la action es la experiencia de uso. La action también traduce el error `23514` del trigger por si la carrera ocurre entre la validación y el insert.
5. **Componente compartido `SelectorVeterinario`** (`src/components/selector-veterinario.tsx`, cliente):
   - Props: `veterinarios`, `value`, `onChange`, `required`, `actual?` y `label`. `actual?` es el veterinario guardado no elegible, que se muestra como opción extra marcada "(no disponible)".
   - El valor por defecto lo calcula quien lo usa con un helper `veterinarioPorDefecto(veterinarios, usuarioId)`: el usuario si está en la lista, y si no, `""`.
   - Muestra "(tú)" junto al usuario actual, como hoy en los documentos.
6. **Datos hacia los formularios**:
   - `pacientes/[id]/page.tsx` ya carga `getVeterinarios()` y `getMiPerfil()`. Se pasan al `NuevaConsultaDrawer` y, vía `tabs.tsx`, al `VacunasTab`.
   - La página de edición de la consulta carga `getVeterinarios()` además de la consulta.
   - `getVacunas` agrega `veterinario:usuarios(nombre)` para mostrar el nombre en la pestaña.
7. **`EmisorDoc` y la lista de los documentos**:
   - El panel usa `data.veterinarios` tal cual, sin agregar al emisor.
   - El valor por defecto es `veterinarioPorDefecto(...)`.
   - Con valor vacío, los campos del veterinario quedan vacíos y editables (`aplicarVet` con `null`), como hoy cuando la lista viene vacía.

## Risks / Trade-offs

- [Un `dev` que hoy registra consultas de prueba en producción tendrá que elegir un veterinario] → es el comportamiento buscado. En local (Supabase local) se crea un usuario `veterinario` en el seed de pruebas si hace falta.
- [Registros históricos con veterinario `dev` siguen mostrando ese nombre] → se pueden corregir editando la consulta. Antes del deploy se cuenta cuántos hay en producción con una consulta de solo lectura (ver tareas), para saber si conviene avisar a la clínica.
- [El trigger de propagación cambia recetas ya impresas] → es lo pedido: el responsable de la receta es el de la consulta. El cambio queda en `audit_log`.
- [Error de la BD con mensaje en inglés si falla la traducción] → las actions mapean `23514` a un mensaje en español; el test lo cubre.

## Migration Plan

1. Migración `supabase/migrations/20261113000000_veterinario_responsable.sql` con la función, los triggers y `comment on function`. No modifica datos.
2. Probar en local con `supabase db reset` + `npm run test:rls` y luego con el flujo en la app.
3. Producción: `supabase db push` después de mergear a `main`, como las migraciones anteriores.
4. Rollback: migración inversa que hace `drop trigger` y `drop function`. El código anterior sigue funcionando sin ellos.
