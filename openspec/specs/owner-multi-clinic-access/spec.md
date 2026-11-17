# owner-multi-clinic-access Specification

## Purpose
Define cómo un mismo dueño, cliente de varias clínicas, usa una sola cuenta del portal mientras cada clínica mantiene su propia ficha de dueño y solo ve sus datos.

## Requirements

### Requirement: Una cuenta de dueño, una ficha por clínica
Una cuenta de acceso de dueño SHALL poder enlazarse a una ficha de dueño en cada clínica, como máximo una por clínica. Cada clínica SHALL ver y editar solo su propia ficha de ese dueño, sin ver las de otras clínicas ni saber que existen.

#### Scenario: Ficha en dos clínicas
- **WHEN** un dueño tiene ficha en las clínicas A y B, ambas enlazadas a su cuenta
- **THEN** el staff de A ve solo la ficha y las mascotas de A, y el de B solo las de B

### Requirement: Invitar a un dueño que ya tiene cuenta
Al invitar al portal a un dueño cuyo email ya tiene una cuenta de dueño, la clínica SHALL enlazar esa cuenta a su ficha en vez de rechazar la invitación, siempre que la cuenta no esté ya enlazada a otra ficha de la misma clínica. Un email que pertenece a una cuenta del staff SHALL seguir rechazándose.

#### Scenario: Segunda clínica invita al mismo email
- **WHEN** la clínica B invita a un dueño cuyo email ya usa en el portal de la clínica A
- **THEN** la cuenta queda enlazada también a la ficha de B y el dueño recibe un enlace con la marca de B

#### Scenario: Dos fichas en la misma clínica
- **WHEN** la clínica A invita a una ficha de dueño con un email cuya cuenta ya está enlazada a otra ficha de A
- **THEN** la invitación se rechaza indicando que ese email ya tiene acceso con otra ficha de la clínica

### Requirement: Portal agrupado por clínica
El portal SHALL mostrar las mascotas, citas, vacunas y documentos del dueño agrupados por clínica, con el nombre de cada una. Cada documento que el dueño descarga SHALL llevar la marca de la clínica a la que pertenece la mascota.

#### Scenario: Dueño con mascotas en dos clínicas
- **WHEN** un dueño con mascotas en las clínicas A y B entra al portal
- **THEN** ve sus mascotas agrupadas bajo el nombre de cada clínica

#### Scenario: Historial con la marca de su clínica
- **WHEN** el dueño descarga el historial de una mascota de la clínica B
- **THEN** el PDF lleva el nombre y el logo de la clínica B

### Requirement: Revocar el acceso en una sola clínica
Cuando una clínica revoca el acceso al portal de su ficha de dueño, el dueño SHALL dejar de ver los datos de esa clínica y SHALL conservar el acceso a las demás clínicas donde tiene ficha.

#### Scenario: Revocación en la clínica A
- **WHEN** la clínica A revoca el acceso de un dueño que también es cliente de la clínica B
- **THEN** el dueño deja de ver sus mascotas de A y sigue viendo las de B
