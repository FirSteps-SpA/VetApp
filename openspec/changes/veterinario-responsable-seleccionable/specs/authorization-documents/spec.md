# Spec Delta

## MODIFIED Requirements

### Requirement: El veterinario a cargo por defecto es el emisor

Al preparar una autorización o el certificado de microchip, el sistema SHALL tomar como veterinario a cargo, por defecto, al integrante del staff autenticado que está emitiendo el documento, usando su nombre e identidad profesional, siempre que sea un veterinario elegible (capacidad `responsible-veterinarian`). El sistema SHALL permitir seleccionar a otro veterinario elegible cuando la emisión se hace en su nombre. El selector SHALL listar solo veterinarios elegibles: no incluye al usuario `dev` ni al emisor cuando no es veterinario.

#### Scenario: Emisión por el propio veterinario

- **WHEN** un veterinario prepara un documento que requiere los datos del veterinario a cargo
- **THEN** el documento se precarga con su nombre, RUT y título profesional

#### Scenario: Emisión en nombre de otro veterinario

- **WHEN** quien emite el documento no es el veterinario a cargo del caso
- **THEN** puede elegir al veterinario correspondiente y el documento se precarga con los datos de esa persona

#### Scenario: Emisor no elegible

- **WHEN** un usuario `dev` prepara un documento que requiere los datos del veterinario a cargo
- **THEN** el selector no tiene valor por defecto ni lo incluye a él, los campos del veterinario quedan vacíos hasta que elija a un veterinario, y siguen siendo editables a mano
