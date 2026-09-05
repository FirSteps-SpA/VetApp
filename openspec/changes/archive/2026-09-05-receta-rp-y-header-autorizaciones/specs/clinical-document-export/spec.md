## ADDED Requirements

### Requirement: Rótulo de prescripción y encabezado de términos en la receta

El documento de receta que emite el sistema SHALL rotular el bloque de medicamentos con el símbolo de prescripción "Rp", mostrado de forma literal (con esa combinación de mayúscula y minúscula, no "RP"). Antes del texto de instrucciones generales, el documento SHALL mostrar un encabezado de sección "Términos y Condiciones"; cuando la receta no tiene instrucciones generales, ese encabezado NO SHALL aparecer. Este comportamiento SHALL aplicarse por igual a la receta que emite el staff (impresión contextual y exportación) y a la receta que descarga el dueño desde el portal.

#### Scenario: El bloque de medicamentos se rotula "Rp"

- **WHEN** el staff imprime o exporta una receta, o el dueño la descarga desde el portal
- **THEN** la sección que lista los medicamentos aparece rotulada como "Rp" y no como "Indicaciones"

#### Scenario: Encabezado de términos antes de las instrucciones generales

- **WHEN** la receta incluye instrucciones generales
- **THEN** el texto de esas instrucciones va precedido por un encabezado "Términos y Condiciones"

#### Scenario: Sin instrucciones generales no hay encabezado de términos

- **WHEN** la receta no tiene instrucciones generales
- **THEN** el documento no muestra el encabezado "Términos y Condiciones"

#### Scenario: La receta del staff y la del portal coinciden en el rótulo

- **WHEN** se comparan la receta emitida por el staff y la receta descargada por el dueño para la misma receta
- **THEN** ambas usan el rótulo "Rp" y el mismo encabezado "Términos y Condiciones" antes de las instrucciones generales
