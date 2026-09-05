## MODIFIED Requirements

### Requirement: Autollenado de datos conocidos con edición manual

Al preparar un documento, el sistema SHALL precargar todos los campos que puede
derivar de los registros existentes: dueño, mascota, clínica y el integrante del
staff que está emitiendo. Esto SHALL incluir, además de los datos básicos, el
color de la mascota, la comuna y el sector del domicilio del dueño, el modo de
obtención y la razón de tenencia de la mascota, y el RUT y título profesional del
veterinario a cargo. El sistema SHALL permitir editar cualquier campo precargado
antes de generar. El ingreso manual SHALL quedar reservado para los datos propios
de cada caso que el sistema no puede conocer de antemano (antecedentes del caso,
los campos por tipo de autorización, el tipo de procedimiento del microchip y la
fecha del procedimiento).

#### Scenario: Campos precargados

- **WHEN** el staff prepara un documento para un paciente
- **THEN** el nombre, RUT, teléfono, dirección, comuna y sector del dueño; el
  nombre, especie, sexo, fecha de nacimiento, raza, color, modo de obtención y
  razón de tenencia de la mascota; y el RUT y título del veterinario a cargo,
  aparecen precargados cuando existen en el sistema

#### Scenario: Completar lo faltante

- **WHEN** un campo que ahora el sistema puede conocer (color, comuna, sector,
  datos del veterinario) todavía no está guardado en el registro correspondiente
- **THEN** el campo aparece vacío y el staff puede ingresarlo manualmente para
  esta emisión

#### Scenario: Editar un campo precargado

- **WHEN** un dato precargado no aplica a esta emisión (por ejemplo la comuna del
  dueño cambió y aún no se actualizó su ficha)
- **THEN** el staff puede corregirlo en el formulario antes de generar, sin que
  eso altere el registro de origen

#### Scenario: Completar los datos propios del caso

- **WHEN** el documento pide un dato propio del caso (antecedentes, diagnóstico
  presuntivo, motivo de hospitalización, tipo de procedimiento del microchip)
- **THEN** el staff lo ingresa manualmente en esa emisión

## ADDED Requirements

### Requirement: El veterinario a cargo por defecto es el emisor

Al preparar una autorización o el certificado de microchip, el sistema SHALL
tomar como veterinario a cargo, por defecto, al integrante del staff autenticado
que está emitiendo el documento, usando su nombre e identidad profesional. El
sistema SHALL permitir seleccionar a otro veterinario cuando la emisión se hace
en su nombre.

#### Scenario: Emisión por el propio veterinario

- **WHEN** un veterinario prepara un documento que requiere los datos del
  veterinario a cargo
- **THEN** el documento se precarga con su nombre, RUT y título profesional

#### Scenario: Emisión en nombre de otro veterinario

- **WHEN** quien emite el documento no es el veterinario a cargo del caso
- **THEN** puede elegir al veterinario correspondiente y el documento se precarga
  con los datos de esa persona
