# Tasks

## 1. Base de datos

- [x] 1.1 Crear `supabase/migrations/20261113000000_veterinario_responsable.sql` con:
  - `public.es_veterinario_elegible(uuid)`: `stable`, `security definer`, `search_path` fijo.
  - `public.validar_veterinario_responsable()` y sus triggers `BEFORE INSERT OR UPDATE OF veterinario_id` en `consultas`, `recetas` y `vacunas`. Validan en el insert y, en el update, solo si cambia el valor; si no es elegible, `errcode '23514'`.
  - El trigger `AFTER UPDATE OF veterinario_id ON consultas` que propaga el cambio a sus `recetas`.

  Verificar con `supabase db reset` que la migración aplica sin errores.
- [x] 1.2 Agregar controles a `scripts/test-rls.mjs`. Crear un segundo veterinario, un `dev` y un veterinario desactivado, y verificar con la sesión del veterinario:
  - Puede insertar una consulta a nombre del otro veterinario.
  - Se rechaza insertar una consulta, receta o vacuna con el `dev`, la recepcionista o el veterinario desactivado.
  - Cambiar el veterinario de una consulta con receta actualiza la receta.
  - Una consulta con veterinario no elegible (insertada con service role antes de desactivarlo) se puede editar sin cambiar el veterinario.
  - `audit_log` registra como autor al veterinario que hizo el insert, no al responsable (consulta con service role).

  Verificar que `npm run test:rls` pasa todos los controles, los nuevos y los existentes.

## 2. Datos y selector compartido

- [x] 2.1 En `src/lib/data/usuarios.ts`, `getVeterinarios()` debe filtrar solo `rol = 'veterinario'` y activos. Actualizar su comentario. Agregar `veterinario:usuarios(nombre)` a la consulta de `getVacunas` (`src/lib/data/vacunas.ts`) y su tipo (`VacunaConVet` en `src/lib/types/db.ts`). Verificar con `npx tsc --noEmit`.
- [x] 2.2 Crear `src/components/selector-veterinario.tsx` con:
  - `SelectorVeterinario`: opción vacía "Elegir veterinario…", "(tú)" junto al usuario actual y la opción extra "(no disponible)" para el veterinario guardado que ya no es elegible.
  - `veterinarioPorDefecto(veterinarios, usuarioId)`.

  Agregar `src/components/selector-veterinario.test.ts` con los casos de `veterinarioPorDefecto`: usuario elegible, usuario `dev` y lista vacía. Verificar con `npm run test`.

## 3. Consulta y receta

- [x] 3.1 En `crearConsulta` (`consultas/actions.ts`):
  - Recibir `veterinarioId`, validar que es elegible antes de escribir y usarlo para la consulta y la receta.
  - Mapear el error `23514` a "El veterinario seleccionado no es válido.".

  Verificar en la app local que una consulta con receta guardada a nombre de otro veterinario muestra ese nombre en el detalle, en la ficha y en el PDF de la receta.
- [x] 3.2 En `NuevaConsultaDrawer`, agregar el `SelectorVeterinario` obligatorio al inicio del formulario, con valor por defecto según `veterinarioPorDefecto`. `pacientes/[id]/page.tsx` le pasa `veterinarios` y el id del usuario actual. Verificar en la app que un veterinario ve su nombre por defecto y que con el usuario `dev` el selector queda vacío, no lo lista y bloquea el guardado.
- [x] 3.3 En la edición de la consulta:
  - La página carga `getVeterinarios()`.
  - `EditConsultaForm` agrega el selector con el veterinario actual y, si no es elegible, lo pasa como `actual`.
  - `actualizarConsulta` recibe `veterinarioId`, lo valida solo si cambió y mapea el `23514`.

  Verificar en la app que cambiar el veterinario de una consulta con receta cambia el nombre en el detalle y en el PDF de la receta. Verificar también que una consulta con veterinario `dev` se edita sin tocar el veterinario.

## 4. Vacunas

- [x] 4.1 `crearVacuna` recibe `veterinarioId`, lo valida y mapea el `23514`. `VacunasTab` agrega el selector con la misma regla de valor por defecto (recibe `veterinarios` y el usuario actual vía `tabs.tsx`) y muestra el nombre del veterinario en cada vacuna. Verificar en la app que una vacuna registrada a nombre de otro veterinario muestra ese nombre en la pestaña.

## 5. Documentos

- [x] 5.1 En `documentos-panel.tsx`, usar `SelectorVeterinario` con `data.veterinarios` sin agregar al emisor, y con valor por defecto `veterinarioPorDefecto(data.veterinarios, data.emisor?.id)`. Si no hay valor, los campos del veterinario quedan vacíos y editables. Verificar en la app que:
  - Un veterinario ve sus datos precargados.
  - El usuario `dev` no aparece y ve los campos vacíos hasta elegir.
  - Elegir otro veterinario precarga su RUT y su título.

## 6. Verificación integral

- [x] 6.1 `grep -rn "veterinario_id: user.id" src` solo debe mostrar `agenda/actions.ts`, que está fuera de alcance. `npm run test`, `npm run lint`, `npx tsc --noEmit` y `npm run build` deben pasar sin errores.
- [x] 6.2 Contar en producción, con una consulta de solo lectura, los registros cuyo veterinario no es elegible:

  ```sql
  select 'consultas', count(*) from consultas c
  where not exists (select 1 from usuarios u where u.id = c.veterinario_id and u.rol = 'veterinario' and u.activo)
  ```

  Repetir para `recetas` y `vacunas`, y anotar el resultado en el PR.

## Workflow follow-up

- Abrir el PR contra `develop`.
- Después de mergear a `main`, aplicar la migración en producción con `supabase db push` y verificar con un registro de prueba que la validación funciona.
- Archivar con `/opsx:archive` y marcar la spec #3 como ✅ en `1stDocs/005-roadmap/001-VetApp.md`.
