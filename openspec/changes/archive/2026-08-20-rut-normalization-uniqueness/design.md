## Context

`pacientes.rut` y `duenos.rut` ya existen como `text` nullable, sin normalización ni unicidad. El manejo de duplicados por `email` en `duenos` ya usa el error Postgres `23505` traducido a mensaje de formulario; reutilizamos ese patrón. Ver proposal.md — Why para la motivación.

## Goals / Non-Goals

**Goals:**
- Que dos ingresos del mismo documento con distinto formato se traten como el mismo valor.
- Que la unicidad sea imposible de saltar desde la app (garantía en DB).
- Mantener el campo utilizable para clientes/pacientes extranjeros (sin RUT chileno).

**Non-Goals:**
- Validar el dígito verificador (módulo 11) — decisión explícita (D3).
- Deduplicar el mismo documento **entre** tablas (un paciente y un dueño pueden compartir número; son entidades distintas).
- Migrar/normalizar datos existentes (beta sin RUT cargado, D5).

## Decisions

**Forma canónica = alfanumérico en mayúscula, sin separadores.** `regexp_replace(rut, '[^0-9kK]', '', 'g')` en mayúscula → `12.345.678-5`, `12345678-5` y `123456785` colapsan a `123456785`; `k`→`K`. *Alternativa rechazada:* guardar formato de display `NNNN-DV`; requiere separar número/DV de forma fiable, y sin validar DV no podemos asumir la estructura.

**Enforcement = columna generada `rut_normalizado` (STORED) + índice único parcial.** La normalización vive en la BD como `generated always as (...) stored`, y el índice único es `... where rut_normalizado is not null`. *Alternativa rechazada:* normalizar solo en la app; se puede saltar por SQL directo o por el cliente admin (`service_role`), justo los caminos que usa este proyecto.

**Unicidad por tabla, no global.** Un índice único por tabla. Namespaces independientes: el "documento" del paciente y el RUT del dueño no comparten espacio. *Alternativa rechazada:* unicidad cruzada — mezcla identidades de entidades distintas.

**Opcional en ambas (D1).** `NULL` permitido; el índice parcial (`where ... is not null`) deja convivir múltiples registros sin RUT. Cubre el caso extranjero/sin-documento sin campos extra.

**Feedback de formulario (D6).** Las acciones capturan `23505` sobre el índice de RUT y devuelven "ya registrado", igual que hoy con `email`.

## Risks / Trade-offs

- **Documentos basura aceptados (sin validar DV)** → Mitigación: se acepta a propósito para no excluir extranjeros; agregar validación de DV más adelante sería un cambio de requisito aparte, no bloquea este.
- **Carrera entre inserciones concurrentes con el mismo RUT** → Mitigación: el índice único resuelve atómicamente en la BD; la app traduce el `23505`.
- **La normalización descarta caracteres no `[0-9kK]`** (p. ej. letras de un pasaporte) → Mitigación: revisar la clase de caracteres si se decide soportar pasaportes alfabéticos; hoy el caso objetivo es RUT + documentos numéricos.

## Migration Plan

1. Agregar `rut_normalizado` (generated stored) a `pacientes` y `duenos`.
2. Crear índice único parcial sobre `rut_normalizado` (`where rut_normalizado is not null`) en cada tabla.
3. Sin backfill (no hay RUTs cargados). *Si en el futuro se aplica sobre datos con RUT:* normalizar primero y resolver colisiones antes de crear el índice.
4. **Rollback:** `drop index` + `drop column rut_normalizado` en ambas tablas.
