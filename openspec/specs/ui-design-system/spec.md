# ui-design-system Specification

## Purpose

Define el vocabulario visual compartido de la app: tokens semánticos de color, espaciado, tipografía, radios, elevación y área táctil, la definición única de los tramos responsivos (teléfono, tablet, escritorio), y las primitivas base que los consumen, para que densidad y apariencia sean consistentes entre pantallas y un ajuste global se haga en un solo lugar.

## Requirements

### Requirement: Tramos responsivos con nombre

El sistema SHALL definir tres tramos responsivos con nombre y límites fijos, usados por toda la app: **teléfono** (ancho de viewport `< 640px`), **tablet** (`>= 640px` y `< 1024px`) y **escritorio** (`>= 1024px`). Cualquier decisión de layout, navegación o densidad que dependa del tamaño de pantalla SHALL expresarse en términos de estos tramos y no de valores sueltos distintos por pantalla.

#### Scenario: Un mismo ancho resuelve el mismo tramo en toda la app

- **WHEN** el viewport mide 800px de ancho
- **THEN** todas las superficies (staff y portal) tratan la sesión como tramo "tablet" de forma consistente

#### Scenario: Los límites de tramo son únicos

- **WHEN** se ajusta el límite entre dos tramos
- **THEN** el cambio aplica a navegación, contenedor de contenido y densidad a la vez, sin tener que editarlo pantalla por pantalla

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

### Requirement: Escala tipográfica que respeta la preferencia del sistema

El sistema SHALL definir una escala tipográfica con pasos con nombre (p. ej. cuerpo, apoyo, título de sección, título de página) expresada en unidades relativas (`rem`), de modo que respete el tamaño de fuente configurado por la persona en su dispositivo o navegador. Ningún texto de interfaz SHALL fijarse en píxeles absolutos de forma que ignore esa preferencia.

#### Scenario: Aumento del tamaño de fuente del sistema

- **WHEN** la persona sube el tamaño de fuente base en su navegador o sistema
- **THEN** los textos de la app escalan de forma proporcional y siguen legibles, sin recortes ni solapamientos

### Requirement: Escala de espaciado, radios y elevación consistente

El sistema SHALL definir escalas con nombre para espaciado, radio de borde y elevación (sombra), y los componentes SHALL tomar sus valores de esas escalas. No SHALL usarse valores de espaciado o radio arbitrarios fuera de la escala salvo casos justificados y aislados.

#### Scenario: Tarjetas y paneles comparten forma

- **WHEN** se muestran dos superficies del mismo nivel (p. ej. dos cards) en pantallas distintas
- **THEN** comparten el mismo radio y la misma elevación por venir de la escala común

### Requirement: Tokens de área táctil

El sistema SHALL definir un token de área táctil mínima (`>= ~44px`) y un token de área táctil cómoda, y los controles interactivos SHALL dimensionarse con esos tokens. La densidad puede variar por tramo, pero el área efectiva de un control interactivo SHALL NOT bajar del mínimo en ningún tramo.

#### Scenario: Control compacto en escritorio sigue sobre el mínimo

- **WHEN** una lista usa su variante densa en tramo escritorio
- **THEN** cada control accionable de la fila mantiene un área tocable de al menos ~44px

### Requirement: Primitivas base consumen los tokens

El sistema SHALL ofrecer primitivas de interfaz reutilizables para los patrones recurrentes (al menos: botón, card, campo de formulario y menú de desbordamiento de acciones) que tomen color, espaciado, tipografía, radio y área táctil de los tokens. Las pantallas SHALL preferir estas primitivas antes que recomponer el mismo patrón con estilos sueltos.

#### Scenario: Botón primario coherente entre superficies

- **WHEN** staff y portal muestran cada uno su acción primaria de página
- **THEN** ambos botones comparten tamaño, tipografía, color y radio por usar la misma primitiva

#### Scenario: Variante de una primitiva

- **WHEN** se necesita una acción de peligro (p. ej. eliminar)
- **THEN** se obtiene como variante de la primitiva de botón (rol "peligro"), no como un estilo nuevo por pantalla

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
