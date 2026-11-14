# Spec Delta

## Purpose

Define quién figura como veterinario responsable de cada registro clínico (consulta, receta, vacuna), quiénes pueden ser elegidos y cómo se garantiza que el responsable registrado sea siempre un veterinario de la clínica.

## ADDED Requirements

### Requirement: Veterinarios elegibles
Solo los usuarios con rol `veterinario` y activos SHALL ser elegibles como veterinario responsable. Ningún selector de veterinario SHALL listar usuarios con otro rol (incluido `dev`) ni usuarios desactivados.

#### Scenario: Lista del selector
- **WHEN** un usuario del staff abre cualquier selector de veterinario responsable
- **THEN** ve solo a los veterinarios activos, ordenados por nombre, y no ve al usuario `dev`, a recepcionistas ni a veterinarios desactivados

### Requirement: Elegir el veterinario responsable al registrar una consulta
El formulario de nueva consulta SHALL incluir un selector de veterinario responsable, obligatorio. Por defecto SHALL quedar el usuario actual si es un veterinario elegible. Si no lo es, el selector SHALL quedar sin valor y la consulta no se puede guardar hasta elegir uno.

#### Scenario: Veterinario registra su propia consulta
- **WHEN** un veterinario activo abre el formulario de nueva consulta
- **THEN** el selector muestra su nombre como valor por defecto y, si no lo cambia, la consulta queda a su nombre

#### Scenario: Registrar la consulta de un colega
- **WHEN** un veterinario elige a otro veterinario activo y guarda la consulta
- **THEN** la consulta queda con el veterinario elegido como responsable

#### Scenario: Usuario no elegible registra una consulta
- **WHEN** un usuario `dev` abre el formulario de nueva consulta
- **THEN** el selector no tiene valor por defecto y el formulario exige elegir un veterinario antes de guardar

### Requirement: La receta hereda el veterinario de su consulta
Una receta creada junto con una consulta SHALL quedar con el mismo veterinario responsable que la consulta. El formulario SHALL NOT ofrecer un selector separado para la receta.

#### Scenario: Consulta con receta
- **WHEN** se guarda una consulta con receta eligiendo a un veterinario distinto del usuario actual
- **THEN** la consulta y la receta quedan con ese veterinario, y el PDF de la receta lo muestra en la firma

### Requirement: Cambiar el veterinario responsable de una consulta
La edición de una consulta SHALL permitir cambiar el veterinario responsable a otro veterinario elegible. El cambio SHALL aplicarse también a todas las recetas de esa consulta. Si el veterinario actual ya no es elegible, se SHALL mostrar y conservar mientras no se cambie.

#### Scenario: Corregir el veterinario
- **WHEN** un usuario edita una consulta con receta y cambia el veterinario responsable
- **THEN** la consulta y sus recetas quedan con el nuevo veterinario, y el detalle, el historial y el PDF de la receta muestran el nuevo nombre

#### Scenario: Consulta histórica con veterinario no elegible
- **WHEN** se edita una consulta cuyo veterinario es un usuario `dev` o un veterinario desactivado, sin cambiar el veterinario
- **THEN** el selector muestra el veterinario actual, y la consulta se guarda con él

### Requirement: Elegir el veterinario responsable al registrar una vacuna
El formulario de registro de vacuna SHALL incluir el selector de veterinario responsable, con la misma regla de valor por defecto que la consulta. La pestaña de vacunas de la ficha SHALL mostrar el veterinario responsable de cada vacuna.

#### Scenario: Registrar una vacuna aplicada por otro veterinario
- **WHEN** un veterinario registra una vacuna eligiendo a un colega
- **THEN** la vacuna queda con el colega como responsable y la pestaña de vacunas muestra su nombre

### Requirement: El sistema rechaza un veterinario responsable no elegible
Al crear una consulta, receta o vacuna, o al cambiar su veterinario responsable, el sistema SHALL rechazar el registro si el veterinario no es elegible, aunque la escritura no pase por los formularios (p. ej. vía la API de datos). Los registros existentes cuyo veterinario no cambia SHALL seguir pudiendo editarse.

#### Scenario: Escritura directa con un usuario no veterinario
- **WHEN** un usuario autenticado intenta insertar una consulta, receta o vacuna con un `veterinario_id` de un usuario `dev`, de una recepcionista o de un veterinario desactivado
- **THEN** la escritura se rechaza y no se crea el registro

#### Scenario: Error visible en el formulario
- **WHEN** el veterinario elegido es desactivado mientras otro usuario tiene el formulario abierto, y ese usuario guarda
- **THEN** el formulario muestra un error indicando que el veterinario no es válido, y no se guarda nada

#### Scenario: Edición sin cambiar el veterinario
- **WHEN** se edita otro campo de una consulta cuyo veterinario ya no es elegible
- **THEN** la edición se guarda

### Requirement: El autor del registro queda auditado
El registro de auditoría SHALL seguir identificando como autor de cada creación o cambio al usuario autenticado que lo hizo, independientemente del veterinario responsable elegido.

#### Scenario: Consulta registrada a nombre de otro
- **WHEN** el veterinario A registra una consulta con el veterinario B como responsable
- **THEN** la consulta queda con B como responsable y la auditoría registra a A como autor de la creación
