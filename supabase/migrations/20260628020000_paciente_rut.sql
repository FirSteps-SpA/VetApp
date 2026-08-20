-- VetApp — Agrega RUT al paciente/dueño.
alter table pacientes add column rut text;
alter table duenos add column rut text;