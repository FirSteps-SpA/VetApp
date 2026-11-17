# Spec Delta

## Purpose

Define cómo un dueño cancela desde el portal sus horas en la clínica, el plazo mínimo que fija cada clínica y cómo el staff ve esas cancelaciones.

## ADDED Requirements

### Requirement: El dueño cancela sus horas dentro del plazo
Un dueño SHALL poder cancelar desde el portal una hora pendiente o confirmada de una de sus mascotas, siempre que falten al menos las horas de anticipación que fija la clínica de esa hora. Podrá indicar opcionalmente un motivo. Fuera del plazo, o si la hora tiene otro estado, el portal SHALL indicar que la cancele contactando a la clínica y SHALL NOT permitir cancelarla.

#### Scenario: Cancelar a tiempo
- **WHEN** un dueño cancela una hora confirmada para dentro de 3 días en una clínica con plazo de 24 horas
- **THEN** la hora queda cancelada y el dueño ve su estado "Cancelada"

#### Scenario: Fuera de plazo
- **WHEN** faltan 10 horas para la hora y el plazo de la clínica es de 24 horas
- **THEN** el portal no ofrece cancelarla e indica que debe contactar a la clínica

#### Scenario: Hora ajena
- **WHEN** un dueño intenta cancelar, llamando directamente a la base, una hora de una mascota que no es suya
- **THEN** la operación se rechaza y la hora no cambia

### Requirement: La cancelación pasa por una operación dedicada
El dueño SHALL NOT poder escribir directamente en las citas. La cancelación SHALL realizarse solo mediante una operación que verifica que la hora sea de una mascota suya en una clínica cuyo aviso de privacidad aceptó, su estado y el plazo, y que modifica únicamente el estado, la marca de cancelación por el dueño, su fecha y el motivo.

#### Scenario: Modificar otra cosa
- **WHEN** un dueño intenta cambiar la fecha de su hora por la API
- **THEN** la operación se rechaza

### Requirement: Plazo de cancelación por clínica
Cada clínica SHALL tener un plazo mínimo de cancelación en horas, de 0 a 168, con 24 por defecto, que la cuenta de plataforma edita en Admin › Clínica.

#### Scenario: Cambiar el plazo
- **WHEN** se fija el plazo de una clínica en 48 horas
- **THEN** sus dueños pueden cancelar solo horas que estén al menos a 48 horas

### Requirement: El staff ve las cancelaciones del dueño
Las horas canceladas por el dueño SHALL mostrarse en la agenda y en Reservas marcadas como canceladas por el dueño, con su motivo si lo hay.

#### Scenario: Agenda del día
- **WHEN** un dueño cancela su hora de mañana a las 10:00
- **THEN** en la agenda de mañana la hora aparece cancelada, indicando que la canceló el dueño
