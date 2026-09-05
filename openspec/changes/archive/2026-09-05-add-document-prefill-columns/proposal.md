## Why

Al emitir autorizaciones y el certificado de microchip, el staff vuelve a
escribir a mano en cada emisión datos que son estables y que deberían vivir en
el sistema: el color del animal, la comuna y el sector del domicilio del dueño,
y el RUT y título profesional del veterinario a cargo. Son datos que no cambian
entre una emisión y la siguiente, pero hoy no tienen dónde guardarse, así que se
retipean cada vez (con el riesgo de inconsistencias entre documentos del mismo
paciente).

## What Changes

- Se agregan columnas a las entidades dueñas de estos datos para que el sistema
  los conozca y los pueda precargar:
  - `pacientes.color` — color/pelaje del animal.
  - `duenos.comuna` y `duenos.sector` — junto a la `direccion` de texto libre ya
    existente (no se descompone la dirección completa).
  - `pacientes.modo_obtencion` y `pacientes.razon_tenencia` — con los mismos
    valores que ya usa el certificado de microchip.
  - `usuarios.rut` y `usuarios.titulo_profesional` — identidad profesional del
    integrante del staff.
- El panel de documentos precarga estos campos desde los registros guardados en
  lugar de dejarlos vacíos. Siguen siendo editables antes de generar.
- El "veterinario a cargo" / datos del veterinario se toman del usuario que está
  emitiendo (staff autenticado), con posibilidad de elegir otro veterinario.
- Los formularios de alta/edición de paciente y de dueño incorporan los nuevos
  campos; cada integrante del staff puede editar su propio RUT y título.
- Quedan como ingreso manual (por ser propios de cada caso, no del paciente):
  antecedentes del caso, los campos por tipo de autorización (necesidad de
  cirugía, diagnóstico presuntivo, motivo de hospitalización, etc.), el tipo de
  procedimiento del microchip y la fecha del procedimiento.
- **Fuera de scope**: el número de microchip (chip) y la descomposición completa
  de la dirección en calle/número/región.

## Capabilities

### New Capabilities

- `staff-professional-identity`: cada integrante del staff tiene un RUT y un
  título profesional guardados en su registro de usuario, que él mismo mantiene y
  que el sistema usa para autollenar el veterinario a cargo en los documentos
  legales y certificados.

### Modified Capabilities

- `authorization-documents`: el autollenado deja de tratar color, comuna, sector,
  modo de obtención, razón de tenencia y datos del veterinario como "campos que
  no existen en el sistema". Pasan a precargarse desde los registros de paciente,
  dueño y usuario emisor; el ingreso manual queda reservado para los datos
  propios de cada caso.

## Impact

- **Base de datos**: nueva migración con `pacientes.color`,
  `pacientes.modo_obtencion`, `pacientes.razon_tenencia`, `duenos.comuna`,
  `duenos.sector`, `usuarios.rut`, `usuarios.titulo_profesional`. Todas nullable;
  sin backfill. `usuarios.rut` sin restricción de unicidad en esta iteración.
- **Tipos**: `Paciente`, `Dueno`/`DuenoDePaciente` y el tipo de usuario en
  `src/lib/types/db.ts`.
- **Panel de documentos**: `src/app/(staff)/pacientes/[id]/documentos/documentos-panel.tsx`
  (`initAuth`, `initMicro`) y `DocumentosData` para recibir el usuario emisor;
  `documentos-button.tsx` y `pacientes/[id]/page.tsx` para pasarlo.
- **Formularios**: alta/edición de paciente, alta/edición de dueño, y edición del
  perfil del staff (RUT y título propios).
- **RLS**: `usuarios_update` ya permite `id = auth.uid()`; se confirma que cubre
  las columnas nuevas. Sin cambios de política previstos.
- **Sin impacto** en el snapshot de `documentos_emitidos.datos` (sigue guardando
  lo que se generó) ni en el portal de clientes.
