-- VetApp — Row Level Security y Storage
-- El control de COLUMNAS visibles para el cliente (p. ej. ocultar anamnesis)
-- se aplica a nivel de aplicación en el portal; RLS controla filas.

alter table sucursales         enable row level security;
alter table usuarios           enable row level security;
alter table duenos             enable row level security;
alter table pacientes          enable row level security;
alter table paciente_duenos    enable row level security;
alter table consultas          enable row level security;
alter table recetas            enable row level security;
alter table examenes           enable row level security;
alter table vacunas            enable row level security;
alter table esquemas_vacunacion enable row level security;
alter table citas              enable row level security;
alter table clinica_config     enable row level security;
alter table audit_log          enable row level security;

-- =========================================================================
-- sucursales
-- =========================================================================
create policy sucursales_select on sucursales for select to authenticated
  using (public.is_staff());
create policy sucursales_write on sucursales for all to authenticated
  using (public.current_rol() = 'dev')
  with check (public.current_rol() = 'dev');

-- =========================================================================
-- usuarios
-- =========================================================================
create policy usuarios_select on usuarios for select to authenticated
  using (public.current_rol() in ('dev','veterinario') or id = auth.uid());
create policy usuarios_insert on usuarios for insert to authenticated
  with check (public.current_rol() = 'dev');
create policy usuarios_update on usuarios for update to authenticated
  using (public.current_rol() = 'dev' or id = auth.uid())
  with check (public.current_rol() = 'dev' or id = auth.uid());
create policy usuarios_delete on usuarios for delete to authenticated
  using (public.current_rol() = 'dev');

-- =========================================================================
-- duenos
-- =========================================================================
create policy duenos_select on duenos for select to authenticated
  using (public.is_staff() or usuario_id = auth.uid());
create policy duenos_insert on duenos for insert to authenticated
  with check (public.is_staff());
create policy duenos_update on duenos for update to authenticated
  using (public.is_staff() or usuario_id = auth.uid())
  with check (public.is_staff() or usuario_id = auth.uid());
create policy duenos_delete on duenos for delete to authenticated
  using (public.is_clinico());

-- =========================================================================
-- pacientes
-- =========================================================================
create policy pacientes_select on pacientes for select to authenticated
  using (public.is_staff() or public.cliente_owns_paciente(id));
create policy pacientes_insert on pacientes for insert to authenticated
  with check (public.is_staff());
create policy pacientes_update on pacientes for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());
create policy pacientes_delete on pacientes for delete to authenticated
  using (public.is_clinico());

-- =========================================================================
-- paciente_duenos
-- =========================================================================
create policy paciente_duenos_select on paciente_duenos for select to authenticated
  using (
    public.is_staff()
    or exists (select 1 from duenos d where d.id = dueno_id and d.usuario_id = auth.uid())
  );
create policy paciente_duenos_insert on paciente_duenos for insert to authenticated
  with check (public.is_staff());
create policy paciente_duenos_update on paciente_duenos for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy paciente_duenos_delete on paciente_duenos for delete to authenticated
  using (public.is_clinico());

-- =========================================================================
-- consultas (recepcionista SIN acceso; cliente lectura de filas de sus mascotas)
-- =========================================================================
create policy consultas_select on consultas for select to authenticated
  using (public.is_clinico() or public.cliente_owns_paciente(paciente_id));
create policy consultas_insert on consultas for insert to authenticated
  with check (public.is_clinico());
create policy consultas_update on consultas for update to authenticated
  using (public.is_clinico()) with check (public.is_clinico());
-- DELETE: sin política → denegado para todos (las consultas no se eliminan).

-- =========================================================================
-- recetas (cliente: solo vigentes de sus mascotas)
-- =========================================================================
create policy recetas_select on recetas for select to authenticated
  using (
    public.is_clinico()
    or (public.cliente_owns_paciente(paciente_id) and vigente)
  );
create policy recetas_insert on recetas for insert to authenticated
  with check (public.is_clinico());
create policy recetas_update on recetas for update to authenticated
  using (public.is_clinico()) with check (public.is_clinico());
-- DELETE: denegado (las recetas no se eliminan, se invalidan con vigente=false).

-- =========================================================================
-- examenes (cliente: solo no internos de sus mascotas)
-- =========================================================================
create policy examenes_select on examenes for select to authenticated
  using (
    public.is_clinico()
    or (public.cliente_owns_paciente(paciente_id) and interno = false)
  );
create policy examenes_insert on examenes for insert to authenticated
  with check (public.is_clinico());
create policy examenes_update on examenes for update to authenticated
  using (public.is_clinico()) with check (public.is_clinico());
create policy examenes_delete on examenes for delete to authenticated
  using (public.is_clinico());

