## MODIFIED Requirements

### Requirement: Unicidad del RUT de dueño

Cuando el RUT está presente, MUST ser único entre los dueños de una misma clínica. Dueños de clínicas distintas pueden tener el mismo RUT, porque cada clínica mantiene su propia ficha de dueño. Los valores ausentes no participan de la unicidad.

#### Scenario: RUT de dueño duplicado

- **WHEN** se intenta guardar un dueño con un RUT que ya tiene otro dueño de la misma clínica (en cualquier formato equivalente)
- **THEN** la operación se rechaza y el registro no se crea

#### Scenario: Mismo RUT en otra clínica

- **WHEN** se guarda un dueño con un RUT que ya tiene un dueño de otra clínica
- **THEN** el registro se acepta

#### Scenario: Mismo número en paciente y dueño

- **WHEN** el número de microchip de un paciente coincide con el RUT de un dueño
- **THEN** ambos se aceptan, porque la unicidad del RUT de dueño (esta capacidad) es independiente de la unicidad del número de microchip de paciente (capacidad `patient-microchip-identifier`)
