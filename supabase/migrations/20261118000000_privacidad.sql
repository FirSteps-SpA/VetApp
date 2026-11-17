-- VetApp — spec 7 (privacidad-y-consentimiento).
--
-- 1. Aviso de privacidad por clínica, en versiones inmutables.
-- 2. Aceptación del dueño: sin aceptar la versión vigente de una clínica, el
--    portal no entrega datos de esa clínica (lo exige `cliente_owns_paciente`,
--    que usan las funciones portal_* y las políticas de recetas y exámenes).
-- 3. Registro de accesos (aperturas de fichas, exportaciones, anonimizaciones),
--    solo de inserción.
-- 4. Anonimización de un dueño a su pedido, conservando los registros clínicos.

begin;

-- Rechaza toda modificación: avisos, aceptaciones y registro son evidencia.
create function public.rechazar_modificacion() returns trigger
language plpgsql set search_path = public as $$
begin
  raise exception '% no se puede modificar ni borrar', tg_table_name
    using errcode = '42501';
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Avisos de privacidad
-- ---------------------------------------------------------------------------

create table public.avisos_privacidad (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null default public.current_tenant_id() references public.tenants (id),
  version       integer not null check (version > 0),
  texto         text not null check (char_length(trim(texto)) > 0),
  publicado_por uuid,
  publicado_en  timestamptz not null default now(),
  unique (tenant_id, version),
  unique (id, tenant_id)
);
alter table public.avisos_privacidad enable row level security;
create trigger trg_avisos_inmutables before update or delete on public.avisos_privacidad
  for each row execute function public.rechazar_modificacion();

-- Versión vigente de una clínica (la última publicada).
create function public.aviso_vigente(p_tenant uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select id from avisos_privacidad
  where tenant_id = p_tenant
  order by version desc
  limit 1;
$$;

-- Publica una versión nueva del aviso de la clínica activa (solo la cuenta de
-- plataforma). El bloqueo serializa dos publicaciones simultáneas.
create function public.publicar_aviso(p_texto text) returns public.avisos_privacidad
language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_aviso avisos_privacidad;
begin
  if public.current_rol() <> 'dev' or v_tenant is null then
    raise exception 'Solo la cuenta de plataforma publica el aviso de privacidad'
      using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('aviso:' || v_tenant::text));
  insert into avisos_privacidad (tenant_id, version, texto, publicado_por)
  values (
    v_tenant,
    coalesce((select max(version) from avisos_privacidad where tenant_id = v_tenant), 0) + 1,
    p_texto,
    auth.uid()
  )
  returning * into v_aviso;
  return v_aviso;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Aceptaciones
-- ---------------------------------------------------------------------------

create table public.aceptaciones_privacidad (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id),
  dueno_id    uuid not null,
  aviso_id    uuid not null,
  usuario_id  uuid,
  aceptado_en timestamptz not null default now(),
  -- Si se borra la ficha de dueño, se van sus aceptaciones (no hay otra forma
  -- de borrarlas: sin política de DELETE).
  foreign key (dueno_id, tenant_id) references public.duenos (id, tenant_id) on delete cascade,
  foreign key (aviso_id, tenant_id) references public.avisos_privacidad (id, tenant_id),
  unique (dueno_id, aviso_id)
);
alter table public.aceptaciones_privacidad enable row level security;
create index idx_aceptaciones_dueno on public.aceptaciones_privacidad (dueno_id);
create trigger trg_aceptaciones_inmutables before update on public.aceptaciones_privacidad
  for each row execute function public.rechazar_modificacion();

-- ¿La ficha de dueño aceptó la versión vigente del aviso de su clínica?
create function public.aviso_aceptado(p_dueno uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from duenos d
    join aceptaciones_privacidad a on a.dueno_id = d.id
    where d.id = p_dueno
      and a.aviso_id = public.aviso_vigente(d.tenant_id)
  );
$$;

