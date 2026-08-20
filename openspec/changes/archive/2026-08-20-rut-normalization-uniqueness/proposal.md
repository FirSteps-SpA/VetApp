## Why

El RUT (y su documento equivalente para pacientes) se guarda hoy como texto libre en `pacientes` y `duenos`, sin normalización ni unicidad. Eso permite duplicados y formatos inconsistentes (`12.345.678-5`, `12345678-5`, `123456785`) que ensucian la búsqueda y la deduplicación de registros. Estamos en beta con pocos datos de prueba (sin RUT cargados aún): es el momento barato para imponer la regla antes de que entren datos reales.

## What Changes

- Se **normaliza** el RUT/documento a una forma canónica comparable (alfanumérico en mayúscula, sin puntos ni guiones) al momento de guardar.
- Se impone **unicidad cuando el valor está presente** en ambas tablas (`pacientes`, `duenos`), de forma independiente por tabla. El campo sigue siendo **opcional** (NULL permitido; múltiples NULL no colisionan).
- **No** se valida el dígito verificador: se aceptan documentos extranjeros / pasaportes que no siguen el módulo 11.
- La unicidad se garantiza en la base de datos (columna generada `rut_normalizado` + índice único parcial), no solo en la aplicación.
- Los formularios de alta/edición de paciente y de dueño dan **feedback de duplicado** en vez de fallar de forma opaca.
- No es **BREAKING**: los datos de prueba actuales no tienen RUT, así que no hay colisiones que resolver ni migración de datos.

## Capabilities

### New Capabilities
- `patient-owner-identity`: Números de identificación (RUT / documento) de pacientes y dueños — cómo se capturan, normalizan y se mantienen únicos.

### Modified Capabilities
<!-- Ninguna: no hay specs previos; esta es la primera capacidad capturada (adopción orgánica de specs). -->

## Impact

- **Migraciones**: nueva columna generada `rut_normalizado` e índice único parcial en `pacientes` y `duenos`.
- **Tipos**: `Paciente` y `Dueno` en `src/lib/types/db.ts` (el campo `rut` ya existe).
- **Acciones**: normalización en `crearPaciente`, `actualizarPaciente`, `crearYVincularDueno`, `actualizarDueno` (y alta con dueño existente).
- **UI**: formularios de alta/edición de paciente y dueño — feedback de duplicado (manejo del error `23505`, como ya se hace con el email).
- **Sin** cambios de datos existentes (beta sin RUT cargado).
