# responsive-ui Specification

## Purpose
Define el comportamiento responsivo de la app en tres tramos (teléfono, tablet y escritorio): que la navegación primaria sea accesible y con paridad de destinos en todos ellos —barra inferior en teléfono, riel lateral colapsable en tablet y escritorio—, que el contenido adapte su ancho al tramo, que los controles conserven un área táctil suficiente, y que la interfaz respete el área segura del dispositivo cuando corre instalada (standalone).

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

### Requirement: Navegación primaria en tablet y escritorio mediante riel lateral

En tramo tablet y escritorio, la navegación primaria de la app del staff SHALL presentarse como un riel lateral fijo al costado del contenido, con los mismos destinos que la barra inferior del teléfono (primarios y secundarios). El riel SHALL mostrar cada destino con su icono y su etiqueta cuando está expandido, resaltar el destino activo, y no tapar permanentemente el contenido (el contenido ocupa el ancho restante). La barra superior de enlaces de navegación SHALL dejar de usarse como navegación primaria.

#### Scenario: Riel lateral en tablet

- **WHEN** el staff abre la app en una tablet (tramo tablet o escritorio)
- **THEN** ve un riel de navegación lateral con los destinos principales y el destino activo resaltado, y el contenido a su lado sin quedar tapado

#### Scenario: Destinos secundarios en el riel

- **WHEN** el staff necesita un destino secundario (p. ej. Vacunas, Mi perfil, o Administración si es dev) en tablet o escritorio
- **THEN** lo alcanza desde el propio riel lateral, sin depender de la barra superior

#### Scenario: Barra inferior solo en teléfono

- **WHEN** el ancho de viewport corresponde al tramo teléfono
- **THEN** la navegación primaria es la barra inferior y el riel lateral no se muestra

### Requirement: Colapsar y expandir el riel, con estado recordado

El riel lateral SHALL poder alternar entre un estado expandido (icono + etiqueta) y uno colapsado (solo icono). El estado elegido SHALL recordarse entre navegaciones y entre sesiones en el mismo dispositivo. En estado colapsado, cada destino SHALL seguir siendo identificable (p. ej. etiqueta accesible o tooltip) y accionable con área táctil suficiente.

#### Scenario: Colapsar el riel

- **WHEN** el usuario colapsa el riel lateral
- **THEN** el riel pasa a mostrar solo iconos y el contenido gana el ancho liberado

#### Scenario: El estado persiste

- **WHEN** el usuario colapsa el riel y luego recarga o vuelve a entrar a la app en el mismo dispositivo
- **THEN** el riel sigue colapsado

#### Scenario: Destinos usables con el riel colapsado

- **WHEN** el riel está colapsado
- **THEN** cada destino se puede reconocer y accionar sin ambigüedad, con área tocable de al menos ~44px

### Requirement: Paridad de navegación entre móvil y escritorio

La navegación primaria SHALL exponer los mismos destinos e indicadores en los tres tramos (teléfono, tablet y escritorio), sea cual sea la forma que tome en cada uno (barra inferior o riel lateral). Ningún destino ni indicador presente en un tramo SHALL faltar en otro.

#### Scenario: Enlace de administración en móvil

- **WHEN** un usuario con rol dev abre la app
- **THEN** ve el enlace de administración en la navegación primaria en cualquier tramo (barra inferior en teléfono, riel lateral en tablet y escritorio)

#### Scenario: Indicador de reservas en móvil

- **WHEN** hay solicitudes de hora pendientes y el staff usa la app
- **THEN** el indicador (badge) de reservas pendientes aparece en la navegación primaria en cualquier tramo

#### Scenario: Destino activo resaltado en todos los tramos

- **WHEN** el staff está en una sección concreta
- **THEN** el destino correspondiente aparece resaltado en la navegación primaria, tanto en la barra inferior del teléfono como en el riel lateral de tablet y escritorio

### Requirement: Navegación del portal en móvil

El portal del cliente SHALL ofrecer una barra de navegación inferior en móvil con sus secciones principales.

#### Scenario: Barra del portal en móvil

