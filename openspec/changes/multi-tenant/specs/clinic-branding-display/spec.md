## MODIFIED Requirements

### Requirement: Nombre de la clínica en el chrome de navegación

El encabezado y el riel de navegación primaria (staff y portal) SHALL mostrar el nombre real de la clínica de la sesión en lugar de un nombre de aplicación fijo. En el portal, cuando el dueño tiene fichas en varias clínicas, el chrome SHALL mostrar la marca VetApp y cada sección SHALL indicar su clínica. Si no hay nombre configurado, SHALL mostrarse un nombre de repuesto en vez de quedar vacío.

#### Scenario: Nombre configurado se refleja en el header

- **WHEN** existe un nombre configurado para la clínica de la sesión
- **THEN** el encabezado y el riel de navegación, tanto en staff como en portal, muestran ese nombre en vez de un nombre de aplicación fijo

#### Scenario: Sin nombre configurado

- **WHEN** la clínica de la sesión no tiene nombre configurado
- **THEN** el chrome de navegación muestra un nombre de repuesto genérico, sin quedar en blanco ni romper el layout

#### Scenario: Dueño de varias clínicas

- **WHEN** un dueño con fichas en dos clínicas entra al portal
- **THEN** el chrome muestra la marca VetApp y cada grupo de mascotas indica el nombre de su clínica

### Requirement: Logo completo en la pantalla de acceso

La pantalla de acceso de una clínica (`/c/<slug>/login`) SHALL mostrar el logo completo de esa clínica a un tamaño prominente, aprovechando el espacio disponible en esa pantalla. Cuando la clínica no tenga logo configurado, SHALL mostrarse su nombre en texto en su lugar. El login genérico (`/login`) SHALL mostrar la marca VetApp.

#### Scenario: Logo configurado en login

- **WHEN** la clínica de la entrada tiene un logo configurado
- **THEN** la pantalla de acceso lo muestra de forma prominente, más grande que la referencia de marca usada en el header/riel

#### Scenario: Login sin logo configurado

- **WHEN** la clínica de la entrada no tiene logo configurado
- **THEN** la pantalla de acceso muestra el nombre de la clínica en texto, sin dejar un espacio vacío o roto donde iría el logo

#### Scenario: Login genérico

- **WHEN** alguien abre `/login` sin slug de clínica
- **THEN** la pantalla de acceso muestra la marca VetApp y no la de ninguna clínica

### Requirement: Fuente única de marca

El nombre y el logo mostrados en el chrome de navegación, en la pantalla de acceso, en los documentos exportados y en los emails y notificaciones SHALL provenir de la configuración de la clínica correspondiente, de modo que un cambio de marca de una clínica se propague a todos sus lugares a la vez sin afectar a otras clínicas.

#### Scenario: Un cambio de marca se propaga

- **WHEN** se actualiza el nombre o el logo de una clínica desde Admin
- **THEN** el header, el riel, su pantalla de acceso y sus documentos exportados reflejan el cambio sin tener que editarlo en más de un lugar, y las demás clínicas no cambian
