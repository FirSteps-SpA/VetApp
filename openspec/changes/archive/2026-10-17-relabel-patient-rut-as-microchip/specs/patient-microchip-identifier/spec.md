# Spec Delta

## Purpose

Define cómo se captura e identifica el número de microchip de un paciente: campo opcional, comparado por su forma normalizada y único entre pacientes cuando está presente. Reutiliza el mismo mecanismo de almacenamiento/unicidad que ya existía para el RUT de paciente, sin cambios de schema.

## ADDED Requirements

### Requirement: Número de microchip opcional en pacientes

El sistema SHALL permitir registrar un número de microchip opcional en cada paciente. El valor vacío MUST estar permitido y no debe bloquear el alta ni la edición.

#### Scenario: Alta sin número de microchip

- **WHEN** se registra un paciente sin ingresar número de microchip
- **THEN** el registro se crea correctamente con el microchip ausente

#### Scenario: Varios pacientes sin número de microchip

- **WHEN** existen dos o más pacientes sin número de microchip
- **THEN** el sistema los acepta sin considerarlos duplicados

### Requirement: Normalización canónica del número de microchip

Al guardar, el sistema SHALL derivar una forma normalizada del número de microchip (alfanumérica en mayúscula, sin puntos, guiones ni espacios) que se usa para todas las comparaciones de igualdad, independiente del formato ingresado.

#### Scenario: Mismo número de microchip en distinto formato

- **WHEN** se ingresa el mismo número de microchip con espacios o guiones distintos en dos pacientes
- **THEN** ambos se consideran el mismo microchip

### Requirement: Unicidad del número de microchip entre pacientes

Cuando el número de microchip está presente, MUST ser único entre los pacientes. Los valores ausentes no participan de la unicidad. Esta unicidad es independiente de la del RUT de dueño.

#### Scenario: Número de microchip duplicado

- **WHEN** se intenta guardar un paciente con un número de microchip que ya tiene otro paciente (en cualquier formato equivalente)
- **THEN** la operación se rechaza y el registro no se crea

### Requirement: Sin validación de formato específico

El sistema SHALL NOT rechazar un número de microchip por no cumplir un formato específico (por ejemplo, la longitud de 15 dígitos del estándar ISO), de modo que se acepten microchips de formatos antiguos o de otros fabricantes.

#### Scenario: Formato de microchip no estándar

- **WHEN** se ingresa un número de microchip que no tiene 15 dígitos
- **THEN** el sistema lo acepta como identificador válido

### Requirement: Feedback de duplicado en formularios

Cuando un usuario envía un número de microchip que ya existe en otro paciente, el formulario SHALL mostrar un mensaje claro de "ya registrado" en lugar de un error genérico, y no crear ni actualizar el registro.

#### Scenario: Alta o edición con microchip duplicado

- **WHEN** un usuario del staff registra o edita un paciente con un número de microchip ya usado por otro paciente
- **THEN** el formulario muestra que el número de microchip ya está registrado y no se guarda el cambio

### Requirement: Visibilidad del número de microchip

El sistema SHALL mostrar el número de microchip del paciente, cuando está presente, en la ficha del paciente y en los documentos clínicos exportados en PDF, con una etiqueta que lo identifique como número de microchip y no como RUT.

#### Scenario: Paciente con microchip en su ficha

- **WHEN** un paciente tiene un número de microchip guardado
- **THEN** su ficha y los PDF clínicos que lo incluyen lo muestran bajo la etiqueta "N.º de microchip"

#### Scenario: Paciente sin microchip

- **WHEN** un paciente no tiene número de microchip guardado
- **THEN** su ficha y los PDF clínicos muestran el campo vacío en lugar de un valor placeholder de RUT
