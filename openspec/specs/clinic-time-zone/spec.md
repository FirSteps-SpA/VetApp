# clinic-time-zone Specification

## Purpose
Garantiza que las fechas y horas de la clínica se interpreten y muestren en su zona horaria (America/Santiago) sin importar dónde se ejecute el código, y que una regresión en ese comportamiento se detecte antes de llegar a producción.

## Requirements

### Requirement: Fechas de calendario sin desplazamiento
Una fecha de calendario sin hora (`YYYY-MM-DD`, como la fecha de nacimiento o de una vacuna) SHALL mostrarse como el mismo día guardado (`dd-mm-aaaa`), sin convertirla a un instante, en cualquier zona horaria del entorno.

#### Scenario: Fecha de calendario en un servidor UTC
- **WHEN** se formatea la fecha `2026-03-01` en un entorno con zona UTC
- **THEN** se muestra `01-03-2026`

#### Scenario: Fecha de calendario en un navegador de Chile
- **WHEN** se formatea la fecha `2026-03-01` en un entorno con zona America/Santiago
- **THEN** se muestra `01-03-2026`, no el día anterior

### Requirement: Instantes mostrados en la hora de la clínica
Un instante (timestamp con zona) SHALL mostrarse con la fecha y hora de pared de America/Santiago, incluido el cambio de día cuando la hora UTC ya es del día siguiente.

#### Scenario: Cita de noche
- **WHEN** se muestra el instante `2026-11-13T00:30:00Z` (21:30 del 12 de noviembre en Chile, horario de verano)
- **THEN** se muestra la fecha `12-11-2026` y la hora de las 21:30 de Chile (hoy en formato `09:30 p. m.`), idéntica en un entorno UTC y en uno America/Santiago

### Requirement: Hora de pared de la clínica a instante
Una fecha y hora ingresadas por el staff (hora de pared de la clínica) SHALL convertirse al instante correspondiente en America/Santiago, aplicando el desfase vigente ese día (horario de verano o de invierno).

#### Scenario: Hora en horario de invierno
- **WHEN** se convierte `2026-07-15 10:00`
- **THEN** el instante es `2026-07-15T14:00:00Z`

#### Scenario: Hora en horario de verano
- **WHEN** se convierte `2026-01-15 10:00`
- **THEN** el instante es `2026-01-15T13:00:00Z`

#### Scenario: Hora inexistente por el salto de septiembre
- **WHEN** se convierte `2026-09-06 00:00`, hora que no existe porque el reloj salta de 00:00 a 01:00
- **THEN** el instante es el primero válido posterior, `2026-09-06T04:00:00Z` (01:00 en Chile)

#### Scenario: Inicio de un día con hora repetida en abril
- **WHEN** se calcula el inicio del día `2026-04-05`, cuando la hora 23:00–24:00 del día anterior se repite
- **THEN** el instante es `2026-04-05T04:00:00Z` y su fecha en la zona de la clínica es `2026-04-05`

### Requirement: Calendario semanal independiente de la zona
El día de la semana, el lunes de la semana y las etiquetas de día de una fecha de calendario SHALL ser los mismos en cualquier zona horaria del entorno, incluidos los días de cambio de horario.

#### Scenario: Semana del cambio de horario
- **WHEN** se calcula el lunes de la semana del domingo `2026-09-06`
- **THEN** el resultado es `2026-08-31`, en UTC y en America/Santiago

### Requirement: Verificación automática en ambas zonas
El CI SHALL ejecutar los tests de fechas y horas con la zona UTC y con la zona America/Santiago en cada push y pull request a `develop` y a `main`, y el check SHALL fallar si alguno falla en cualquiera de las dos zonas.

#### Scenario: Regresión de zona horaria
- **WHEN** un cambio hace que una fecha de calendario se muestre un día antes en alguna de las dos zonas
- **THEN** el job `build` del CI falla y el PR no puede mergearse a `main`

#### Scenario: Suite sana
- **WHEN** todos los tests pasan en ambas zonas
- **THEN** el paso de tests del job `build` termina con éxito
