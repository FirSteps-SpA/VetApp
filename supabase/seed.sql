-- VetApp — Datos iniciales (seed)
-- Idempotente: se puede correr varias veces sin duplicar.

-- La clínica (tenant 1, "principal") la crea la migración multi-tenant con un
-- nombre provisorio — editar en /admin/clinica.

-- Sucursal principal de la clínica 1.
insert into sucursales (id, tenant_id, nombre, direccion, telefono, email)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Sucursal Principal',
  null, null, null
)
on conflict (id) do nothing;

-- Esquemas de vacunación por defecto — Perros
insert into esquemas_vacunacion (tenant_id, especie, nombre_vacuna, intervalo_dias, es_obligatoria, descripcion)
select '00000000-0000-4000-8000-000000000001', * from (values
  ('perro', 'Polivalente (DA2PP)', 365, true,  'Distemper, adenovirus, parvovirus, parainfluenza'),
  ('perro', 'Antirrábica',         365, true,  'Obligatoria por normativa'),
  ('perro', 'Bordetella',          365, false, 'Tos de las perreras'),
  ('perro', 'Leptospirosis',       365, false, null),
  ('perro', 'Influenza Canina',    365, false, null)
) as v(especie, nombre_vacuna, intervalo_dias, es_obligatoria, descripcion)
where not exists (
  select 1 from esquemas_vacunacion e
  where e.tenant_id = '00000000-0000-4000-8000-000000000001' and e.especie = v.especie and e.nombre_vacuna = v.nombre_vacuna
);

-- Esquemas de vacunación por defecto — Gatos
insert into esquemas_vacunacion (tenant_id, especie, nombre_vacuna, intervalo_dias, es_obligatoria, descripcion)
select '00000000-0000-4000-8000-000000000001', * from (values
  ('gato', 'Triple Felina (FVRCP)', 365, true,  'Rinotraqueítis, calicivirus, panleucopenia'),
  ('gato', 'Antirrábica',           365, true,  'Obligatoria por normativa'),
  ('gato', 'Leucemia Felina (FeLV)', 365, false, null)
) as v(especie, nombre_vacuna, intervalo_dias, es_obligatoria, descripcion)
where not exists (
  select 1 from esquemas_vacunacion e
  where e.tenant_id = '00000000-0000-4000-8000-000000000001' and e.especie = v.especie and e.nombre_vacuna = v.nombre_vacuna
);
