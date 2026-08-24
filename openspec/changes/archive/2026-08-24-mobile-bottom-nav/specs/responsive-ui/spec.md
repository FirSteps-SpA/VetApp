## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Navegación del portal en móvil

El portal del cliente SHALL ofrecer una barra de navegación inferior en móvil con sus secciones principales.

#### Scenario: Barra del portal en móvil

- **WHEN** el cliente abre el portal en un teléfono
- **THEN** ve una barra inferior con Inicio, sus mascotas, sus citas y sus notificaciones, con la sección activa resaltada

#### Scenario: Badge de notificaciones en el portal

- **WHEN** el cliente tiene notificaciones sin leer
- **THEN** la barra inferior del portal muestra el indicador (badge) de no leídas
