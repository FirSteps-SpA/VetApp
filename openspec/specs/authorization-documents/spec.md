# authorization-documents Specification

## Purpose

Define cómo el staff emite, rellena e imprime documentos legales de consentimiento (eutanasia, cirugía, hospitalización) y el certificado oficial de microchip desde la ficha del paciente, con autollenado de los datos ya conocidos, relleno manual de lo faltante, y traza de cada emisión para auditoría.

## Requirements

### Requirement: Emitir documentos legales y certificados desde la ficha

El staff SHALL poder emitir, desde la ficha de un paciente, cualquiera de los documentos soportados: autorización de eutanasia, autorización de cirugía, autorización de hospitalización y certificado de microchip.

#### Scenario: Elegir el documento a emitir

- **WHEN** el staff abre el flujo de autorizaciones y certificados de un paciente
- **THEN** puede elegir entre autorización de eutanasia, de cirugía, de hospitalización y certificado de microchip

### Requirement: Autollenado de datos conocidos con edición manual

Al preparar un documento, el sistema SHALL precargar los campos que puede derivar de los datos existentes (dueño, mascota y clínica) y SHALL permitir editar cualquier campo y completar manualmente los que no existen en el sistema (por ejemplo sector, comuna, color, datos del veterinario a cargo y los antecedentes del caso).

#### Scenario: Campos precargados

- **WHEN** el staff prepara un documento para un paciente
- **THEN** el nombre, RUT, teléfono y dirección del dueño, y el nombre, especie, sexo, fecha de nacimiento y raza de la mascota, aparecen precargados

#### Scenario: Completar lo faltante

- **WHEN** un dato requerido por el documento no existe en el sistema (por ejemplo sector, comuna o color)
- **THEN** el staff puede ingresarlo manualmente antes de generar

### Requirement: Documento de autorización listo para imprimir y firmar

Cada autorización (eutanasia, cirugía, hospitalización) SHALL producir un documento con el texto de consentimiento correspondiente, los datos del dueño, la mascota y la clínica ya insertados, los campos del caso, y un bloque de firma del autorizante, en un estado listo para enviar a impresión en papel.

#### Scenario: Generar una autorización

- **WHEN** el staff completa los campos de una autorización y la genera
- **THEN** obtiene el documento con el consentimiento y los datos insertados, listo para imprimir y firmar

### Requirement: El certificado de microchip se imprime sobre el formulario oficial

El certificado de microchip SHALL generarse imprimiendo los datos sobre el formulario oficial provisto (no un documento equivalente), colocando cada dato en su lugar y marcando las opciones seleccionadas (especie, sexo, esterilizado, tipo de procedimiento, modo de obtención, razón de tenencia, tipo de profesional).

#### Scenario: Certificado sobre el formulario oficial

- **WHEN** el staff genera el certificado de microchip
- **THEN** el resultado es el formulario oficial con los datos escritos en sus posiciones y las opciones correspondientes marcadas

### Requirement: Traza de los documentos emitidos

Cada emisión de un documento SHALL quedar registrada con su tipo, el paciente y dueño, el usuario que la emitió, la fecha, y un snapshot de los campos utilizados, para poder auditar qué se emitió y cuándo. El registro SHALL ser accesible solo para el staff.

#### Scenario: Registrar una emisión

- **WHEN** el staff genera cualquiera de los documentos
- **THEN** queda registrada la emisión (tipo, paciente, dueño, emisor, fecha y datos usados)

#### Scenario: Consultar lo emitido

- **WHEN** el staff revisa los documentos emitidos de un paciente
- **THEN** ve el historial de emisiones con su tipo y fecha

### Requirement: La emisión no penaliza la carga de la ficha

El costo de generar documentos (motores de PDF) SHALL pagarse solo al usar el flujo de emisión, sin aumentar la carga inicial de la ficha del paciente para quien no lo usa.

#### Scenario: Abrir la ficha sin emitir

- **WHEN** el staff abre la ficha de un paciente y no emite ningún documento
- **THEN** no se incurre en el costo de cargar los generadores de documentos
