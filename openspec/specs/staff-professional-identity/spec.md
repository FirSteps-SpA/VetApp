# staff-professional-identity Specification

## Purpose

Define cómo cada integrante del staff registra y mantiene su identidad
profesional (RUT y título profesional) dentro de su propio registro de usuario,
para que el sistema pueda reutilizarla al autollenar los datos del veterinario a
cargo en documentos legales y certificados, sin retipearla en cada emisión.

## Requirements

### Requirement: Identidad profesional en el registro de staff

Cada registro de staff SHALL poder almacenar un RUT profesional y un título
profesional. El título profesional SHALL elegirse de un conjunto definido de
valores (médico veterinario / técnico veterinario), no como texto libre. Ambos
campos son opcionales: el valor ausente MUST estar permitido y no debe bloquear
el alta ni la edición del usuario. En esta iteración el RUT del staff SHALL NOT
estar sujeto a validación de dígito verificador ni a restricción de unicidad.

#### Scenario: Staff sin identidad profesional

- **WHEN** existe un integrante del staff sin RUT ni título profesional cargados
- **THEN** su registro es válido y puede usar el sistema normalmente

#### Scenario: Registrar identidad profesional

- **WHEN** un integrante del staff guarda su RUT y su título profesional
- **THEN** ambos quedan almacenados en su registro de usuario

### Requirement: Cada integrante del staff mantiene su propia identidad profesional

Un integrante del staff SHALL poder ver y editar su propio RUT y título
profesional. El sistema SHALL NOT exigir un rol administrativo para que una
persona edite estos campos en su propio registro.

#### Scenario: Editar los datos propios

- **WHEN** un integrante del staff abre la edición de su perfil y cambia su
  título profesional
- **THEN** el cambio se guarda en su propio registro

### Requirement: La identidad profesional alimenta el autollenado de documentos

El RUT y el título profesional guardados en el registro de staff SHALL estar
disponibles para precargar los datos del veterinario a cargo en los flujos que
lo requieran (autorizaciones y certificado de microchip), sin que la persona
tenga que reingresarlos al emitir.

#### Scenario: Emisor con identidad profesional cargada

- **WHEN** un integrante del staff con RUT y título profesional guardados prepara
  un documento que pide los datos del veterinario
- **THEN** esos datos aparecen precargados a partir de su registro