-- El dueño de la sesión acepta un aviso: solo la versión vigente de una
-- clínica donde tiene ficha. Aceptar dos veces no duplica.
create function public.aceptar_aviso(p_aviso uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid;
  v_dueno uuid;
begin
  select tenant_id into v_tenant from avisos_privacidad where id = p_aviso;
  if v_tenant is null or public.aviso_vigente(v_tenant) is distinct from p_aviso then
    raise exception 'Ese aviso no es el vigente' using errcode = '23514';
  end if;
  select d.id into v_dueno
  from duenos d
  join tenants t on t.id = d.tenant_id and t.activo
  where d.usuario_id = auth.uid() and d.tenant_id = v_tenant;
  if v_dueno is null then
    raise exception 'No tienes ficha en esa clínica' using errcode = '42501';
  end if;
  insert into aceptaciones_privacidad (tenant_id, dueno_id, aviso_id, usuario_id)
  values (v_tenant, v_dueno, p_aviso, auth.uid())
  on conflict (dueno_id, aviso_id) do nothing;
end;
$$;

-- El portal solo entrega datos de mascotas de clínicas cuyo aviso vigente el
-- dueño aceptó. Las funciones portal_* y las políticas de recetas/exámenes
-- pasan por aquí.
create or replace function public.cliente_owns_paciente(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from paciente_duenos pd
    join duenos d on d.id = pd.dueno_id
    where pd.paciente_id = p_id
      and d.usuario_id = auth.uid()
      and public.aviso_aceptado(d.id)
  );
$$;

-- Fichas del dueño (una por clínica) con el aviso que le falta aceptar.
drop function public.portal_mi_dueno();
create function public.portal_mi_dueno()
returns table (id uuid, nombre text, rut text, telefono text, email text,
               direccion text, comuna text, sector text,
               tenant_id uuid, clinica_nombre text,
               aviso_vigente_id uuid, aviso_pendiente boolean)
language sql stable security definer set search_path = public as $$
  select d.id, d.nombre, d.rut, d.telefono, d.email, d.direccion, d.comuna, d.sector,
         t.id, t.nombre,
         public.aviso_vigente(t.id),
         not public.aviso_aceptado(d.id)
  from duenos d
  join tenants t on t.id = d.tenant_id and t.activo
  where d.usuario_id = auth.uid()
  order by t.nombre;
$$;

-- ---------------------------------------------------------------------------
-- 3. Registro de accesos
-- ---------------------------------------------------------------------------

-- Sin FKs a pacientes/dueños: es historia y no debe impedir ni seguir sus
-- cambios (un `set null` sería una modificación).
create table public.registro_accesos (
  id          bigserial primary key,
  tenant_id   uuid not null references public.tenants (id),
  usuario_id  uuid not null,
  accion      text not null check (accion in (
                'ver_ficha', 'exportar_documento', 'descargar_portal',
                'exportar_datos', 'anonimizar')),
  paciente_id uuid,
  dueno_id    uuid,
  detalle     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
alter table public.registro_accesos enable row level security;
create index idx_registro_tenant_fecha on public.registro_accesos (tenant_id, created_at desc);
create index idx_registro_paciente on public.registro_accesos (paciente_id);
create index idx_registro_dueno on public.registro_accesos (dueno_id);
create trigger trg_registro_inmutable before update or delete on public.registro_accesos
  for each row execute function public.rechazar_modificacion();

-- Única vía de escritura: siempre a nombre de la cuenta de la sesión y en la
-- clínica del dato accedido.
create function public.registrar_acceso(
  p_accion text, p_paciente uuid default null, p_dueno uuid default null,
  p_detalle jsonb default '{}'::jsonb
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid;
  v_dueno uuid := p_dueno;
  v_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Sin sesión' using errcode = '42501';
  end if;
  if public.is_staff() then
    if p_accion not in ('ver_ficha', 'exportar_documento', 'exportar_datos') then
      raise exception 'Acción no permitida' using errcode = '42501';
    end if;
    v_tenant := public.current_tenant_id();
    if v_tenant is null
       or (p_paciente is not null and not exists (
             select 1 from pacientes where id = p_paciente and tenant_id = v_tenant))
       or (p_dueno is not null and not exists (
             select 1 from duenos where id = p_dueno and tenant_id = v_tenant))
    then
      raise exception 'Dato fuera de la clínica' using errcode = '42501';
    end if;
  elsif public.current_rol() = 'cliente' then
    if p_accion not in ('descargar_portal', 'exportar_datos') then
      raise exception 'Acción no permitida' using errcode = '42501';
    end if;
    if p_paciente is not null then
      if not public.cliente_owns_paciente(p_paciente) then
        raise exception 'Mascota ajena' using errcode = '42501';
      end if;
      select tenant_id into v_tenant from pacientes where id = p_paciente;
      select d.id into v_dueno from duenos d
      where d.usuario_id = auth.uid() and d.tenant_id = v_tenant;
    elsif p_dueno is not null then
      select d.tenant_id into v_tenant from duenos d
      where d.id = p_dueno and d.usuario_id = auth.uid() and public.aviso_aceptado(d.id);
      if v_tenant is null then
        raise exception 'Ficha ajena' using errcode = '42501';
      end if;
    else
      raise exception 'Falta la mascota o la ficha' using errcode = '23514';
    end if;
  else
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  insert into registro_accesos (tenant_id, usuario_id, accion, paciente_id, dueno_id, detalle)
  values (v_tenant, auth.uid(), p_accion, p_paciente, v_dueno, coalesce(p_detalle, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Anonimización de un dueño
-- ---------------------------------------------------------------------------

-- Borra los datos personales de una ficha de dueño de la clínica activa y la
-- desvincula del portal; conserva pacientes, consultas, recetas, vacunas y las
-- autorizaciones emitidas. Devuelve la cuenta que tenía enlazada (la app la
-- elimina si ya no tiene fichas en otras clínicas).
create function public.anonimizar_dueno(p_dueno uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_usuario uuid;
begin
  if not public.is_clinico() or v_tenant is null then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  select usuario_id into v_usuario from duenos where id = p_dueno and tenant_id = v_tenant;
  if not found then
    raise exception 'Dueño no encontrado' using errcode = '42501';
  end if;

  update duenos
  set nombre = 'Dueño eliminado', telefono = '—', rut = null, email = null,
      direccion = null, comuna = null, sector = null, notas = null, usuario_id = null
  where id = p_dueno;
  delete from notificaciones_config where dueno_id = p_dueno;
  update citas set notas_cliente = null where dueno_id = p_dueno;

  insert into registro_accesos (tenant_id, usuario_id, accion, dueno_id)
  values (v_tenant, auth.uid(), 'anonimizar', p_dueno);
  return v_usuario;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. RLS y permisos
-- ---------------------------------------------------------------------------

create policy avisos_select on public.avisos_privacidad for select to authenticated
  using (
    (tenant_id = public.current_tenant_id() and public.is_staff())
    or public.es_cliente_de_tenant(tenant_id)
  );

create policy aceptaciones_select on public.aceptaciones_privacidad for select to authenticated
  using (
    (tenant_id = public.current_tenant_id() and public.is_staff())
    or usuario_id = auth.uid()
  );

create policy registro_select on public.registro_accesos for select to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_rol() = 'dev');

-- Sin políticas de INSERT/UPDATE/DELETE: se escribe solo por las funciones.
revoke insert, update, delete on public.avisos_privacidad, public.aceptaciones_privacidad,
  public.registro_accesos from anon, authenticated;

revoke execute on function public.rechazar_modificacion()            from public, anon, authenticated;
revoke execute on function public.aviso_vigente(uuid)                from public, anon;
grant  execute on function public.aviso_vigente(uuid)                to authenticated;
revoke execute on function public.aviso_aceptado(uuid)               from public, anon;
grant  execute on function public.aviso_aceptado(uuid)               to authenticated;
revoke execute on function public.publicar_aviso(text)               from public, anon;
grant  execute on function public.publicar_aviso(text)               to authenticated;
revoke execute on function public.aceptar_aviso(uuid)                from public, anon;
grant  execute on function public.aceptar_aviso(uuid)                to authenticated;
revoke execute on function public.portal_mi_dueno()                  from public, anon;
grant  execute on function public.portal_mi_dueno()                  to authenticated;
revoke execute on function public.registrar_acceso(text, uuid, uuid, jsonb) from public, anon;
grant  execute on function public.registrar_acceso(text, uuid, uuid, jsonb) to authenticated;
revoke execute on function public.anonimizar_dueno(uuid)             from public, anon;
grant  execute on function public.anonimizar_dueno(uuid)             to authenticated;

commit;
