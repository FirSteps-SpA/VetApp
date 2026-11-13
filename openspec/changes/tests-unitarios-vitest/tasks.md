# Tasks

## 1. Configuración de Vitest

- [x] 1.1 Instalar `vitest` como devDependency (`npm i -D vitest`) y verificar que queda en `package.json` y `package-lock.json`.
- [x] 1.2 Crear `vitest.config.ts` con entorno `node`, `include: ["src/**/*.test.ts"]` y alias `@` → `./src`. Verificar que `npx tsc --noEmit` y `npm run lint` siguen sin errores.
- [x] 1.3 Agregar en `package.json` los scripts `test:utc` (`TZ=UTC vitest run`), `test:santiago` (`TZ=America/Santiago vitest run`) y `test` (ambos en secuencia). Verificar con un test mínimo provisional que `npm run test` ejecuta la suite dos veces y que un `expect(false)` hace fallar el comando con código distinto de 0. Después, eliminar el test provisional.

## 2. Tests de `zona.ts`

- [x] 2.1 Crear `src/lib/utils/zona.test.ts` con casos para `esFechaCalendario`, `sumarDias` (cambio de mes y de año, días negativos), `diaSemana` (lunes = 0, domingo = 6), `fechaEnZona` y `partesEnZona` (instante de noche que en UTC ya es el día siguiente). Verificar que `npm run test` pasa en ambas zonas.
- [x] 2.2 Agregar casos de `instanteEnZona` e `inicioDelDia` según la spec `clinic-time-zone`: invierno (`2026-07-15 10:00` → `14:00Z`), verano (`2026-01-15 10:00` → `13:00Z`), hora inexistente (`2026-09-06 00:00` → `2026-09-06T04:00:00Z`), inicio del día después de la hora repetida de abril (`2026-04-05` → `04:00Z`, con `fechaEnZona` = `2026-04-05`), y error con una fecha inválida. Verificar que `npm run test` pasa en ambas zonas.
- [x] 2.3 Comprobar que los tests detectan una regresión: reemplazar temporalmente `ZONA_CLINICA` por `"UTC"` en `zona.ts` y verificar que `npm run test` falla. Después, revertir el cambio y confirmar con `git diff src/lib/utils/zona.ts` que el archivo queda sin cambios.

## 3. Tests de `format.ts`

- [x] 3.1 Crear `src/lib/utils/format.test.ts` con un helper que normalice espacios (incluido U+202F) y casos para:
  - `formatearFecha`: fecha de calendario `2026-03-01` → `01-03-2026`; instante `2026-11-13T00:30:00Z` → `12-11-2026`; `null` y texto inválido → `—`.
  - `formatearHora` y `formatearFechaHora`: el mismo instante da las 21:30 de Chile en el formato actual (`09:30 p. m.`); texto inválido → `—`.
  - `formatearPeso`.

  Verificar que `npm run test` pasa en ambas zonas.
- [x] 3.2 Agregar casos de `isoDia`, `inicioSemana` (`2026-09-06` → `2026-08-31`; un lunes devuelve el mismo día) y `etiquetaDia` (el mismo día en ambas zonas). Verificar que `npm run test` pasa en ambas zonas.
- [x] 3.3 Agregar casos de `calcularEdad` con reloj fijo (`vi.useFakeTimers` + `vi.setSystemTime`). Deben cubrir:
  - Meses y años en singular y plural.
  - `null`, fecha futura y texto inválido → `null`.
  - El borde de medianoche: a `2026-03-01T01:00:00Z`, que en Chile aún es el 28 de febrero, una mascota nacida el `2025-03-01` todavía tiene `11 meses`.

  Verificar que `npm run test` pasa en ambas zonas.

## 4. CI

- [x] 4.1 En `.github/workflows/ci.yml`, agregar `develop` a los disparadores `push` y `pull_request`, y el paso `- run: npm run test` en el job `build`, después de `npm ci`. Verificar la sintaxis con `npx --yes yaml-lint .github/workflows/ci.yml`, o revisando el workflow en el PR.
- [ ] 4.2 Abrir el PR contra `develop` y verificar en GitHub Actions que el job `build` ejecuta el paso de tests en ambas zonas y termina en verde, y que el job `rls` también corre.

## Workflow follow-up

- Archivar el change con `/opsx:archive` cuando el PR esté aprobado y mergeado.
- Marcar la spec #2 como ✅ en `1stDocs/005-roadmap/001-VetApp.md`.
- Opcional: activar la protección de `develop` exigiendo el check `build`.
