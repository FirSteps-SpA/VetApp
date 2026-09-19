# Spec Delta

## Purpose

Define cómo el nombre y el logo de la clínica, ya administrados en la configuración de la clínica, se reflejan en el chrome de navegación de la app y en la pantalla de acceso, en vez de un nombre de aplicación fijo.

## ADDED Requirements

### Requirement: Nombre de la clínica en el chrome de navegación

El encabezado y el riel de navegación primaria (staff y portal) SHALL mostrar el nombre real de la clínica configurado en `clinica_config` en lugar de un nombre de aplicación fijo. Si no hay nombre configurado, SHALL mostrarse un nombre de repuesto en vez de quedar vacío.

#### Scenario: Nombre configurado se refleja en el header

- **WHEN** existe un nombre de clínica configurado
- **THEN** el encabezado y el riel de navegación, tanto en staff como en portal, muestran ese nombre en vez de un nombre de aplicación fijo

#### Scenario: Sin nombre configurado

- **WHEN** no hay nombre de clínica configurado
- **THEN** el chrome de navegación muestra un nombre de repuesto genérico, sin quedar en blanco ni romper el layout

### Requirement: Logo completo en la pantalla de acceso

La pantalla de acceso (login) SHALL mostrar el logo completo de la clínica, configurado en `clinica_config`, a un tamaño prominente aprovechando el espacio disponible en esa pantalla. Cuando no haya logo configurado, SHALL mostrarse el nombre de la clínica en texto en su lugar.

#### Scenario: Logo configurado en login

- **WHEN** hay un logo de clínica configurado
- **THEN** la pantalla de acceso lo muestra de forma prominente, más grande que la referencia de marca usada en el header/riel

#### Scenario: Login sin logo configurado

- **WHEN** no hay logo de clínica configurado
- **THEN** la pantalla de acceso muestra el nombre de la clínica en texto, sin dejar un espacio vacío o roto donde iría el logo

### Requirement: Fuente única de marca

El nombre y el logo mostrados en el chrome de navegación y en la pantalla de acceso SHALL provenir de la misma fuente de datos (`clinica_config`) que ya usan los documentos clínicos exportados, de modo que un cambio de marca se propague a todos los lugares a la vez.

#### Scenario: Un cambio de marca se propaga

- **WHEN** el staff actualiza el nombre o el logo de la clínica desde Admin
- **THEN** el header, el riel, la pantalla de acceso y los documentos exportados reflejan el cambio sin tener que editarlo en más de un lugar
