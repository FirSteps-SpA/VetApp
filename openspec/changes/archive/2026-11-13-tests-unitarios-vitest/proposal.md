# Proposal

## Why

VetApp no tiene tests unitarios: el CI solo ejecuta lint, typecheck, build y `test:rls`. La corrección de zona horaria (PR #9, `America/Santiago` fija en `src/lib/utils/zona.ts`) se verificó con scripts temporales que ya no existen, así que una regresión volvería a mostrar fechas un día antes o citas en el día siguiente sin que nada falle. Es la spec #2 del roadmap de VetApp (`1stDocs/005-roadmap/001-VetApp.md`) y va antes de las specs 3–5, que tocan la lógica de consultas y documentos.

## What Changes

- Se agrega Vitest como runner de tests unitarios, con el script `npm run test`.
- Tests de `src/lib/utils/zona.ts`: fechas de calendario, aritmética de días, día de la semana y conversión entre hora de pared de la clínica e instante, incluidos el salto de horario de septiembre (la hora 00:00 no existe) y el retroceso de abril (la hora 23:xx se repite).
- Tests de los formateadores de `src/lib/utils/format.ts` (`formatearFecha`, `formatearHora`, `formatearFechaHora`, `isoDia`, `inicioSemana`, `etiquetaDia`, `calcularEdad`, `formatearPeso`).
- Toda la suite se ejecuta dos veces, con `TZ=UTC` (como el servidor en Vercel) y con `TZ=America/Santiago` (como el navegador de la clínica), y debe dar el mismo resultado en ambas.
- CI: paso `npm run test` en el job `build`. El workflow también pasa a ejecutarse en los PR y pushes a `develop`, donde hoy se integran las specs y donde no corre ningún check.
- Se documenta como capacidad el comportamiento de zona horaria que hoy existe sin spec.

## Capabilities

### New Capabilities
- `clinic-time-zone`: fechas y horas de la clínica se interpretan y muestran en `America/Santiago` sin importar la zona del servidor o del navegador, y el CI verifica ese comportamiento en ambas zonas.

### Modified Capabilities
<!-- Ninguna: ninguna spec existente define el manejo de zona horaria. -->

## Impact

- **Dependencias**: `vitest` (devDependency).
- **Archivos nuevos**: `vitest.config.ts`, `src/lib/utils/zona.test.ts`, `src/lib/utils/format.test.ts`.
- **Archivos modificados**: `package.json` (scripts `test`), `.github/workflows/ci.yml` (paso de tests y rama `develop` en los disparadores).
- **Sin impacto en**: código de la aplicación (`zona.ts` y `format.ts` no cambian salvo que los tests encuentren un bug), base de datos, `test:rls`, Vercel.
