# Spec Delta

## Purpose

Define cómo VetApp atiende a varias clínicas en un mismo proyecto: a qué clínica pertenece cada dato, cómo se aísla cada clínica de las demás en la base y en los archivos, y cómo la clínica actual pasa al modelo sin cambios visibles.

## ADDED Requirements

### Requirement: Cada dato pertenece a una clínica
Todo registro de datos de una clínica (sucursales, staff, dueños, pacientes, consultas, recetas, exámenes, vacunas, esquemas de vacunación, citas, documentos emitidos, notificaciones y registros de auditoría) SHALL pertenecer a exactamente una clínica. El sistema SHALL rechazar un registro que referencie un registro de otra clínica, aunque la escritura no pase por la aplicación.

#### Scenario: Consulta con paciente de otra clínica
- **WHEN** se intenta guardar una consulta de la clínica A para un paciente de la clínica B
- **THEN** la base rechaza la escritura

#### Scenario: Registro nuevo sin clínica explícita
- **WHEN** un integrante del staff crea un paciente sin indicar la clínica
- **THEN** el paciente queda en la clínica de su sesión

### Requirement: Aislamiento del staff por clínica
Un integrante del staff SHALL ver, crear, modificar y buscar solo datos de su clínica, con las mismas reglas de rol que hoy dentro de ella. Ninguna consulta, búsqueda, listado, conteo ni documento exportado SHALL incluir datos de otra clínica.

#### Scenario: Búsqueda de pacientes
- **WHEN** un veterinario de la clínica A busca un nombre que existe en las clínicas A y B
- **THEN** solo obtiene los pacientes de la clínica A

#### Scenario: Acceso directo por identificador
- **WHEN** un veterinario de la clínica A pide por su identificador una consulta de la clínica B
- **THEN** no obtiene datos, igual que si la consulta no existiera

#### Scenario: Selector de veterinario responsable
- **WHEN** un veterinario de la clínica A abre el selector de veterinario responsable
- **THEN** solo aparecen los veterinarios activos de la clínica A

### Requirement: Archivos aislados por clínica
Los archivos privados (fotos de pacientes, exámenes, PDFs) y los de marca SHALL guardarse bajo la carpeta de su clínica. El staff SHALL poder leer y escribir archivos privados solo en la carpeta de su clínica. Los enlaces a archivos que reciben los dueños SHALL generarse solo para archivos de sus mascotas.

#### Scenario: Leer un examen de otra clínica
- **WHEN** un veterinario de la clínica A pide un archivo de examen de la clínica B, aun conociendo su ruta
- **THEN** el almacenamiento rechaza el acceso

#### Scenario: Subir una foto
- **WHEN** un veterinario de la clínica A sube la foto de un paciente
- **THEN** el archivo queda en la carpeta de la clínica A

### Requirement: Identificadores únicos por clínica
El número de ficha, el número de receta, el email de dueño y el RUT de dueño y de paciente SHALL ser únicos dentro de cada clínica, no entre clínicas. Los números de ficha (`PAC-`) y de receta (`REC-`) SHALL ser correlativos propios de cada clínica, sin saltos por la actividad de otras.

#### Scenario: Primera ficha de una clínica nueva
- **WHEN** una clínica nueva registra su primer paciente
- **THEN** recibe el número `PAC-00001`, aunque otras clínicas ya tengan fichas con ese número

#### Scenario: Mismo dueño en dos clínicas
- **WHEN** la clínica B registra un dueño con un RUT y un email que ya tiene un dueño de la clínica A
- **THEN** el registro se acepta y queda como una ficha de dueño separada de la de la clínica A

### Requirement: La clínica actual se migra sin cambios visibles
Al aplicar este cambio, todos los datos y archivos existentes SHALL pasar a la clínica actual, con su nombre, logo, datos legales y slug. Los números de ficha y receta existentes SHALL conservarse, y los nuevos SHALL continuar la numeración actual. El staff y los dueños de la clínica actual SHALL seguir operando sin cambios visibles en sus pantallas ni en sus documentos.

#### Scenario: Numeración continúa
- **WHEN** después de la migración se crea una receta en la clínica actual, cuya última receta era `REC-00025`
- **THEN** la nueva receta recibe `REC-00026`

#### Scenario: Archivos existentes
- **WHEN** después de la migración el staff abre un examen subido antes del cambio
- **THEN** el archivo se descarga igual que antes

### Requirement: Procesos automáticos por clínica
Los procesos que corren sin sesión de usuario (recálculo de alertas de vacunas, recordatorios y notificaciones) SHALL procesar cada clínica por separado y usar la marca de la clínica a la que pertenece cada registro.

#### Scenario: Recordatorio de vacuna
- **WHEN** el proceso diario envía un recordatorio de una vacuna de un paciente de la clínica B
- **THEN** el recordatorio lleva el nombre y la marca de la clínica B
