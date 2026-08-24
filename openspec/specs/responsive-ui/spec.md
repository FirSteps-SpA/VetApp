# responsive-ui Specification

## Purpose
Define el comportamiento responsivo/móvil de la app: que la navegación primaria sea accesible en pantallas angostas y que la interfaz respete el área segura del dispositivo cuando corre instalada (standalone).

## Requirements

### Requirement: Respeto del área segura en standalone

Cuando la app corre instalada en modo standalone, la interfaz SHALL mantener el contenido interactivo fuera de las zonas reservadas del dispositivo (notch superior, indicador de inicio inferior, muescas laterales).

#### Scenario: Header bajo el notch

- **WHEN** la app corre en un dispositivo con notch en modo standalone
- **THEN** el encabezado fijo se muestra completo, sin quedar tapado por el notch

#### Scenario: Contenido sobre el indicador inferior

- **WHEN** el usuario hace scroll hasta el final del contenido en un dispositivo con indicador de inicio
- **THEN** el último contenido queda accesible, sin quedar tapado por el indicador

### Requirement: Navegación primaria accesible en móvil

En pantallas angostas, la navegación primaria del staff SHALL presentarse como una barra inferior alcanzable con el pulgar que muestra los destinos principales, con los destinos secundarios accesibles mediante un menú de desbordamiento ("Más"). Ningún destino queda inaccesible y la barra no tapa permanentemente el contenido.

#### Scenario: Barra inferior en móvil

- **WHEN** el staff abre la app en un teléfono
- **THEN** ve una barra de navegación inferior con los destinos principales y el destino activo resaltado

#### Scenario: Destino secundario vía "Más"

- **WHEN** el staff necesita un destino secundario (p. ej. Vacunas, o Administración si es dev)
- **THEN** lo alcanza desde el menú "Más" de la barra inferior

#### Scenario: El contenido no queda tapado

- **WHEN** el staff hace scroll hasta el final de una página en móvil
- **THEN** el último contenido queda accesible por encima de la barra inferior, no tapado por ella

#### Scenario: Muchos ítems en pantalla angosta

- **WHEN** hay más destinos de los que caben como ítems primarios en el ancho del teléfono
- **THEN** los destinos que no entran siguen alcanzables desde el menú "Más", sin recortarse ni forzar scroll horizontal de la página

### Requirement: Paridad de navegación entre móvil y escritorio

La navegación en móvil SHALL exponer los mismos destinos e indicadores que en escritorio.

#### Scenario: Enlace de administración en móvil

- **WHEN** un usuario con rol dev abre la app en móvil
- **THEN** ve el enlace de administración en la navegación, igual que en escritorio

#### Scenario: Indicador de reservas en móvil

- **WHEN** hay solicitudes de hora pendientes y el staff usa la app en móvil
- **THEN** el indicador (badge) de reservas pendientes aparece en la navegación

### Requirement: Navegación del portal en móvil

El portal del cliente SHALL ofrecer una barra de navegación inferior en móvil con sus secciones principales.

#### Scenario: Barra del portal en móvil

- **WHEN** el cliente abre el portal en un teléfono
- **THEN** ve una barra inferior con Inicio, sus mascotas, sus citas y sus notificaciones, con la sección activa resaltada

#### Scenario: Badge de notificaciones en el portal

- **WHEN** el cliente tiene notificaciones sin leer
- **THEN** la barra inferior del portal muestra el indicador (badge) de no leídas

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
