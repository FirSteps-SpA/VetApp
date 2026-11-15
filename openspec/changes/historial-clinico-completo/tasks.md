# Tasks

## 1. Campos del historial

- [x] 1.1 Agregar `incluirAnamnesis` e `incluirSignosVitales` a `OpcionesHistorial` (`src/lib/pdf/documents.tsx`)
- [x] 1.2 Crear `src/lib/consultas/campos-historial.ts` con `camposConsultaHistorial(c, opciones, origen)`:
  - orden: evolución (solo controles), motivo, anamnesis, examen físico, peso, temperatura, diagnóstico diferencial, diagnóstico, tratamiento, notas
  - omite campos vacíos y las secciones desactivadas
  - con `origen`, omite motivo, diagnóstico y diagnóstico diferencial iguales a los del origen
- [x] 1.3 Tests en `campos-historial.test.ts`:
  - orden completo y campos vacíos
  - cada opción desactivada
  - control con y sin origen
  - control con diagnóstico distinto
  - comparación con espacios en los extremos y con `null`

## 2. PDF y panel

- [x] 2.1 `ConsultaHistorial` dibuja la lista de `camposConsultaHistorial`. Pasar `origen` solo a los controles agrupados bajo su consulta; los sueltos, `null`
- [x] 2.2 Tarjeta de consulta con `wrap` siempre y la cabecera unida al primer campo (`minPresenceAhead`)
- [x] 2.3 `export-panel.tsx`: casillas "Incluir anamnesis y examen físico" e "Incluir signos vitales", activas por defecto

## 3. Verificación

- [x] 3.1 `npm run lint`, `npx tsc --noEmit`, `npm run test` y `npm run build`
- [x] 3.2 Recorrido en la app local (Playwright), exportando el historial:
  - una consulta con todos los campos sale completa y con el diferencial antes del diagnóstico
  - cada casilla nueva quita sus campos
  - la vista previa se marca desactualizada al cambiar una casilla
  - un control agrupado no repite motivo ni diagnóstico
  - un control suelto (exportado por rango) sí los muestra
  - una consulta larga se parte entre páginas sin cortarse
- [x] 3.3 El historial del portal del dueño sigue igual: sin anamnesis, examen físico ni diagnóstico diferencial

## Workflow follow-up

- Commit, PR contra `develop`, merge, `/opsx:archive` y marcar la spec 5 en el roadmap y el backlog de 1stDocs.
