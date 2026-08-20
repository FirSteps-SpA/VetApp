## 1. Base de datos (nueva migración)

- [x] 1.1 Crear migración `supabase/migrations/<ts>_rut_normalizado.sql` (no editar migraciones ya aplicadas)
- [x] 1.2 Agregar columna generada `rut_normalizado` a `pacientes`: `generated always as (nullif(upper(regexp_replace(rut, '[^0-9kK]', '', 'g')), '')) stored`
- [x] 1.3 Agregar la misma columna generada a `duenos`
- [x] 1.4 Crear índice único parcial en `pacientes (rut_normalizado) where rut_normalizado is not null`
- [x] 1.5 Crear índice único parcial en `duenos (rut_normalizado) where rut_normalizado is not null`

## 2. Acciones — manejo de duplicado

- [x] 2.1 En `crearPaciente`: capturar `23505` del índice de RUT y devolver "El RUT ya está registrado en otro paciente"
- [x] 2.2 En `actualizarPaciente`: mismo manejo
- [x] 2.3 En dueños, distinguir el `23505` de RUT del de email (por nombre de constraint / `error.details`) y devolver el mensaje correcto en `crearYVincularDueno`, `actualizarDueno` y el alta con dueño nuevo de `crearPaciente`

## 3. UI — feedback en el formulario

- [x] 3.1 Verificar que el mensaje de RUT duplicado se muestra en alta y edición de paciente (los forms ya renderizan `state.error`)
- [x] 3.2 Verificar que se muestra en edición de dueño y en crear+vincular dueño

## 4. Verificación

- [x] 4.1 `npm run build` pasa sin errores
- [ ] 4.2 Aplicar la migración en Supabase y validar los escenarios del spec: mismo RUT en distinto formato → rechazado; dos registros sin RUT → permitidos; documento extranjero (no módulo 11) → aceptado; mismo número en un paciente y un dueño → permitido
