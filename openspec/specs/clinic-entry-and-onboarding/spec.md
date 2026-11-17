# clinic-entry-and-onboarding Specification

## Purpose
Define cómo se entra a VetApp en un modelo de varias clínicas (entrada propia de cada clínica y login genérico) y cómo la cuenta de plataforma da de alta clínicas, administra su staff y cambia de clínica para dar soporte.

## Requirements

### Requirement: Entrada propia de cada clínica
Cada clínica SHALL tener una entrada en `/c/<slug>/login` que muestra su nombre y su logo. `/login` sin slug SHALL ser un login genérico con la marca VetApp. En ambos casos, tras iniciar sesión la clínica SHALL determinarse por la cuenta, no por la entrada, y las rutas de la aplicación SHALL ser las mismas para todas las clínicas.

#### Scenario: Entrar por la URL de la clínica
- **WHEN** un usuario abre `/c/pradera/login`
- **THEN** ve el nombre y el logo de la clínica Pradera

#### Scenario: Slug inexistente
- **WHEN** alguien abre `/c/<slug>/login` con un slug que no corresponde a ninguna clínica activa
- **THEN** ve una página de no encontrado y ningún dato revela qué clínicas existen

#### Scenario: Entrar por otra entrada
- **WHEN** un veterinario de la clínica A inicia sesión desde el login genérico o desde la entrada de la clínica B
- **THEN** después del login opera en la clínica A

### Requirement: Invitaciones con la entrada de la clínica
Los enlaces de invitación y de acceso que reciben el staff y los dueños SHALL llevar a la entrada con la marca de la clínica que invita.

#### Scenario: Dueño invitado
- **WHEN** la clínica Pradera invita a un dueño al portal
- **THEN** el enlace lleva a una pantalla con la marca de Pradera

### Requirement: Alta de clínicas por la cuenta de plataforma
Solo la cuenta de plataforma (rol dev) SHALL poder dar de alta una clínica con nombre, slug único, datos legales, logo y una sucursal inicial, y desactivarla. Una clínica desactivada SHALL dejar de admitir el ingreso de su staff y de sus dueños, y sus datos SHALL conservarse.

#### Scenario: Alta de una clínica
- **WHEN** la cuenta de plataforma da de alta la clínica "Pradera" con slug `pradera`
- **THEN** la clínica existe, su entrada `/c/pradera/login` funciona y no tiene datos de ninguna otra clínica

#### Scenario: Slug repetido
- **WHEN** se intenta dar de alta una clínica con un slug ya usado
- **THEN** el alta se rechaza indicando que el slug no está disponible

#### Scenario: Staff intenta dar de alta una clínica
- **WHEN** un veterinario intenta crear una clínica
- **THEN** la operación se rechaza

### Requirement: Cambio de clínica activa para soporte
La cuenta de plataforma SHALL poder elegir la clínica activa entre todas las clínicas. Mientras una clínica está activa, la cuenta SHALL ver y administrar solo esa clínica, con las mismas reglas de aislamiento que su staff. La interfaz SHALL mostrar siempre qué clínica está activa.

#### Scenario: Soporte a otra clínica
- **WHEN** la cuenta de plataforma cambia la clínica activa a Pradera
- **THEN** ve los pacientes y usuarios de Pradera y ninguno de la clínica anterior, y el encabezado indica Pradera

### Requirement: Staff de una sola clínica
Cada integrante del staff SHALL pertenecer a una sola clínica, la que lo dio de alta. Un email que ya pertenece a una cuenta del staff o de un dueño SHALL NOT poder registrarse como staff de otra clínica.

#### Scenario: Alta de un veterinario con email ya usado
- **WHEN** la cuenta de plataforma, con Pradera activa, intenta dar de alta como veterinario un email que pertenece al staff de otra clínica
- **THEN** el alta se rechaza indicando que el email ya está en uso

### Requirement: Alta de clínica documentada
SHALL existir un procedimiento documentado para dar de alta una clínica nueva (clínica, marca, sucursal, primer staff y verificación de su entrada) que una persona con acceso de plataforma pueda completar en menos de 30 minutos.

#### Scenario: Seguir el procedimiento
- **WHEN** una persona con acceso de plataforma sigue el procedimiento para una clínica de prueba
- **THEN** en menos de 30 minutos la clínica tiene su entrada con marca y un veterinario que puede iniciar sesión y registrar un paciente
