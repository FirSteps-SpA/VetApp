## MODIFIED Requirements

### Requirement: Unicidad del número de microchip entre pacientes

Cuando el número de microchip está presente, MUST ser único entre los pacientes de una misma clínica. Pacientes de clínicas distintas pueden tener el mismo número, porque una mascota atendida en dos clínicas tiene una ficha en cada una. Los valores ausentes no participan de la unicidad. Esta unicidad es independiente de la del RUT de dueño.

#### Scenario: Número de microchip duplicado

- **WHEN** se intenta guardar un paciente con un número de microchip que ya tiene otro paciente de la misma clínica (en cualquier formato equivalente)
- **THEN** la operación se rechaza y el registro no se crea

#### Scenario: Mismo microchip en otra clínica

- **WHEN** se guarda un paciente con un número de microchip que ya tiene un paciente de otra clínica
- **THEN** el registro se acepta
