# access-logging Specification

## Purpose
Define el registro de quién accede a los datos de pacientes y dueños (aperturas de fichas, exportaciones de documentos y de datos, anonimizaciones) y cómo se consulta, como medida de seguridad y para responder solicitudes de los titulares.

## Requirements

### Requirement: Registro de accesos a datos
El sistema SHALL registrar, con la cuenta, la clínica, la fecha y hora, el tipo de acción y el paciente o dueño involucrado:
- cada apertura de la ficha de un paciente por el staff;
- cada documento exportado o impreso por el staff (historial, recetas, ficha de vacunación, derivación, autorizaciones);
- cada documento descargado por un dueño en el portal;
- cada exportación de datos de un dueño;
- cada anonimización.

#### Scenario: Abrir una ficha
- **WHEN** un veterinario abre la ficha de un paciente
- **THEN** el registro tiene una entrada con su cuenta, el paciente, la acción "ver ficha" y la hora

#### Scenario: Exportar un historial
- **WHEN** el staff descarga el PDF del historial de un paciente
- **THEN** el registro tiene una entrada con el tipo de documento y el paciente

#### Scenario: Descarga en el portal
- **WHEN** un dueño descarga el historial de su mascota desde el portal
- **THEN** el registro de la clínica de la mascota tiene esa descarga a nombre del dueño

### Requirement: Registro inmutable y por clínica
Las entradas del registro SHALL pertenecer a la clínica del dato accedido. Nadie SHALL poder modificarlas ni borrarlas desde la aplicación o la API, y cada cuenta SHALL poder agregar entradas solo a su propio nombre.

#### Scenario: Intento de borrar
- **WHEN** cualquier cuenta intenta borrar o modificar una entrada del registro por la API
- **THEN** la operación se rechaza

#### Scenario: Entrada a nombre de otro
- **WHEN** una cuenta intenta registrar un acceso a nombre de otra cuenta
- **THEN** la entrada queda a nombre de la cuenta que la registró

### Requirement: Consulta del registro por la cuenta de plataforma
La cuenta de plataforma SHALL poder consultar el registro de la clínica activa en Admin, filtrando por paciente, dueño, cuenta y rango de fechas. El staff no administrador y los dueños SHALL NOT poder leer el registro.

#### Scenario: Responder una solicitud de un dueño
- **WHEN** la cuenta de plataforma filtra el registro por un dueño
- **THEN** ve quién accedió a sus datos y a las fichas de sus mascotas, y cuándo

#### Scenario: Veterinario
- **WHEN** un veterinario intenta leer el registro de accesos
- **THEN** no obtiene datos
