# Spec Delta

## Purpose

Define la orientación que recibe un dueño en el portal: la bienvenida del primer ingreso y la ayuda permanente, incluida la instalación de la app para recibir notificaciones.

## ADDED Requirements

### Requirement: Bienvenida en el primer ingreso
La primera vez que un dueño entra al portal, después de aceptar el aviso de privacidad, el inicio SHALL mostrarle una bienvenida que explique qué puede hacer: ver a sus mascotas y sus documentos, solicitar y cancelar horas, recibir recordatorios y gestionar su privacidad. La bienvenida SHALL poder cerrarse y SHALL NOT volver a mostrarse después de cerrada, en ningún dispositivo.

#### Scenario: Primer ingreso
- **WHEN** un dueño entra por primera vez al inicio del portal
- **THEN** ve la bienvenida con un enlace a la ayuda

#### Scenario: Cerrada
- **WHEN** el dueño cerró la bienvenida y vuelve a entrar desde otro dispositivo
- **THEN** el inicio no la muestra

### Requirement: Página de ayuda
El portal SHALL tener una página de Ayuda, accesible desde la navegación, con respuestas a cómo solicitar una hora, cómo y hasta cuándo cancelarla, dónde están los documentos, cómo configurar los recordatorios, cómo descargar sus datos y a quién contactar. La ayuda SHALL mostrar el plazo de cancelación y el contacto de cada clínica del dueño.

#### Scenario: Plazo de su clínica
- **WHEN** un dueño de una clínica con plazo de 48 horas abre la ayuda
- **THEN** la respuesta sobre cancelaciones indica 48 horas

### Requirement: Instalar la app para recibir notificaciones
La ayuda SHALL explicar cómo instalar el portal como app en Android y en iOS, y que en iOS las notificaciones push solo funcionan con la app agregada a la pantalla de inicio. Cuando el dispositivo no admita push en el navegador actual, la sección de notificaciones SHALL indicar el paso que falta en lugar de un error.

#### Scenario: iPhone en Safari sin instalar
- **WHEN** un dueño abre las notificaciones del portal en Safari de iPhone sin haber agregado la app a la pantalla de inicio
- **THEN** ve que debe agregarla a la pantalla de inicio para activar las notificaciones, con el enlace a la ayuda
