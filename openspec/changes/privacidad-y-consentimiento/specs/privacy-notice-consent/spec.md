# Spec Delta

## Purpose

Define el aviso de privacidad de cada clínica (plantilla, edición y versiones) y la aceptación que todo dueño debe registrar antes de acceder a los datos de esa clínica en el portal.

## ADDED Requirements

### Requirement: Aviso de privacidad versionado por clínica
Cada clínica SHALL tener un aviso de privacidad propio. Al editarlo, el editor SHALL partir de una plantilla de VetApp completada con los datos de la clínica (nombre, contacto, dirección), que incluya finalidades, derechos del titular, cómo ejercerlos y la política de retención de los datos clínicos. Cada publicación SHALL crear una versión nueva, numerada e inmutable; las versiones anteriores SHALL conservarse.

#### Scenario: Primera publicación
- **WHEN** la cuenta de plataforma abre Admin › Privacidad de una clínica sin aviso y publica la plantilla editada
- **THEN** la clínica queda con la versión 1 de su aviso, con el texto publicado y su fecha

#### Scenario: Nueva versión
- **WHEN** se edita y publica el aviso de una clínica que ya tiene la versión 1
- **THEN** existe la versión 2 como vigente y la versión 1 se conserva sin cambios

### Requirement: Sin aviso publicado no se invita al portal
Una clínica SHALL NOT poder invitar dueños al portal mientras no tenga un aviso de privacidad publicado.

#### Scenario: Invitar sin aviso
- **WHEN** el staff de una clínica sin aviso publicado intenta invitar a un dueño
- **THEN** la invitación se rechaza indicando que primero hay que publicar el aviso de privacidad

### Requirement: Aceptación obligatoria antes de acceder
Un dueño SHALL aceptar la versión vigente del aviso de cada clínica donde tiene ficha antes de ver datos de esa clínica en el portal. La aceptación SHALL registrar la cuenta, la ficha de dueño, la clínica, la versión aceptada y la fecha y hora. Mientras falte la aceptación de una clínica, el portal SHALL mostrar su aviso para aceptar y SHALL NOT entregar datos de esa clínica, aunque se consulten directamente a la base.

#### Scenario: Primer ingreso
- **WHEN** un dueño invitado entra por primera vez al portal
- **THEN** ve el aviso de privacidad de la clínica y no ve sus mascotas hasta aceptarlo

#### Scenario: Aceptar
- **WHEN** el dueño acepta el aviso
- **THEN** queda registrada su aceptación de esa versión con fecha y hora, y ve sus mascotas de esa clínica

#### Scenario: Consulta directa sin aceptación
- **WHEN** un dueño que no aceptó el aviso consulta a la base las mascotas o consultas de esa clínica
- **THEN** no obtiene datos de esa clínica

#### Scenario: Dueño de dos clínicas
- **WHEN** un dueño con ficha en dos clínicas aceptó solo el aviso de la primera
- **THEN** ve los datos de la primera y el portal le pide aceptar el aviso de la segunda

### Requirement: Una versión nueva exige aceptar de nuevo
Al publicarse una versión nueva del aviso, los dueños de esa clínica SHALL volver a aceptar antes de seguir viendo sus datos. Las aceptaciones anteriores SHALL conservarse.

#### Scenario: Cambio de aviso
- **WHEN** la clínica publica la versión 2 y un dueño que había aceptado la versión 1 entra al portal
- **THEN** el portal le muestra la versión 2 para aceptar, y su aceptación de la versión 1 sigue registrada

### Requirement: El dueño puede consultar el aviso aceptado
El portal SHALL permitir al dueño leer en cualquier momento el aviso vigente de cada una de sus clínicas y la fecha en que lo aceptó.

#### Scenario: Leer el aviso
- **WHEN** el dueño abre la sección de privacidad del portal
- **THEN** ve el aviso vigente de cada clínica y la fecha de su aceptación
