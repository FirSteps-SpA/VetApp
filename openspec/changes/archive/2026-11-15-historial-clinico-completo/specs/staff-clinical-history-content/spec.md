# Spec Delta

## Purpose

Define qué datos de cada consulta y de cada control incluye el historial clínico que exporta el staff, en qué orden se presentan, qué secciones se pueden omitir y su independencia del historial que ve el dueño en el portal.

## ADDED Requirements

### Requirement: El historial del staff incluye todos los campos clínicos de la consulta
El historial clínico que exporta el staff SHALL incluir, para cada consulta, todos los campos clínicos registrados en este orden: motivo, anamnesis, examen físico, peso, temperatura, diagnóstico diferencial, diagnóstico, tratamiento y notas. Los campos sin valor SHALL omitirse sin dejar rótulos vacíos.

#### Scenario: Consulta con todos los campos
- **WHEN** el staff exporta el historial de un paciente cuya consulta tiene todos los campos registrados, con las opciones por defecto
- **THEN** el PDF muestra para esa consulta motivo, anamnesis, examen físico, peso, temperatura, diagnóstico diferencial, diagnóstico y tratamiento, en ese orden

#### Scenario: Consulta con campos vacíos
- **WHEN** una consulta no tiene anamnesis, diagnóstico diferencial ni temperatura
- **THEN** el PDF no muestra esos rótulos para esa consulta y sí el resto de sus campos

### Requirement: Secciones opcionales del historial
El panel de exportación del historial SHALL ofrecer las opciones "Incluir anamnesis y examen físico" e "Incluir signos vitales" (peso y temperatura), ambas activas por defecto, además de las opciones existentes. Al desactivar una opción, sus campos SHALL omitirse en todas las consultas y controles del documento. El diagnóstico diferencial SHALL incluirse siempre que tenga valor. Las notas internas SHALL seguir dependiendo de su opción, desactivada por defecto.

#### Scenario: Sin anamnesis ni examen físico
- **WHEN** el staff desactiva "Incluir anamnesis y examen físico" y genera el historial
- **THEN** ninguna consulta ni control del PDF muestra anamnesis ni examen físico, y el resto de los campos sí aparece

#### Scenario: Sin signos vitales
- **WHEN** el staff desactiva "Incluir signos vitales" y genera el historial
- **THEN** ninguna consulta ni control del PDF muestra peso ni temperatura

#### Scenario: Cambiar una opción con la vista previa abierta
- **WHEN** el staff cambia una de las opciones nuevas después de generar una vista previa
- **THEN** el panel indica que la vista previa quedó desactualizada

### Requirement: Contenido de los controles en el historial
Cada control enlazado SHALL mostrar en el historial del staff su evolución, su tratamiento y, según las opciones, su anamnesis, examen físico, peso y temperatura cuando tengan valor. Si la consulta de origen está en el mismo documento, el motivo, el diagnóstico y el diagnóstico diferencial del control SHALL mostrarse solo cuando difieran de los de esa consulta. Si la consulta de origen no está en el documento, el control SHALL mostrar esos campos.

#### Scenario: Control que no cambia el diagnóstico
- **WHEN** el historial incluye una consulta y su control con el mismo motivo y diagnóstico, y el control registró peso y temperatura
- **THEN** el control muestra evolución, peso, temperatura y tratamiento, sin repetir motivo ni diagnóstico

#### Scenario: Control que ajusta el diagnóstico
- **WHEN** el control tiene un diagnóstico distinto del de su consulta de origen
- **THEN** el control muestra su diagnóstico, después del diagnóstico diferencial si este también difiere

#### Scenario: Control sin su origen en el rango
- **WHEN** el rango exportado incluye un control pero no su consulta de origen
- **THEN** el control muestra su motivo, diagnóstico diferencial si tiene, diagnóstico, evolución y tratamiento, además de la fecha de la consulta de origen

### Requirement: El historial del portal no cambia
El historial que el dueño descarga desde el portal SHALL seguir mostrando solo los datos que hoy expone el portal. Este cambio SHALL NOT agregar anamnesis, examen físico, diagnóstico diferencial, signos vitales de cada consulta, evolución ni notas a ese historial.

#### Scenario: Dueño descarga el historial
- **WHEN** el dueño descarga desde el portal el historial de su mascota, que tiene consultas con anamnesis y examen físico
- **THEN** el PDF contiene los mismos campos que antes de este cambio, sin anamnesis ni examen físico
