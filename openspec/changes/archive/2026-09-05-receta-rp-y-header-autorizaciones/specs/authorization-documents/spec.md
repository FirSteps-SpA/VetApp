## MODIFIED Requirements

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
