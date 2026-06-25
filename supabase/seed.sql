-- VetApp — Datos iniciales (seed)
-- Idempotente: se puede correr varias veces sin duplicar.

-- Sucursal principal (modo mono-sucursal). Su id se usa como sucursal por defecto.
insert into sucursales (id, nombre, direccion, telefono, email)
values (
  '00000000-0000-0000-0000-000000000001',
  'Sucursal Principal',
  null, null, null
)
on conflict (id) do nothing;

-- Configuración de la clínica (placeholder — editar en /admin/clinica).
insert into clinica_config (id, nombre_clinica, ciudad)
values (1, 'Clínica Veterinaria', null)
on conflict (id) do nothing;

-- Esquemas de vacunación por defecto — Perros
insert into esquemas_vacunacion (especie, nombre_vacuna, intervalo_dias, es_obligatoria, descripcion)
select * from (values
  ('perro', 'Polivalente (DA2PP)', 365, true,  'Distemper, adenovirus, parvovirus, parainfluenza'),
  ('perro', 'Antirrábica',         365, true,  'Obligatoria por normativa'),
  ('perro', 'Bordetella',          365, false, 'Tos de las perreras'),
  ('perro', 'Leptospirosis',       365, false, null),
  ('perro', 'Influenza Canina',    365, false, null)
) as v(especie, nombre_vacuna, intervalo_dias, es_obligatoria, descripcion)
where not exists (
  select 1 from esquemas_vacunacion e
  where e.especie = v.especie and e.nombre_vacuna = v.nombre_vacuna
);

-- Esquemas de vacunación por defecto — Gatos
insert into esquemas_vacunacion (especie, nombre_vacuna, intervalo_dias, es_obligatoria, descripcion)
select * from (values
  ('gato', 'Triple Felina (FVRCP)', 365, true,  'Rinotraqueítis, calicivirus, panleucopenia'),
  ('gato', 'Antirrábica',           365, true,  'Obligatoria por normativa'),
  ('gato', 'Leucemia Felina (FeLV)', 365, false, null)
) as v(especie, nombre_vacuna, intervalo_dias, es_obligatoria, descripcion)
where not exists (
  select 1 from esquemas_vacunacion e
  where e.especie = v.especie and e.nombre_vacuna = v.nombre_vacuna
);
