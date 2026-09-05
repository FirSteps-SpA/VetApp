## 1. Base de datos

- [x] 1.1 Nueva migración en `supabase/migrations/` que agrega, todas nullable:
  `pacientes.color` (text), `pacientes.modo_obtencion` (text + CHECK con
  `recogido, reubicacion, regalo, nacido, compra`), `pacientes.razon_tenencia`
  (text + CHECK con `compania, asistencia, terapia, trabajo, seguridad, deporte,
  exposicion, reproduccion, caza`), `duenos.comuna` (text), `duenos.sector`
  (text), `usuarios.rut` (text), `usuarios.titulo_profesional` (text + CHECK con
  `medico, tecnico`)
  → `supabase/migrations/20260905000000_document_prefill_columns.sql`
- [x] 1.2 Confirmar en la migración que no se necesitan cambios de RLS ni GRANT
  por columna (políticas actuales: `pacientes_update`/`duenos_update` =
  `is_staff()`, `usuarios_update` = `id = auth.uid()`) → documentado en la migración
- [x] 1.3 Aplicar la migración en el entorno local y verificar los CHECK con un
  insert de valor inválido → NO EJECUTADA aquí (sin Supabase CLI / Docker);
  cerrada por decisión del usuario al archivar. Pendiente de correr la migración
  en un entorno real.

## 2. Tipos

- [x] 2.1 Agregar `color`, `modo_obtencion`, `razon_tenencia` a `Paciente` en
  `src/lib/types/db.ts` (con los union types de valores permitidos)
- [x] 2.2 Agregar `comuna`, `sector` a `Dueno` en `src/lib/types/db.ts`
- [x] 2.3 Agregar `rut`, `titulo_profesional` al tipo de usuario en
  `src/lib/types/db.ts` (nueva interfaz `Usuario`; `titulo_profesional` es
  `TituloProfesional` = `medico | tecnico`, con lista `TITULOS_PROFESIONALES`)

## 3. Edición de los campos nuevos

- [x] 3.1 Formulario de alta/edición de paciente: campos `color` (texto),
  `modo_obtencion` y `razon_tenencia` (select con las opciones de
  `MODOS_OBTENCION` / `RAZONES_TENENCIA`), y persistirlos en la action
  correspondiente (`nuevo/patient-form.tsx` + `nuevo/actions.ts`,
  `editar/edit-form.tsx` + `[id]/actions.ts`)
- [x] 3.2 Formulario de alta/edición de dueño: campos `comuna` y `sector` junto a
  `direccion`, y persistirlos en la action de dueños (`patient-form.tsx` dueño
  nuevo + `nuevo/actions.ts`, `edit-dueno-form.tsx` + `actualizarDueno`,
  `manage-duenos.tsx` + `crearYVincularDueno`)
- [x] 3.3 Edición del perfil propio del staff: no existía pantalla de perfil →
  creada `src/app/(staff)/perfil/` (page + form + action) que edita solo `rut`
  (input) y `titulo_profesional` (select `medico | tecnico`) del propio `usuarios`
  row; enlace en el header y en el menú "Más" de la nav inferior

## 4. Emisor en el panel de documentos

- [x] 4.1 Extender `DocumentosData` en `documentos-panel.tsx` con `emisor` (id,
  nombre, rut, titulo_profesional) y `veterinarios` (nueva interfaz `EmisorDoc`)
- [x] 4.2 En `pacientes/[id]/page.tsx`, cargar `getMiPerfil()` y
  `getVeterinarios()` y pasarlos como `emisor` / `veterinarios`
  (`documentos-button.tsx` reenvía `data` sin cambios estructurales)
- [x] 4.3 Añadir al panel un `<select>` de veterinario a cargo, poblado con el
  emisor + `getVeterinarios()` (rol `dev`/`veterinario`), por defecto el emisor;
  al cambiarlo, `aplicarVet` recarga `medicoACargo` y los campos del microchip

## 5. Autollenado

- [x] 5.1 `initMicro`: precargar `color` desde `paciente.color`, `modoObtencion`
  desde `paciente.modo_obtencion`, `razonTenencia` desde
  `paciente.razon_tenencia`
- [x] 5.2 `initMicro`: `vetFields()` parte `emisor.nombre` (primer token / resto),
  toma `vetRut` de `emisor.rut` y `tipoProfesional` directo de
  `emisor.titulo_profesional` (mismos códigos `medico`/`tecnico`, sin heurístico)
- [x] 5.3 `initAuth`: `comuna` desde `dueno.comuna`, `sector` desde `dueno.sector`,
  `medicoACargo` desde `emisor.nombre`
- [x] 5.4 Campos siguen editables: `Campo`/`Selecta` sin cambios, siguen ligados a
  `setA`/`setM`; los `?? ""` dejan el campo vacío cuando el registro no tiene el
  dato. "No rompe la generación" se confirma en 6.5 (build)

## 6. Verificación

- [x] 6.1 Emitir un certificado de microchip para un paciente con todos los
  campos nuevos cargados y confirmar que el formulario oficial sale completo sin
  tipeo manual (salvo tipo y fecha de procedimiento) → NO VERIFICADA aquí
  (requiere app + Supabase); cerrada por decisión del usuario al archivar.
- [x] 6.2 Emitir una autorización de cirugía y una de hospitalización y confirmar
  que dueño/mascota/veterinario vienen precargados y solo restan los campos del
  caso → NO VERIFICADA aquí; cerrada por decisión del usuario al archivar.
- [x] 6.3 Confirmar que el snapshot en `documentos_emitidos.datos` sigue
  guardando lo generado (incluye los valores precargados) → NO VERIFICADA aquí;
  código: `snapshot()` sin cambios, sigue serializando `buildAutorizacionData()`
  / `micro`. Cerrada por decisión del usuario al archivar.
- [x] 6.4 Confirmar que un integrante del staff puede editar su propio `rut` y
  `titulo_profesional` y que otro sin esos datos no ve el flujo bloqueado → NO
  VERIFICADA aquí; cerrada por decisión del usuario al archivar.
- [x] 6.5 `npm run lint` y `npm run build` sin errores