- **WHEN** el cliente abre el portal en un teléfono
- **THEN** ve una barra inferior con Inicio, sus mascotas, sus citas y sus notificaciones, con la sección activa resaltada

#### Scenario: Badge de notificaciones en el portal

- **WHEN** el cliente tiene notificaciones sin leer
- **THEN** la barra inferior del portal muestra el indicador (badge) de no leídas

### Requirement: Navegación del portal en tablet y escritorio mediante riel lateral

En tramo tablet y escritorio, el portal del cliente SHALL presentar su navegación primaria como un riel lateral con las mismas secciones que su barra inferior de teléfono (Inicio, sus mascotas, sus citas y sus notificaciones), con la sección activa resaltada y el badge de notificaciones no leídas. En teléfono, el portal SHALL conservar su barra de navegación inferior.

#### Scenario: Riel del portal en tablet

- **WHEN** el cliente abre el portal en una tablet o en escritorio
- **THEN** ve un riel lateral con Inicio, Mascotas, Citas y Notificaciones, con la sección activa resaltada

#### Scenario: Badge de notificaciones en el riel del portal

- **WHEN** el cliente tiene notificaciones sin leer y usa el portal en tablet o escritorio
- **THEN** el riel lateral muestra el indicador (badge) de no leídas

#### Scenario: Barra inferior del portal solo en teléfono

- **WHEN** el cliente abre el portal en un teléfono
- **THEN** la navegación primaria del portal es la barra inferior, no el riel

### Requirement: Controles de acción tocables en móvil

Los controles de acción interactivos SHALL ofrecer un área tocable de al menos ~44px en todos los tramos, de modo que se puedan accionar con el pulgar sin requerir precisión. En tramo tablet y escritorio la densidad de listas y filas puede ser mayor que en teléfono, pero el área efectiva de cada control accionable SHALL NOT bajar de ese mínimo.

#### Scenario: Tocar una acción en móvil

- **WHEN** el usuario toca una acción (editar, eliminar, confirmar, etc.) en un teléfono
- **THEN** el área tocable es suficiente para accionarla sin errar el toque

#### Scenario: Tocar una acción en tablet

- **WHEN** el usuario toca una acción en una lista mostrada en tramo tablet, incluso en su variante más densa
- **THEN** el área tocable sigue siendo de al menos ~44px y se acciona sin errar el toque

### Requirement: Desbordamiento de acciones densas

Cuando una fila o tarjeta ofrece muchas acciones (3 o más), la interfaz SHALL mantener visible la acción primaria y mover las secundarias a un menú de desbordamiento ("⋯"), de modo que la fila no quede apretada.

#### Scenario: Fila con muchas acciones

- **WHEN** una fila ofrece 3 o más acciones (p. ej. la gestión de dueños o una cita en la agenda)
- **THEN** se ve la acción primaria y las demás están en un menú "⋯" por fila

#### Scenario: El menú se cierra

- **WHEN** el usuario elige una acción del menú "⋯" o toca fuera de él
- **THEN** el menú se cierra

### Requirement: Contenedor de contenido adaptativo por tramo

El área de contenido principal SHALL adaptar su ancho al tramo en vez de usar un ancho máximo único pensado para teléfono. En tramo tablet y escritorio, el contenido SHALL aprovechar el ancho disponible junto al riel lateral. En vistas centradas en texto largo, el sistema SHALL conservar una medida de lectura cómoda (línea no excesivamente ancha) aunque haya más ancho disponible.

#### Scenario: Aprovechar el ancho en tablet

- **WHEN** el staff abre una lista o tabla (p. ej. pacientes o agenda) en tramo tablet o escritorio
- **THEN** el contenido usa el ancho disponible junto al riel, sin quedar embutido en una columna estrecha centrada

#### Scenario: Medida de lectura en vistas de texto

- **WHEN** se muestra una vista centrada en texto largo en una pantalla ancha
- **THEN** la longitud de línea se mantiene cómoda para leer, sin estirarse de borde a borde

#### Scenario: Sin scroll horizontal de la página

- **WHEN** se cambia el ancho del viewport entre y dentro de los tres tramos
- **THEN** el contenedor se adapta sin provocar scroll horizontal de la página ni recortar contenido
