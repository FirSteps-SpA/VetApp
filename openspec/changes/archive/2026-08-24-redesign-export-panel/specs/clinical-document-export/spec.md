## MODIFIED Requirements

### Requirement: El panel de exportación se conserva para documentos compuestos

El panel de exportación SHALL seguir disponible para los documentos que no se resuelven con una puerta de impresión contextual: el historial (completo o por rango de fechas), la carta de derivación con selección de consultas, y la exportación de una o varias recetas. Desde el panel el staff elige el tipo de documento y ajusta su contenido antes de generarlo.

#### Scenario: Documento compuesto

- **WHEN** el staff necesita un historial, una carta de derivación con consultas seleccionadas, o exportar recetas
- **THEN** lo genera desde el panel de exportación eligiendo el tipo y ajustando su contenido

## ADDED Requirements

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
