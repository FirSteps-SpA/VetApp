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

El panel de exportación SHALL seguir disponible para los documentos compuestos o curados (historial por rango de fechas, carta de derivación con selección de consultas).

#### Scenario: Documento compuesto

- **WHEN** el staff necesita un historial por rango de fechas o una derivación con consultas seleccionadas
- **THEN** lo genera desde el panel de exportación
