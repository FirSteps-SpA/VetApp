# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: RUT opcional en pacientes y dueños`
- TO: `### Requirement: RUT opcional en dueños`
- FROM: `### Requirement: Unicidad del RUT por entidad`
- TO: `### Requirement: Unicidad del RUT de dueño`

## MODIFIED Requirements

### Requirement: RUT opcional en dueños

El sistema SHALL permitir registrar un RUT (o documento equivalente) opcional en los dueños. El valor vacío MUST estar permitido y no debe bloquear el alta ni la edición.

#### Scenario: Alta sin RUT

- **WHEN** se registra un dueño sin ingresar RUT
- **THEN** el registro se crea correctamente con el RUT ausente

#### Scenario: Varios registros sin RUT

- **WHEN** existen dos o más dueños sin RUT
- **THEN** el sistema los acepta sin considerarlos duplicados

### Requirement: Normalización canónica del RUT

Al guardar, el sistema SHALL derivar una forma normalizada del RUT del dueño (alfanumérica en mayúscula, sin puntos, guiones ni espacios) que se usa para todas las comparaciones de igualdad, independiente del formato ingresado.

#### Scenario: Mismo documento en distinto formato

- **WHEN** se ingresa `12.345.678-5` en un dueño y `12345678-5` en otro
- **THEN** ambos se consideran el mismo documento

#### Scenario: Dígito verificador K

- **WHEN** se ingresa un RUT terminado en `k` minúscula
- **THEN** su forma normalizada usa `K` mayúscula

### Requirement: Unicidad del RUT de dueño

Cuando el RUT está presente, MUST ser único entre los dueños. Los valores ausentes no participan de la unicidad.

#### Scenario: RUT de dueño duplicado

- **WHEN** se intenta guardar un dueño con un RUT que ya tiene otro dueño (en cualquier formato equivalente)
- **THEN** la operación se rechaza y el registro no se crea

#### Scenario: Mismo número en paciente y dueño

- **WHEN** el número de microchip de un paciente coincide con el RUT de un dueño
- **THEN** ambos se aceptan, porque la unicidad del RUT de dueño (esta capacidad) es independiente de la unicidad del número de microchip de paciente (capacidad `patient-microchip-identifier`)

### Requirement: Sin validación de dígito verificador

El sistema SHALL NOT rechazar un RUT de dueño por no cumplir el dígito verificador chileno, de modo que se acepten documentos extranjeros o pasaportes.

#### Scenario: Documento extranjero

- **WHEN** se ingresa un documento de dueño que no cumple el módulo 11 chileno
- **THEN** el sistema lo acepta como identificador válido

### Requirement: Feedback de duplicado en formularios

Cuando un usuario envía un RUT de dueño que ya existe, el formulario SHALL mostrar un mensaje claro de "ya registrado" en lugar de un error genérico, y no crear el registro.

#### Scenario: Alta con RUT duplicado

- **WHEN** un usuario del staff registra un dueño con un RUT ya usado por otro dueño
- **THEN** el formulario muestra que el RUT ya está registrado y no se crea el registro
