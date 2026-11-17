# Spec Delta

## Purpose

Define cómo un dueño ejerce sus derechos de acceso, portabilidad y supresión sobre sus datos personales en cada clínica: la exportación de sus datos y la eliminación por anonimización, que conserva los registros clínicos de las mascotas.

## ADDED Requirements

### Requirement: Exportación de los datos del dueño
El dueño SHALL poder descargar desde el portal, por cada clínica, sus datos en un PDF legible y en un archivo JSON estructurado. El paquete SHALL incluir su ficha de dueño, sus mascotas con los datos que el portal le muestra (consultas, vacunas, recetas vigentes, exámenes no internos y citas), sus preferencias de notificación y sus aceptaciones del aviso de privacidad. El paquete SHALL NOT incluir notas internas ni datos de otros dueños.

#### Scenario: Descarga desde el portal
- **WHEN** un dueño pide "Descargar mis datos" de una clínica
- **THEN** obtiene un PDF y un JSON con su ficha, sus mascotas, sus aceptaciones y sus preferencias de esa clínica

#### Scenario: Sin notas internas
- **WHEN** una consulta de su mascota tiene notas internas o un examen está marcado como interno
- **THEN** el paquete no incluye esas notas ni ese examen

### Requirement: Exportación por el staff a pedido
El staff clínico SHALL poder generar el mismo paquete de datos para cualquier dueño de su clínica, tenga o no acceso al portal, desde la ficha del dueño.

#### Scenario: Dueño sin portal
- **WHEN** un dueño sin portal pide sus datos en la clínica y el veterinario genera la exportación desde su ficha
- **THEN** obtiene el PDF y el JSON con el mismo contenido que tendría desde el portal

### Requirement: Eliminación de los datos personales por anonimización
El staff clínico SHALL poder anonimizar a un dueño a su pedido, previa confirmación explícita. La anonimización SHALL:
- borrar sus datos personales (nombre, RUT, teléfono, email, dirección, comuna, sector y notas) y sus preferencias de notificación;
- revocar su acceso al portal en esa clínica;
- eliminar su cuenta de acceso si no tiene ficha en otra clínica.

Las fichas de sus mascotas y sus registros clínicos SHALL conservarse, ahora sin dueño identificable. La acción SHALL ser irreversible.

#### Scenario: Anonimizar
- **WHEN** el veterinario confirma la eliminación de los datos de un dueño
- **THEN** la ficha del dueño muestra "Dueño eliminado" sin datos de contacto, sus mascotas conservan su historial clínico y el dueño ya no entra al portal de esa clínica

#### Scenario: Dueño con ficha en otra clínica
- **WHEN** se anonimiza en la clínica A a un dueño que también es cliente de la clínica B
- **THEN** su cuenta sigue activa y conserva el acceso a sus datos de la clínica B

#### Scenario: Sin confirmación
- **WHEN** el staff abre la eliminación y no confirma escribiendo lo que se le pide
- **THEN** no se modifica ningún dato

### Requirement: Solo staff clínico ejerce estas acciones
La exportación a pedido y la anonimización SHALL estar disponibles solo para el staff clínico (veterinarios y la cuenta de plataforma) de la clínica del dueño.

#### Scenario: Recepcionista
- **WHEN** una recepcionista abre la ficha de un dueño
- **THEN** no ve las acciones de exportar datos ni de eliminar datos personales
