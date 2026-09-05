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

Al preparar un documento, el sistema SHALL precargar todos los campos que puede derivar de los registros existentes: dueño, mascota, clínica y el integrante del staff que está emitiendo. Esto SHALL incluir, además de los datos básicos, el color de la mascota, la comuna y el sector del domicilio del dueño, el modo de obtención y la razón de tenencia de la mascota, y el RUT y título profesional del veterinario a cargo. El sistema SHALL permitir editar cualquier campo precargado antes de generar. El ingreso manual SHALL quedar reservado para los datos propios de cada caso que el sistema no puede conocer de antemano (antecedentes del caso, los campos por tipo de autorización, el tipo de procedimiento del microchip y la fecha del procedimiento).

#### Scenario: Campos precargados

- **WHEN** el staff prepara un documento para un paciente
- **THEN** el nombre, RUT, teléfono, dirección, comuna y sector del dueño; el nombre, especie, sexo, fecha de nacimiento, raza, color, modo de obtención y razón de tenencia de la mascota; y el RUT y título del veterinario a cargo, aparecen precargados cuando existen en el sistema

#### Scenario: Completar lo faltante

- **WHEN** un campo que ahora el sistema puede conocer (color, comuna, sector, datos del veterinario) todavía no está guardado en el registro correspondiente
- **THEN** el campo aparece vacío y el staff puede ingresarlo manualmente para esta emisión

#### Scenario: Editar un campo precargado

- **WHEN** un dato precargado no aplica a esta emisión (por ejemplo la comuna del dueño cambió y aún no se actualizó su ficha)
- **THEN** el staff puede corregirlo en el formulario antes de generar, sin que eso altere el registro de origen

#### Scenario: Completar los datos propios del caso

- **WHEN** el documento pide un dato propio del caso (antecedentes, diagnóstico presuntivo, motivo de hospitalización, tipo de procedimiento del microchip)
- **THEN** el staff lo ingresa manualmente en esa emisión

### Requirement: El veterinario a cargo por defecto es el emisor

Al preparar una autorización o el certificado de microchip, el sistema SHALL tomar como veterinario a cargo, por defecto, al integrante del staff autenticado que está emitiendo el documento, usando su nombre e identidad profesional. El sistema SHALL permitir seleccionar a otro veterinario cuando la emisión se hace en su nombre.

#### Scenario: Emisión por el propio veterinario

- **WHEN** un veterinario prepara un documento que requiere los datos del veterinario a cargo
- **THEN** el documento se precarga con su nombre, RUT y título profesional

#### Scenario: Emisión en nombre de otro veterinario

- **WHEN** quien emite el documento no es el veterinario a cargo del caso
- **THEN** puede elegir al veterinario correspondiente y el documento se precarga con los datos de esa persona

### Requirement: Documento de autorización listo para imprimir y firmar

Cada autorización (eutanasia, cirugía, hospitalización) SHALL producir un documento con el texto de consentimiento correspondiente, los datos del dueño, la mascota y la clínica ya insertados, los campos del caso, y un bloque de firma del autorizante, en un estado listo para enviar a impresión en papel.

El documento SHALL abrir con el mismo encabezado de clínica que usan los demás documentos clínicos (receta, historial, carta de derivación): logo de la clínica cuando está configurado, nombre de la clínica, dirección y ciudad, teléfono y correo, y número de registro. Cuando un dato de la clínica no está configurado, ese dato se omite del encabezado sin romper el resto. El microchip queda fuera de este requisito porque se genera como overlay sobre el formulario oficial.

#### Scenario: Generar una autorización

- **WHEN** el staff completa los campos de una autorización y la genera
- **THEN** obtiene el documento con el consentimiento y los datos insertados, listo para imprimir y firmar

#### Scenario: Encabezado de clínica consistente con los demás documentos

- **WHEN** el staff genera una autorización de eutanasia, cirugía u hospitalización
- **THEN** el documento abre con el encabezado de la clínica (logo, nombre, dirección, teléfono/correo y número de registro) equivalente al de la receta y el historial

#### Scenario: Datos de clínica incompletos

- **WHEN** la clínica no tiene logo o le falta algún dato de contacto o registro
- **THEN** el encabezado de la autorización muestra solo los datos disponibles y se genera sin error

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
