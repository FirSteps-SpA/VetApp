## Context

Ver `proposal.md` — Why. El panel de documentos
(`src/app/(staff)/pacientes/[id]/documentos/documentos-panel.tsx`) arma dos
objetos de datos: `initAuth` para las autorizaciones y `initMicro` para el
certificado de microchip. Hoy prellena desde `paciente`, `dueno` y `clinica`
(que llegan en `DocumentosData`) y deja el resto en `""`. El emisor autenticado
no llega al panel. Al generar, se guarda un snapshot en
`documentos_emitidos.datos`; ese snapshot NO cambia con este trabajo.

Chile: la comuna es parte obligatoria de una dirección legal. La `direccion`
actual de `duenos` es texto libre de una sola línea.

## Goals / Non-Goals

**Goals:**

- Que los campos estables de los documentos vivan en la entidad que los posee y
  se precarguen solos.
- No tocar el formato ni el pipeline de generación de PDF.
- No romper el snapshot de auditoría.

**Non-Goals:**

- Descomponer la dirección completa (calle/número/depto/región). Solo se agregan
  `comuna` y `sector` junto a la `direccion` de texto libre.
- Número de microchip.
- Unicidad o validación de dígito verificador para `usuarios.rut`.
- Migrar datos existentes: todas las columnas nacen vacías.
- Un formulario de perfil de staff nuevo si ya existe uno editable; en ese caso
  se extiende.

## Decisions

### Columnas nuevas y tipos

| Columna | Tipo | Nota |
| --- | --- | --- |
| `pacientes.color` | `text` null | Texto libre, como `raza`. |
| `pacientes.modo_obtencion` | `text` null + `CHECK` | Valores: `recogido, reubicacion, regalo, nacido, compra`. |
| `pacientes.razon_tenencia` | `text` null + `CHECK` | Valores: `compania, asistencia, terapia, trabajo, seguridad, deporte, exposicion, reproduccion, caza`. |
| `duenos.comuna` | `text` null | Junto a `direccion`. |
| `duenos.sector` | `text` null | Junto a `direccion`. |
| `usuarios.rut` | `text` null | Sin unicidad ni validación DV. |
| `usuarios.titulo_profesional` | `text` null + `CHECK` | Valores: `medico, tecnico`. |

**`text` + `CHECK` en vez de un `enum` de Postgres** para `modo_obtencion` /
`razon_tenencia` / `titulo_profesional`: el resto del schema ya usa ese patrón
(`pacientes.especie`, `pacientes.sexo`, `consultas.tipo`), agregar un valor es un
`ALTER ... DROP CONSTRAINT / ADD CONSTRAINT` sin `ALTER TYPE`, y los conjuntos de
valores ya están fijados en el panel. Alternativa (enum dedicado) descartada por
consistencia y costo de evolución.

**`titulo_profesional` como `select` (`medico` / `tecnico`), no texto libre ni
derivado de `rol`**: `rol` (`veterinario`, `recepcionista`, …) es control de
acceso, no un título que aparezca en un documento. El único consumidor del título
es el check `tipoProfesional` del formulario oficial de microchip, que es
binario (médico / técnico). Guardar el mismo código que espera ese check hace el
mapeo una identidad y elimina cualquier heurístico sobre texto libre. El campo
sigue siendo editable en el panel antes de generar. Alternativa (texto libre)
descartada: nada imprime el título como texto y abría la puerta a valores que el
check no sabe interpretar.

### El emisor llega al panel

`DocumentosData` gana un campo `emisor` (id, nombre, `rut`, `titulo_profesional`)
que `pacientes/[id]/page.tsx` completa con el usuario autenticado. `initAuth`
usa `emisor.nombre` para `medicoACargo`; `initMicro` parte `emisor.nombre` en
`vetNombres` / `vetApellidos` (primer token / resto) y usa `emisor.rut`,
`emisor.titulo_profesional`.

**Selección de otro veterinario**: un `<select>` en el panel poblado con los
usuarios de rol `veterinario`/`dev` (los que ya son visibles por
`usuarios_select`), por defecto el emisor. Cambiarlo recarga los tres campos del
veterinario. Alternativa (siempre el emisor, sin selección) descartada: recepción
emite documentos en nombre del veterinario del caso.

### Dónde se editan los campos nuevos

- `color`, `modo_obtencion`, `razon_tenencia`: formulario de alta/edición de
  paciente.
- `comuna`, `sector`: formulario de alta/edición de dueño.
- `rut`, `titulo_profesional`: edición del perfil propio del staff. Si no existe
  una pantalla de perfil editable, se agrega una mínima (solo estos dos campos)
  bajo el área de staff; `usuarios_update` ya permite `id = auth.uid()`.

### RLS

Sin cambios de política. `usuarios_update` (`using id = auth.uid()`) cubre
columnas nuevas de la misma fila. `pacientes_update` / `duenos_update` ya son
`is_staff()`. Confirmar en tareas que no haya `GRANT` por columna que excluya las
nuevas (no hay: los grants del proyecto son a nivel de tabla).

## Risks / Trade-offs

- **Datos vacíos tras el deploy** → El spec ya contempla el campo vacío con
  ingreso manual; el comportamiento previo sigue disponible como fallback. Se
  llenan de forma incremental al editar cada ficha.
- **`vetNombres` / `vetApellidos` a partir de un `nombre` de un solo campo** → El
  split "primer token / resto" falla con nombres compuestos. Mitigación: ambos
  campos quedan editables en el panel; no se persiste el split.
- **Heurístico título → check `tipoProfesional`** → Puede elegir mal el check.
  Mitigación: el check es editable antes de generar.
- **Divergencia entre la ficha y lo emitido** → Corregir un campo en el panel no
  actualiza el registro de origen (por diseño: el panel emite, no edita fichas).
  El snapshot guarda lo realmente emitido.
