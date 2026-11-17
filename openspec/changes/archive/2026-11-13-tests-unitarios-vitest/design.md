# Design

## Context

- `src/lib/utils/zona.ts` fija `America/Santiago` con `Intl` y aritmética UTC; `src/lib/utils/format.ts` construye los formateadores sobre ella. Ninguno depende de React, Next ni Supabase: son funciones puras salvo por `new Date()` en `calcularEdad`.
- `.github/workflows/ci.yml` solo se dispara en push/PR a `main`. Las specs se integran por PR a `develop` (PR #10), así que hoy esos PR no pasan por ningún check.
- Node local 22, CI en Node 24: la salida de `Intl` (ICU) puede variar levemente entre versiones (espacios finos, abreviaturas).
- Comprobado con el código actual: `formatearHora` devuelve `09:30 p. m.` (12 horas, formato por defecto de `es-CL`), no `21:30`.

## Goals / Non-Goals

**Goals:**
- Suite unitaria rápida (segundos) que corra en local y en CI sin servicios externos.
- La misma suite se ejecuta en UTC y en America/Santiago; un fallo en cualquiera rompe el job.

**Non-Goals:**
- Tests de componentes React, de server actions o end-to-end.
- Tocar `test:rls` o el job `rls`.
- Cambiar el formato de hora a 24 h: es una decisión de producto aparte (ver Open Questions).
- Umbral de cobertura.

## Decisions

1. **Vitest** en lugar de Jest o `node:test`. Entiende TypeScript y ESM sin configuración de Babel/ts-jest, y resuelve el alias `@/` con una línea de config. `node:test` exigiría un paso de compilación (el Node local no trae soporte de TypeScript). **Versión 4 (`^4.1.12`)**, no la 5: Vitest 5 exige `@types/node` ≥ 22 y el proyecto usa `^20`. Subir `@types/node` a 24 (la versión de Node en CI) queda como cambio aparte. El lockfile se generó con npm 11 (el de Node 24): el npm 9.2.0 del sistema falla al resolver los peers de Vite 8.
2. **Entorno `node`**, sin jsdom: lo que se prueba no toca el DOM.
3. **Dos ejecuciones con `TZ` en el script**, no una matriz de CI ni `process.env.TZ` dentro de los tests:
   - `test`: `npm run test:utc && npm run test:santiago`.
   - `test:utc`: `TZ=UTC vitest run`.
   - `test:santiago`: `TZ=America/Santiago vitest run`.

   `TZ` debe fijarse antes de arrancar el proceso (cambiarlo en caliente no es confiable en V8). Así `npm run test` da el mismo resultado en local y en CI, y el CI solo agrega un paso. Una matriz duplicaría `npm ci` y build por zona sin beneficio.
4. **Tests junto al código** (`src/lib/utils/*.test.ts`), con `include: ["src/**/*.test.ts"]` en `vitest.config.ts`. `tsconfig.json` ya incluye `**/*.ts`, así que `tsc --noEmit` también tipa los tests; se importa `describe/it/expect` desde `vitest` (sin globals) para no tocar `tsconfig`.
5. **Aserciones robustas frente a ICU**: los resultados que salen de `toLocale*String` se comparan tras normalizar los espacios (`\s` y U+202F → espacio). Fechas `dd-mm-aaaa` e ISO se comparan exactas.
6. **Reloj fijo para `calcularEdad`**: `vi.useFakeTimers()` + `vi.setSystemTime(...)` cerca de la medianoche UTC (p. ej. `2026-03-01T01:00:00Z`, que en Chile aún es 28 de febrero), para verificar que la edad se calcula con el día de la clínica.
7. **CI**: `npm run test` en el job `build`, después de `npm ci` y antes de `lint`, para fallar rápido. Se agrega `develop` a `on.push.branches` y `on.pull_request.branches`. El check `build` ya es obligatorio en `main`; en `develop` queda informativo salvo que se active la protección de la rama.

## Risks / Trade-offs

- [Diferencias de ICU entre Node 22 y 24] → normalización de espacios (decisión 5); si aun así difiere, el test que falla señala exactamente qué formato cambió.
- [Las reglas de horario de Chile cambian por decreto] → los tests usan fechas de 2026 ya publicadas en tzdata; si el gobierno cambia las reglas, actualizar los casos junto con tzdata.
- [Ejecutar la suite dos veces duplica el tiempo] → son segundos; aceptable.
- [CI también en `develop` consume más minutos de Actions] → el repo es público, los minutos son gratuitos.

## Migration Plan

Sin migración. Rollback: revertir el PR (elimina dependencia, config, tests y el paso de CI).

## Open Questions

- ¿La clínica prefiere ver la hora en 24 h (`21:30`) en lugar de `09:30 p. m.`? No bloquea esta spec: los tests fijan el formato actual y, si se cambia, se actualizan junto con `formatearHora`. Anotarlo en el backlog.
