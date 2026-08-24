## ADDED Requirements

### Requirement: Controles de acción tocables en móvil

En móvil, los controles de acción interactivos SHALL ofrecer un área tocable de al menos ~44px, de modo que se puedan accionar con el pulgar sin requerir precisión.

#### Scenario: Tocar una acción en móvil

- **WHEN** el usuario toca una acción (editar, eliminar, confirmar, etc.) en un teléfono
- **THEN** el área tocable es suficiente para accionarla sin errar el toque

### Requirement: Desbordamiento de acciones densas

Cuando una fila o tarjeta ofrece muchas acciones (3 o más), la interfaz SHALL mantener visible la acción primaria y mover las secundarias a un menú de desbordamiento ("⋯"), de modo que la fila no quede apretada.

#### Scenario: Fila con muchas acciones

- **WHEN** una fila ofrece 3 o más acciones (p. ej. la gestión de dueños o una cita en la agenda)
- **THEN** se ve la acción primaria y las demás están en un menú "⋯" por fila

#### Scenario: El menú se cierra

- **WHEN** el usuario elige una acción del menú "⋯" o toca fuera de él
- **THEN** el menú se cierra
