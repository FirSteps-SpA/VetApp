-- VetApp — Normaliza el RUT y lo hace único por entidad (cuando está presente).
-- Forma canónica: alfanumérico en mayúscula (solo dígitos y K), sin puntos/guiones.
-- nullif(..., '') deja en NULL los valores vacíos para que no participen del índice.

alter table pacientes
  add column rut_normalizado text
  generated always as (
    nullif(upper(regexp_replace(coalesce(rut, ''), '[^0-9kK]', '', 'g')), '')
  ) stored;

alter table duenos
  add column rut_normalizado text
  generated always as (
    nullif(upper(regexp_replace(coalesce(rut, ''), '[^0-9kK]', '', 'g')), '')
  ) stored;

-- Únicos solo cuando hay RUT (múltiples registros sin RUT conviven).
create unique index pacientes_rut_normalizado_key
  on pacientes (rut_normalizado)
  where rut_normalizado is not null;

create unique index duenos_rut_normalizado_key
  on duenos (rut_normalizado)
  where rut_normalizado is not null;
