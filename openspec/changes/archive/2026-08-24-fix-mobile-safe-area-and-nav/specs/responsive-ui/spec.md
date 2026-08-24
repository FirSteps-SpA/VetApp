## Purpose

Define el comportamiento responsivo/móvil de la app: que la navegación primaria sea accesible en pantallas angostas y que la interfaz respete el área segura del dispositivo cuando corre instalada (standalone).

## ADDED Requirements

### Requirement: Respeto del área segura en standalone

Cuando la app corre instalada en modo standalone, la interfaz SHALL mantener el contenido interactivo fuera de las zonas reservadas del dispositivo (notch superior, indicador de inicio inferior, muescas laterales).

#### Scenario: Header bajo el notch

- **WHEN** la app corre en un dispositivo con notch en modo standalone
- **THEN** el encabezado fijo se muestra completo, sin quedar tapado por el notch

#### Scenario: Contenido sobre el indicador inferior

- **WHEN** el usuario hace scroll hasta el final del contenido en un dispositivo con indicador de inicio
- **THEN** el último contenido queda accesible, sin quedar tapado por el indicador

### Requirement: Navegación primaria accesible en móvil

En pantallas angostas, la navegación primaria del staff SHALL permanecer completamente accesible: ningún ítem se recorta fuera de pantalla y no se fuerza scroll horizontal de la página.

#### Scenario: Muchos ítems en pantalla angosta

- **WHEN** la navegación tiene más ítems de los que caben en el ancho del teléfono
- **THEN** todos los ítems siguen alcanzables (la navegación se desplaza) y la página no scrollea horizontalmente

### Requirement: Paridad de navegación entre móvil y escritorio

La navegación en móvil SHALL exponer los mismos destinos e indicadores que en escritorio.

#### Scenario: Enlace de administración en móvil

- **WHEN** un usuario con rol dev abre la app en móvil
- **THEN** ve el enlace de administración en la navegación, igual que en escritorio

#### Scenario: Indicador de reservas en móvil

- **WHEN** hay solicitudes de hora pendientes y el staff usa la app en móvil
- **THEN** el indicador (badge) de reservas pendientes aparece en la navegación
