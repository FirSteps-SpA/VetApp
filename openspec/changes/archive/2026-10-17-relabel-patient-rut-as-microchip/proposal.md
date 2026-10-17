# Proposal

## Why

El campo `rut` de `pacientes` no corresponde a nada que exista en la práctica: un animal no tiene RUT chileno, y hoy nadie lo completa con sentido real. Sin embargo, el campo ya está completamente cableado como identificador opcional y único cuando está presente (columna generada `rut_normalizado` + índice único parcial, sin validación de formato). Esa misma mecánica es exactamente lo que necesita un número de microchip: opcional, alfanumérico, único por paciente cuando se conoce. En vez de agregar una columna nueva, reetiquetamos el campo existente para que refleje su uso real.

## What Changes

- Se cambia la etiqueta visible del campo `rut` de paciente a "N° de microchip" en: formulario de alta, formulario de edición, ficha del paciente y el PDF clínico.
- Se actualiza el mensaje de conflicto por duplicado en paciente ("El RUT ya está registrado en otro paciente.") por uno equivalente para microchip.
- **No** hay cambios de schema: se reutiliza tal cual la columna `pacientes.rut`, la columna generada `rut_normalizado` y su índice único parcial. Ya proveen opcionalidad + unicidad-cuando-presente sin ningún cambio.
- **No** se agrega validación de formato: se mantiene el comportamiento permisivo actual (cualquier texto alfanumérico), que ya es el comportamiento correcto para números de microchip de distintos formatos (ISO de 15 dígitos, formatos antiguos de 9-10, etc.).
- Se acota la capacidad `patient-owner-identity` para que describa únicamente el RUT de **dueños**; se elimina de ahí toda mención al RUT de pacientes (Purpose y requisitos).
- Se crea la nueva capacidad `patient-microchip-identifier` que documenta el número de microchip de paciente: opcional, normalizado/único cuando está presente, sin validación de formato, con feedback de duplicado en los formularios.
- El campo `dueno_rut` (RUT del dueño) **no** se toca: sigue siendo un RUT real, sin cambios.

## Capabilities

### New Capabilities
- `patient-microchip-identifier`: número de microchip del paciente — captura opcional, normalización/unicidad cuando está presente, sin validación de formato, feedback de duplicado.

### Modified Capabilities
- `patient-owner-identity`: se retira todo lo relativo al RUT de pacientes (Purpose y los 5 requisitos existentes dejan de mencionar pacientes); la capacidad queda enfocada solo en el RUT de dueños.

## Impact

- **UI**: `src/app/(staff)/pacientes/nuevo/patient-form.tsx:205-208`, `src/app/(staff)/pacientes/[id]/editar/edit-form.tsx:50-53`, `src/app/(staff)/pacientes/[id]/page.tsx:220`, `src/lib/pdf/documents.tsx:176-179` — cambio de etiqueta.
- **Acciones**: `src/app/(staff)/pacientes/nuevo/actions.ts:151-152`, `src/app/(staff)/pacientes/[id]/editar/actions.ts:87-88` — cambio del texto de error de duplicado. El código que escribe el valor (`actions.ts:129` y `actions.ts:69`) no cambia: sigue siendo `rut: str(formData, "rut") || null`.
- **Sin impacto en**: schema/migraciones, `src/lib/types/db.ts` (el tipo `rut: string | null` en `Paciente` se mantiene, solo cambia su significado documentado), `dueno_rut` y todo lo relativo al RUT del dueño.
- **Specs**: `openspec/specs/patient-owner-identity/spec.md` (Purpose editado directamente + delta de requisitos en este change) y nueva `openspec/specs/patient-microchip-identifier/spec.md`.