-- =========================================================================
-- vacunas (cliente: lectura de sus mascotas)
-- =========================================================================
create policy vacunas_select on vacunas for select to authenticated
  using (public.is_clinico() or public.cliente_owns_paciente(paciente_id));
create policy vacunas_insert on vacunas for insert to authenticated
  with check (public.is_clinico());
create policy vacunas_update on vacunas for update to authenticated
  using (public.is_clinico()) with check (public.is_clinico());
create policy vacunas_delete on vacunas for delete to authenticated
  using (public.is_clinico());

-- =========================================================================
-- esquemas_vacunacion (lectura staff; escritura dev/veterinario)
-- =========================================================================
create policy esquemas_select on esquemas_vacunacion for select to authenticated
  using (public.is_staff());
create policy esquemas_write on esquemas_vacunacion for all to authenticated
  using (public.is_clinico()) with check (public.is_clinico());

-- =========================================================================
-- citas (recepcionista filtrada por sucursal; cliente solo sus mascotas)
-- =========================================================================
create policy citas_select on citas for select to authenticated
  using (
    public.current_rol() in ('dev','veterinario')
    or (
      public.current_rol() = 'recepcionista'
      and (
        public.current_sucursal_id() is null   -- mono-sucursal: sin filtro
        or sucursal_id is null
        or sucursal_id = public.current_sucursal_id()
      )
    )
    or public.cliente_owns_paciente(paciente_id)
  );
create policy citas_insert on citas for insert to authenticated
  with check (
    public.is_staff()
    or (
      public.current_rol() = 'cliente'
      and creado_por_cliente
      and public.cliente_owns_paciente(paciente_id)
    )
  );
create policy citas_update on citas for update to authenticated
  using (
    public.is_staff()
    or (public.current_rol() = 'cliente' and public.cliente_owns_paciente(paciente_id))
  )
  with check (
    public.is_staff()
    or (public.current_rol() = 'cliente' and public.cliente_owns_paciente(paciente_id))
  );
create policy citas_delete on citas for delete to authenticated
  using (public.is_clinico());

-- =========================================================================
-- clinica_config (lectura para cualquier autenticado; escritura dev)
-- =========================================================================
create policy clinica_select on clinica_config for select to authenticated
  using (auth.uid() is not null);
create policy clinica_write on clinica_config for all to authenticated
  using (public.current_rol() = 'dev')
  with check (public.current_rol() = 'dev');

-- =========================================================================
-- audit_log (solo dev lee; nadie escribe directo — el trigger es SECURITY DEFINER)
-- =========================================================================
create policy audit_select on audit_log for select to authenticated
  using (public.current_rol() = 'dev');

-- =========================================================================
-- Storage: buckets y políticas
-- =========================================================================
insert into storage.buckets (id, name, public) values
  ('fotos-pacientes',  'fotos-pacientes',  false),
  ('examenes',         'examenes',         false),
  ('recetas-pdf',      'recetas-pdf',      false),
  ('historiales-pdf',  'historiales-pdf',  false),
  ('clinica-assets',   'clinica-assets',   true)
on conflict (id) do nothing;

-- Buckets privados: acceso completo para staff clínico (dev/veterinario).
create policy storage_private_select on storage.objects for select to authenticated
  using (
    bucket_id in ('fotos-pacientes','examenes','recetas-pdf','historiales-pdf')
    and public.is_clinico()
  );
create policy storage_private_insert on storage.objects for insert to authenticated
  with check (
    bucket_id in ('fotos-pacientes','examenes','recetas-pdf','historiales-pdf')
    and public.is_clinico()
  );
create policy storage_private_update on storage.objects for update to authenticated
  using (
    bucket_id in ('fotos-pacientes','examenes','recetas-pdf','historiales-pdf')
    and public.is_clinico()
  )
  with check (
    bucket_id in ('fotos-pacientes','examenes','recetas-pdf','historiales-pdf')
    and public.is_clinico()
  );
create policy storage_private_delete on storage.objects for delete to authenticated
  using (
    bucket_id in ('fotos-pacientes','examenes','recetas-pdf','historiales-pdf')
    and public.is_clinico()
  );

-- clinica-assets: lectura pública (logo), escritura solo dev.
create policy storage_assets_select on storage.objects for select to public
  using (bucket_id = 'clinica-assets');
create policy storage_assets_write on storage.objects for insert to authenticated
  with check (bucket_id = 'clinica-assets' and public.current_rol() = 'dev');
create policy storage_assets_update on storage.objects for update to authenticated
  using (bucket_id = 'clinica-assets' and public.current_rol() = 'dev')
  with check (bucket_id = 'clinica-assets' and public.current_rol() = 'dev');
create policy storage_assets_delete on storage.objects for delete to authenticated
  using (bucket_id = 'clinica-assets' and public.current_rol() = 'dev');
