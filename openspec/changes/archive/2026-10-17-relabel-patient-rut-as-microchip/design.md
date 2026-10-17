# Design

## Context

Ver proposal.md - Why. El mecanismo técnico (columna `rut`, columna generada `rut_normalizado`, índice único parcial, helper `tipoConflictoUnico`) ya existe y no cambia. Este documento fija cómo tocar el código sin romper esa mecánica compartida entre pacientes y dueños.

## Goals / Non-Goals

**Goals:**
- Cambiar únicamente el texto visible al staff (labels, mensaje de duplicado) en los puntos de contacto de paciente.
- Dejar explícito qué NO se toca, para que la implementación no se expanda de alcance.

**Non-Goals:**
- Renombrar la columna `pacientes.rut`, la columna generada `rut_normalizado`, el índice único o el campo `rut` del tipo `Paciente` en `src/lib/types/db.ts`.
- Tocar `tipoConflictoUnico()` en `src/lib/db-errors.ts` o su tipo de retorno.
- Agregar validación de formato (regex, longitud, dígito verificador) al input.
- Cualquier cambio al RUT de dueño (`dueno_rut`), que sigue siendo un RUT real.

## Decisions

### 1. El campo sigue llamándose `rut` a nivel de columna, tipo y `name` de input

Solo cambia lo que el staff lee: el `label` del `<input>`, el label en `<Dato label="RUT" .../>` y en el PDF. El atributo `name="rut"` del formulario, la clave `rut` en el objeto insertado/actualizado (`actions.ts:129`, `actions.ts:69`) y `Paciente.rut` en `db.ts` quedan igual.

**Alternativa considerada**: introducir un alias `microchip` en una capa de DTO que internamente mapee a la columna `rut`. Rechazada — el usuario definió el alcance como "solo UI" (label + validación); una capa de alias agrega indirección sin cambiar comportamiento observable, y complica lecturas futuras del código sin necesidad.

### 2. `tipoConflictoUnico()` no cambia; solo cambia el string que arma cada caller

`tipoConflictoUnico()` distingue conflictos por substring (`"rut_normalizado"` → `"rut"`) sin saber en qué tabla ocurrió el insert/update — el caller ya lo sabe por contexto (paciente vs. dueño) y arma su propio mensaje. Por eso el único cambio real es el string literal en los dos call sites de paciente:

- `src/app/(staff)/pacientes/nuevo/actions.ts:151-152`
- `src/app/(staff)/pacientes/[id]/editar/actions.ts:87-88`

de `"El RUT ya está registrado en otro paciente."` a un mensaje que hable de microchip. Los call sites de dueño (mismo archivo, rama `usarExistente === false`) no se tocan.

**Alternativa considerada**: separar `tipoConflictoUnico` en dos funciones (`tipoConflictoUnicoPaciente` / `...Dueno`) para que cada una devuelva ya el string final. Rechazada — el valor de retorno (`"rut" | "email" | "otro"`) es una etiqueta interna, no se muestra al usuario; duplicar la función solo por claridad cosmética no está pedido y amplía el diff sin necesidad.

### 3. Texto de la etiqueta

Se usa **"N.º de microchip"** como label en formularios, ficha de paciente y PDF, y **"El número de microchip ya está registrado en otro paciente."** como mensaje de duplicado. Se evita la palabra "Microchip" a secas para no confundirse con el tipo de documento existente "Certificado de microchip" (`TipoDocumentoLegal`, valor `"microchip"`) que ya aparece en el mismo panel de documentos del paciente.

### 4. Sin atributo de validación en el input

El `<input>` de paciente sigue sin `pattern`, `required` ni `maxLength` específico — mismo comportamiento permisivo que tenía como RUT, que ya es el correcto para números de microchip de formato variable (ver spec `patient-microchip-identifier`, requisito "Sin validación de formato específico").

## Risks / Trade-offs

- **[Riesgo]** El nombre interno (`rut`, `rut_normalizado`, `pacientes_rut_normalizado_key`) seguirá sin coincidir con lo que ve el staff ("N.º de microchip"), lo que puede confundir a quien lea el código más adelante. → **Mitigación**: un comentario de una línea junto al campo `rut` en `src/lib/types/db.ts` (interfaz `Paciente`) indicando que se muestra como número de microchip. No se renombra nada para no abrir una migración de schema fuera de alcance.
- **[Riesgo]** Como la columna sigue llamándose `rut`, alguien podría agregar en el futuro validación de dígito verificador chileno "porque se llama rut". → **Mitigación**: el requisito "Sin validación de formato específico" en la nueva spec `patient-microchip-identifier` es la referencia a citar en ese caso; no requiere acción ahora.
- **[Riesgo]** Ninguno a nivel de datos: no hay migración, no hay transformación de valores existentes, no hay downtime.

## Migration Plan

No aplica migración de base de datos. El despliegue es un cambio de código/copy puro (labels + strings de error); el rollback es revertir el commit sin implicancias de datos.
