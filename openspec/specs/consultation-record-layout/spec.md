# consultation-record-layout Specification

## Purpose
Define el orden en que el staff ve y completa los campos clínicos de una consulta, para que la captura, la edición, la lectura y los documentos sigan el mismo razonamiento clínico.

## Requirements

### Requirement: Diagnóstico diferencial antes que diagnóstico al registrar o editar una consulta
Los formularios de nueva consulta y de edición de consulta SHALL presentar el campo "Diagnóstico diferencial" inmediatamente antes del campo "Diagnóstico". La obligatoriedad no cambia: "Diagnóstico" sigue siendo obligatorio y "Diagnóstico diferencial" opcional.

#### Scenario: Nueva consulta
- **WHEN** un usuario del staff abre el formulario de nueva consulta
- **THEN** el campo "Diagnóstico diferencial" aparece antes que "Diagnóstico *", y ambos antes que "Tratamiento *"

#### Scenario: Edición de consulta
- **WHEN** un usuario del staff abre la edición de una consulta existente
- **THEN** el campo "Diagnóstico diferencial" aparece antes que "Diagnóstico *", con los valores guardados precargados

#### Scenario: Diagnóstico diferencial vacío
- **WHEN** el usuario guarda una consulta con diagnóstico y tratamiento pero sin diagnóstico diferencial
- **THEN** la consulta se guarda igual que antes del cambio

### Requirement: Diagnóstico diferencial antes que diagnóstico al leer una consulta
Toda vista del staff que muestre el diagnóstico y el diagnóstico diferencial de una consulta SHALL mostrar el diagnóstico diferencial inmediatamente antes que el diagnóstico. Esto incluye el detalle de la consulta y la fila expandida de la pestaña de consultas de la ficha. Si el diagnóstico diferencial está vacío, se omite como hasta ahora.

#### Scenario: Detalle de la consulta
- **WHEN** un usuario del staff abre el detalle de una consulta que tiene diagnóstico diferencial
- **THEN** "Diagnóstico diferencial" se muestra antes que "Diagnóstico"

#### Scenario: Pestaña de consultas de la ficha
- **WHEN** un usuario del staff expande una consulta en la pestaña de consultas de la ficha
- **THEN** "Diagnóstico diferencial" se muestra antes que "Diagnóstico"

#### Scenario: Sin diagnóstico diferencial
- **WHEN** la consulta no tiene diagnóstico diferencial
- **THEN** la vista muestra solo "Diagnóstico", en la misma posición relativa respecto de los demás campos

### Requirement: Mismo orden en los documentos del staff
Todo documento exportable o imprimible del staff que incluya el diagnóstico diferencial y el diagnóstico de una consulta SHALL presentarlos en el mismo orden que el detalle de la consulta: diagnóstico diferencial primero.

#### Scenario: Documento con ambos campos
- **WHEN** un documento del staff incluye el diagnóstico diferencial y el diagnóstico de una consulta
- **THEN** el diagnóstico diferencial aparece antes que el diagnóstico, igual que en el detalle de la consulta
