# consultation-follow-up Specification

## Purpose
Permite registrar en pocos pasos el control o la evolución de un paciente después de una consulta, dejarlo enlazado a esa consulta y presentarlo agrupado con ella en la ficha y en los documentos del staff.

## Requirements

### Requirement: Registrar un control desde una consulta
El staff SHALL poder iniciar el registro de un control desde el detalle de una consulta y desde la fila expandida del historial de la ficha. El formulario SHALL precargar motivo, diagnóstico y tratamiento de la consulta de origen, editables, y pedir la evolución como único campo obligatorio nuevo.

#### Scenario: Control rápido
- **WHEN** un veterinario abre "Registrar control" en una consulta, escribe la evolución y guarda sin cambiar nada más
- **THEN** se crea una consulta de tipo control con la evolución escrita, el motivo, diagnóstico y tratamiento de la consulta de origen, y el enlace a esa consulta

#### Scenario: Ajuste de tratamiento
- **WHEN** el veterinario modifica el tratamiento precargado y agrega peso y temperatura antes de guardar
- **THEN** el control queda con el tratamiento ajustado, el peso y la temperatura, y la consulta de origen no cambia

#### Scenario: Evolución vacía
- **WHEN** el veterinario intenta guardar el control sin evolución
- **THEN** el formulario indica que la evolución es obligatoria y no se guarda nada

### Requirement: Veterinario responsable del control
El formulario de control SHALL incluir el selector de veterinario responsable con las mismas reglas que la nueva consulta (capacidad `responsible-veterinarian`).

#### Scenario: Control registrado por otro veterinario
- **WHEN** un veterinario registra el control eligiendo a un colega como responsable
- **THEN** el control queda a nombre del colega

### Requirement: Receta opcional en el control
El formulario de control SHALL permitir agregar una receta, igual que la nueva consulta. La receta SHALL quedar vinculada al control y con su mismo veterinario responsable.

#### Scenario: Control con receta
- **WHEN** el veterinario agrega un medicamento en el control y guarda
- **THEN** se crea una receta vinculada al control, visible en la pestaña de recetas e imprimible

### Requirement: Agendar el próximo control
El formulario de control SHALL ofrecer una fecha y hora opcionales para el próximo control. Si se indican, al guardar se SHALL crear una cita pendiente para el paciente, con motivo "Control" y el veterinario responsable del control.

#### Scenario: Próximo control agendado
- **WHEN** el veterinario indica una fecha y hora de próximo control y guarda
- **THEN** la agenda y la pestaña de citas muestran una cita pendiente de control para el paciente en esa fecha y hora, en la hora de la clínica

#### Scenario: Sin próximo control
- **WHEN** el veterinario deja vacío el próximo control
- **THEN** no se crea ninguna cita

### Requirement: Los controles se enlazan a una consulta de origen única
Un control SHALL enlazarse a una consulta del mismo paciente que no sea a su vez un control enlazado. Registrar un control desde otro control SHALL enlazarlo a la misma consulta de origen. Solo las consultas de tipo control SHALL tener consulta de origen. El sistema SHALL rechazar enlaces que no cumplan estas reglas, aunque la escritura no pase por el formulario.

#### Scenario: Control de un control
- **WHEN** el staff registra un control desde el detalle de otro control
- **THEN** el nuevo control queda enlazado a la consulta de origen del primero

#### Scenario: Enlace a otro paciente
- **WHEN** se intenta guardar un control enlazado a una consulta de otro paciente
- **THEN** la escritura se rechaza

### Requirement: La ficha agrupa los controles bajo su consulta
El historial de la ficha SHALL listar las consultas sin mostrar por separado sus controles enlazados. Cada consulta con controles SHALL indicar cuántos tiene y, al expandirla, mostrarlos en orden cronológico con su fecha, evolución y tratamiento. Las consultas de tipo control sin origen SHALL seguir apareciendo como consultas.

#### Scenario: Consulta con dos controles
- **WHEN** el staff abre el historial de un paciente cuya consulta tiene dos controles
- **THEN** ve la consulta una sola vez con la indicación "2 controles" y, al expandirla, ambos controles del más antiguo al más reciente

#### Scenario: Control antiguo sin origen
- **WHEN** el paciente tiene una consulta de tipo control registrada antes de este cambio
- **THEN** aparece en el historial como una consulta más

### Requirement: Navegación entre consulta y controles
El detalle de una consulta SHALL listar sus controles con enlace a cada uno. El detalle de un control SHALL mostrar su evolución y un enlace a la consulta de origen.

#### Scenario: Ir del control a su consulta
- **WHEN** el staff abre el detalle de un control
- **THEN** ve la evolución y un enlace "Control de la consulta del dd-mm-aaaa" que lleva a la consulta de origen

### Requirement: El historial PDF muestra los controles con su consulta
El PDF del historial del staff SHALL mostrar cada control dentro del bloque de su consulta de origen, con fecha, veterinario, evolución y tratamiento. Si el rango de fechas incluye un control pero no su consulta de origen, el control SHALL aparecer igual, indicando la fecha de la consulta de origen. El conteo de consultas SHALL incluir solo consultas, no sus controles.

#### Scenario: Historial completo
- **WHEN** el staff exporta el historial completo de un paciente con una consulta y su control
- **THEN** el PDF muestra el control dentro del bloque de la consulta, rotulado como control con su fecha

#### Scenario: Rango que solo incluye el control
- **WHEN** el staff exporta un rango de fechas que contiene el control pero no la consulta de origen
- **THEN** el PDF muestra el control con la indicación "Control de la consulta del dd-mm-aaaa"

### Requirement: Editar la evolución de un control
La edición de una consulta de tipo control SHALL permitir modificar su evolución. La consulta de origen de un control SHALL NOT poder cambiarse desde la edición.

#### Scenario: Corregir la evolución
- **WHEN** el staff edita un control y cambia la evolución
- **THEN** el detalle, la ficha y el PDF muestran la evolución corregida y el control sigue enlazado a la misma consulta
