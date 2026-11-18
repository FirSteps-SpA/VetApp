## MODIFIED Requirements

### Requirement: Invitaciones con la entrada de la clínica
Los enlaces de invitación y de acceso que reciben el staff y los dueños SHALL llevar a la entrada con la marca de la clínica que invita. Al invitar a un dueño al portal, el sistema SHALL enviarle el enlace por correo con la marca de la clínica y SHALL mostrar al staff el mismo enlace para copiarlo, indicando si el correo se envió.

#### Scenario: Dueño invitado
- **WHEN** la clínica Pradera invita a un dueño al portal
- **THEN** el enlace lleva a una pantalla con la marca de Pradera

#### Scenario: Invitación por correo
- **WHEN** el staff invita a un dueño con email y el envío de correo está configurado
- **THEN** el dueño recibe el correo de invitación de la clínica y el staff ve el enlace con la indicación de que el correo fue enviado

#### Scenario: Correo no enviado
- **WHEN** el correo de invitación no se puede enviar
- **THEN** el staff ve el enlace con la indicación de que el correo no salió, para compartirlo por otro medio
