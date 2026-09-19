# Spec Delta

## MODIFIED Requirements

### Requirement: Roles de color semánticos

El sistema SHALL exponer los colores como roles semánticos (al menos: superficie, superficie elevada, borde, texto primario, texto secundario, acento, acento secundario, acento terciario, texto sobre acento, peligro, aviso, y color de badge) en lugar de referencias a colores concretos repartidas por las pantallas. Los componentes SHALL referirse a estos roles. La paleta concreta (musgo/tierra/neutro cálido) SHALL definirse una sola vez detrás de esos roles.

#### Scenario: Cambio de paleta en un solo lugar

- **WHEN** se cambia el valor del rol "acento"
- **THEN** todos los elementos acentuados (enlaces activos, botones primarios, destino de navegación activo) reflejan el nuevo color sin editar cada pantalla

#### Scenario: Contraste de texto sobre acento

- **WHEN** un elemento usa el rol "acento" como fondo con el rol "texto sobre acento" encima
- **THEN** la combinación mantiene contraste legible (AA para texto normal)

#### Scenario: Acento secundario y terciario disponibles como roles propios

- **WHEN** una pantalla necesita distinguir una etiqueta de categoría o un fondo sutil del acento principal (p. ej. una etiqueta de especie o un ícono inactivo)
- **THEN** puede usar el rol "acento secundario" o "acento terciario" en vez de introducir un color nuevo fuera de la escala

#### Scenario: Aviso distinto de peligro y de badge

- **WHEN** una pantalla necesita señalar una condición que requiere atención pronto pero no es aún un error (p. ej. una vacuna próxima a vencer)
- **THEN** usa el rol "aviso", visualmente distinguible tanto del rol "peligro" (condición ya vencida o error) como del color de badge (contador numérico)

## ADDED Requirements

### Requirement: Pareja tipográfica con nombre y fallback

El sistema SHALL definir una pareja tipográfica con nombre —una tipografía de titular y una de cuerpo— cada una con una pila de resguardo (`fallback`) real, y los estilos de texto SHALL aplicar esa pareja de forma efectiva en toda la app. No SHALL cargarse una tipografía que ningún estilo termine aplicando.

#### Scenario: La tipografía de titular se aplica a los encabezados

- **WHEN** se muestra un encabezado de página o de sección
- **THEN** usa la tipografía de titular definida, con su pila de resguardo visible si la fuente no carga

#### Scenario: La tipografía de cuerpo se aplica al texto general

- **WHEN** se muestra texto de cuerpo, de apoyo o de controles
- **THEN** usa la tipografía de cuerpo definida, con su pila de resguardo visible si la fuente no carga

### Requirement: Ícono como primitiva coloreada por tokens

El sistema SHALL ofrecer un set de íconos consistente como primitiva de interfaz para navegación, acciones y estados, en lugar de emoji nativos del sistema operativo. Los íconos SHALL tomar su color de los roles semánticos (p. ej. texto secundario cuando están inactivos, acento cuando están activos), y SHALL mantenerse dentro de la escala de área táctil cuando son accionables.

#### Scenario: Ícono activo toma el color de acento

- **WHEN** un destino de navegación o un control está en estado activo
- **THEN** su ícono se muestra con el rol de color "acento", igual que el resto de los elementos acentuados

#### Scenario: Mismo ícono en toda la app

- **WHEN** el mismo destino o acción aparece en más de una superficie (p. ej. "Pacientes" en la barra inferior y en el riel)
- **THEN** se muestra con el mismo ícono del set, no con representaciones distintas por pantalla
