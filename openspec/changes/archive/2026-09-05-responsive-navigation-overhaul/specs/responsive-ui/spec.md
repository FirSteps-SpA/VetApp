## MODIFIED Requirements

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

### Requirement: Controles de acción tocables en móvil

Los controles de acción interactivos SHALL ofrecer un área tocable de al menos ~44px en todos los tramos, de modo que se puedan accionar con el pulgar sin requerir precisión. En tramo tablet y escritorio la densidad de listas y filas puede ser mayor que en teléfono, pero el área efectiva de cada control accionable SHALL NOT bajar de ese mínimo.

#### Scenario: Tocar una acción en móvil

- **WHEN** el usuario toca una acción (editar, eliminar, confirmar, etc.) en un teléfono
- **THEN** el área tocable es suficiente para accionarla sin errar el toque

#### Scenario: Tocar una acción en tablet

- **WHEN** el usuario toca una acción en una lista mostrada en tramo tablet, incluso en su variante más densa
- **THEN** el área tocable sigue siendo de al menos ~44px y se acciona sin errar el toque

## ADDED Requirements

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
