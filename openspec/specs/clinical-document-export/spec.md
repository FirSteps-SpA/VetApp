# clinical-document-export Specification

## Purpose
Define cómo el staff obtiene documentos clínicos desde la app: puertas de impresión contextuales junto a los objetos únicos (receta, ficha de vacunación) y un panel para los documentos compuestos, todo a partir de una única fuente de documento.

## Requirements

### Requirement: Impresión contextual de una receta

El staff SHALL poder imprimir una receta desde los lugares donde la receta se muestra (el tab de recetas de la ficha y la vista de una consulta), sin pasar por el panel de exportación.

#### Scenario: Imprimir desde el tab de recetas

- **WHEN** el staff está viendo la lista de recetas de un paciente y elige imprimir una receta
- **THEN** el sistema presenta esa receta como documento listo para imprimir

#### Scenario: Imprimir desde la vista de consulta

- **WHEN** el staff está viendo una consulta que tiene una receta y elige imprimirla
- **THEN** el sistema presenta esa receta como documento listo para imprimir

### Requirement: Impresión de la ficha de vacunación

El staff SHALL poder imprimir la ficha de vacunación de un paciente desde el tab de vacunas.

#### Scenario: Imprimir la ficha de vacunación

- **WHEN** el staff está en el tab de vacunas de un paciente y elige imprimir la ficha de vacunación
- **THEN** el sistema presenta la ficha de vacunación como documento listo para imprimir

### Requirement: Documento listo para imprimir a papel

Al imprimir, el sistema SHALL presentar el documento en un estado desde el cual enviarlo a una impresora (papel), no solo iniciar una descarga de archivo.

#### Scenario: Acción de impresión

- **WHEN** el staff invoca la impresión de un documento clínico
- **THEN** el documento queda disponible con la opción de impresión al alcance

### Requirement: Consistencia con el documento exportable

El documento impreso SHALL ser idéntico en contenido y formato al PDF que se obtendría al exportar el mismo elemento.

#### Scenario: Impresión y exportación coinciden

- **WHEN** el staff imprime una receta y, por separado, la exporta desde el panel
- **THEN** ambos producen el mismo documento

### Requirement: La impresión contextual no penaliza la carga de la ficha

Agregar puertas de impresión contextuales SHALL NOT aumentar la carga inicial de la ficha del paciente para quienes no imprimen; el costo de generar documentos se paga solo al imprimir.

#### Scenario: Abrir la ficha sin imprimir

- **WHEN** el staff abre la ficha de un paciente y no imprime nada
- **THEN** no se incurre en el costo de cargar el generador de documentos

### Requirement: El panel de exportación se conserva para documentos compuestos

El panel de exportación SHALL seguir disponible para los documentos que no se resuelven con una puerta de impresión contextual: el historial (completo o por rango de fechas), la carta de derivación con selección de consultas, y la exportación de una o varias recetas. Desde el panel el staff elige el tipo de documento y ajusta su contenido antes de generarlo.

#### Scenario: Documento compuesto

- **WHEN** el staff necesita un historial, una carta de derivación con consultas seleccionadas, o exportar recetas
- **THEN** lo genera desde el panel de exportación eligiendo el tipo y ajustando su contenido

### Requirement: Exportar una o varias recetas en un solo documento

El panel SHALL permitir seleccionar una o más recetas del paciente y obtener un único documento PDF que las contenga a todas. El documento producido para una sola receta SHALL ser equivalente al de la impresión contextual de esa receta.

#### Scenario: Varias recetas en un PDF

- **WHEN** el staff marca dos o más recetas y exporta
- **THEN** obtiene un único PDF que incluye todas las recetas marcadas

#### Scenario: Una receta coincide con la impresión contextual

- **WHEN** el staff exporta una sola receta desde el panel
- **THEN** el documento es el mismo que obtendría al imprimir esa receta desde su puerta contextual

### Requirement: Alcance del historial completo o por rango, aplicado de forma consistente

Al exportar el historial, el staff SHALL poder elegir explícitamente entre el historial completo o un rango de fechas. Cuando elige un rango, el recorte por fechas SHALL aplicarse por igual a todo el contenido incluido (consultas, recetas, exámenes y vacunas), sin que ninguna sección ignore el rango.

#### Scenario: Historial completo

- **WHEN** el staff elige "historial completo"
- **THEN** el documento incluye todo el contenido seleccionado sin recorte por fechas

#### Scenario: Historial por rango recorta todo

- **WHEN** el staff elige un rango de fechas
- **THEN** las consultas, recetas, exámenes y vacunas del documento se limitan a ese rango

### Requirement: La vista previa refleja la selección actual

Cuando existe una vista previa mostrada y la selección cambia, el sistema SHALL indicar que la vista previa quedó desactualizada, de modo que el staff nunca tome una vista previa vieja como el documento que va a generar.

#### Scenario: La selección cambia con una vista previa abierta

- **WHEN** el staff generó una vista previa y luego cambia una opción (fechas, inclusiones, recetas marcadas, etc.)
- **THEN** el sistema señala que la vista previa está desactualizada hasta que se vuelva a generar

### Requirement: No se generan documentos inválidos o vacíos

El panel SHALL impedir generar o descargar un documento cuando la selección no produce contenido válido (por ejemplo, ninguna receta marcada, una derivación sin destino o sin consultas, o un rango que no cubre nada), e SHALL indicar el motivo en lugar de producir un documento vacío.

#### Scenario: Selección inválida

- **WHEN** la selección del staff no produciría un documento válido
- **THEN** las acciones de generar y descargar están deshabilitadas y se muestra el motivo

### Requirement: Resumen del contenido antes de generar

Antes de generar, el panel SHALL mostrar un resumen de cuánto contenido entra en el documento según la selección actual (por ejemplo, cantidad de consultas, recetas, exámenes y vacunas), coherente con lo que finalmente contiene el documento.

#### Scenario: Ver qué incluye el documento

- **WHEN** el staff ajusta la selección del documento
- **THEN** ve un resumen del contenido que se incluiría, sin necesidad de generar el PDF

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
