-- VetApp — spec 6 (multi-tenant): varias clínicas en un mismo proyecto.
--
-- Tenant = clínica cliente. Todo dato de una clínica lleva `tenant_id`; la RLS
-- y las políticas de Storage filtran por `current_tenant_id()`, que sale del
-- JWT (`app_metadata.tenant_id`, sincronizado desde `usuarios` como el rol).
-- Las FKs compuestas `(x_id, tenant_id)` impiden referencias entre clínicas
-- aunque la escritura no pase por la app.
--
-- La clínica actual pasa a ser el tenant 1 (UUID fijo) con todos sus datos,
-- números de ficha/receta y marca. Las rutas guardadas pasan a la carpeta del
-- tenant aquí; los archivos se mueven con `scripts/migrar-storage-tenant.mjs`,
-- justo después de esta migración.
--
-- Todo en una transacción: aplica completa o no aplica.

begin;

-- ---------------------------------------------------------------------------
-- 1. Tenants (reemplaza a clinica_config) y tenant 1
-- ---------------------------------------------------------------------------

create table public.tenants (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique
    constraint tenants_slug_check
      check (slug ~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$'),
  nombre          text not null
    constraint tenants_nombre_check
      check (char_length(trim(nombre)) between 1 and 120),
  direccion       text,
  ciudad          text,
  telefono        text,
  email           text,
  numero_registro text,
  logo_url        text,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_tenants_updated before update on public.tenants
  for each row execute function public.set_updated_at();

insert into public.tenants
  (id, slug, nombre, direccion, ciudad, telefono, email, numero_registro, logo_url)
select '00000000-0000-4000-8000-000000000001', 'principal',
       nombre_clinica, direccion, ciudad, telefono, email, numero_registro, logo_url
from public.clinica_config
where id = 1;

-- Sin fila en clinica_config (base vacía): igual existe el tenant 1.
insert into public.tenants (id, slug, nombre)
values ('00000000-0000-4000-8000-000000000001', 'principal', 'Clínica Veterinaria')
on conflict (id) do nothing;

alter table public.tenants enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Tenant de la sesión
-- ---------------------------------------------------------------------------

-- Tenant del JWT, solo si la clínica está activa: desactivar una clínica corta
-- el acceso de su staff de inmediato, aunque el JWT siga vigente.
create function public.current_tenant_id() returns uuid
language sql stable security definer set search_path = public as $$
  select t.id
  from tenants t
  where t.id = nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid
    and t.activo;
$$;

-- ---------------------------------------------------------------------------
-- 3. usuarios.tenant_id (nulo solo para clientes: un dueño puede serlo de
--    varias clínicas) y sincronización al JWT
-- ---------------------------------------------------------------------------

alter table public.usuarios add column tenant_id uuid references public.tenants (id);
-- El relleno no es una edición: sin triggers de usuario (updated_at, auditoría).
alter table public.usuarios disable trigger user;
update public.usuarios
set tenant_id = '00000000-0000-4000-8000-000000000001'
where rol <> 'cliente';
alter table public.usuarios enable trigger user;
alter table public.usuarios
  add constraint usuarios_tenant_segun_rol
    check ((rol = 'cliente') = (tenant_id is null)),
  add constraint usuarios_id_tenant_key unique (id, tenant_id);

create or replace function public.sync_usuario_metadata()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  update auth.users
  set raw_app_meta_data =
        (coalesce(raw_app_meta_data, '{}'::jsonb) - 'sucursal_id' - 'tenant_id')
        || jsonb_build_object('rol', case when new.activo then new.rol else 'inactivo' end)
        || case
             when new.sucursal_id is not null
               then jsonb_build_object('sucursal_id', new.sucursal_id::text)
             else '{}'::jsonb
           end
        || case
             when new.tenant_id is not null
               then jsonb_build_object('tenant_id', new.tenant_id::text)
             else '{}'::jsonb
           end
  where id = new.id;
  return new;
end;
$$;

drop trigger trg_usuarios_sync_metadata on public.usuarios;
create trigger trg_usuarios_sync_metadata
  after insert or update of rol, sucursal_id, activo, tenant_id on public.usuarios
  for each row execute function public.sync_usuario_metadata();

-- Llevar el tenant a los JWT actuales (el trigger no corre en el update de
-- arriba porque se creó después).
update auth.users au
set raw_app_meta_data = coalesce(au.raw_app_meta_data, '{}'::jsonb)
                        || jsonb_build_object('tenant_id', u.tenant_id::text)
from public.usuarios u
where u.id = au.id and u.tenant_id is not null;

-- El tenant de un integrante del staff no cambia; solo la cuenta dev cambia de
-- clínica activa (con `cambiar_clinica_activa`).
create or replace function public.proteger_columnas_usuario()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null
     and public.current_rol() <> 'dev'
     and (
       new.rol         is distinct from old.rol
       or new.sucursal_id is distinct from old.sucursal_id
       or new.activo      is distinct from old.activo
       or new.email       is distinct from old.email
       or new.tenant_id   is distinct from old.tenant_id
     )
  then
    raise exception 'No autorizado a modificar rol, sucursal, estado, email o clínica'
      using errcode = '42501';
  end if;
  if auth.uid() is not null
     and new.tenant_id is distinct from old.tenant_id
     and old.rol <> 'dev'
  then
    raise exception 'La clínica de un integrante del staff no se puede cambiar'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. tenant_id en las tablas de datos de la clínica
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'sucursales', 'duenos', 'pacientes', 'paciente_duenos', 'consultas',
    'recetas', 'examenes', 'vacunas', 'esquemas_vacunacion', 'citas',
    'documentos_emitidos', 'notificaciones', 'notificaciones_config', 'audit_log'
  ] loop
    execute format('alter table public.%I add column tenant_id uuid references public.tenants (id)', t);
    -- El relleno no es una edición: sin triggers de usuario no cambia
    -- `updated_at` ni se escribe en `audit_log`.
    execute format('alter table public.%I disable trigger user', t);
    execute format('update public.%I set tenant_id = %L', t, '00000000-0000-4000-8000-000000000001');
    execute format('alter table public.%I enable trigger user', t);
    execute format('alter table public.%I alter column tenant_id set not null', t);
    execute format('alter table public.%I alter column tenant_id set default public.current_tenant_id()', t);
    execute format('create index idx_%s_tenant on public.%I (tenant_id)', t, t);
  end loop;
end;
$$;

-- notificaciones_config la escribe el propio dueño (sin tenant en su JWT): el
-- tenant sale de su ficha de dueño.
create function public.tenant_desde_dueno() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tenant_id is null then
    select d.tenant_id into new.tenant_id from duenos d where d.id = new.dueno_id;
  end if;
  return new;
end;
$$;
create trigger trg_notif_config_tenant before insert on public.notificaciones_config
  for each row execute function public.tenant_desde_dueno();

-- audit_log: el tenant de la fila auditada.
create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_log (tabla, registro_id, operacion, usuario_id, datos_nuevos, tenant_id)
    values (tg_table_name, new.id, 'INSERT', auth.uid(), to_jsonb(new), new.tenant_id);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into audit_log (tabla, registro_id, operacion, usuario_id, datos_anteriores, datos_nuevos, tenant_id)
    values (tg_table_name, new.id, 'UPDATE', auth.uid(), to_jsonb(old), to_jsonb(new), new.tenant_id);
    return new;
  elsif tg_op = 'DELETE' then
    insert into audit_log (tabla, registro_id, operacion, usuario_id, datos_anteriores, tenant_id)
    values (tg_table_name, old.id, 'DELETE', auth.uid(), to_jsonb(old), old.tenant_id);
    return old;
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. FKs compuestas: ninguna referencia cruza clínicas. Reemplazan a las FKs
--    simples (con el mismo comportamiento al borrar): con ambas, PostgREST
--    vería dos relaciones entre las mismas tablas y los embeds fallarían. Con
--    MATCH SIMPLE, una referencia nula no se verifica.
-- ---------------------------------------------------------------------------

alter table public.pacientes  add constraint pacientes_id_tenant_key  unique (id, tenant_id);
alter table public.duenos     add constraint duenos_id_tenant_key     unique (id, tenant_id);
alter table public.consultas  add constraint consultas_id_tenant_key  unique (id, tenant_id);
alter table public.citas      add constraint citas_id_tenant_key      unique (id, tenant_id);
alter table public.sucursales add constraint sucursales_id_tenant_key unique (id, tenant_id);

alter table public.usuarios
  drop constraint usuarios_sucursal_id_fkey,
  add constraint usuarios_sucursal_id_fkey
    foreign key (sucursal_id, tenant_id) references public.sucursales (id, tenant_id);

alter table public.paciente_duenos
  drop constraint paciente_duenos_paciente_id_fkey,
  drop constraint paciente_duenos_dueno_id_fkey,
  add constraint paciente_duenos_paciente_id_fkey
    foreign key (paciente_id, tenant_id) references public.pacientes (id, tenant_id) on delete cascade,
  add constraint paciente_duenos_dueno_id_fkey
    foreign key (dueno_id, tenant_id) references public.duenos (id, tenant_id) on delete cascade;

alter table public.consultas
  drop constraint consultas_paciente_id_fkey,
  drop constraint consultas_veterinario_id_fkey,
  drop constraint consultas_cita_id_fkey,
  drop constraint consultas_consulta_origen_id_fkey,
  add constraint consultas_paciente_id_fkey
    foreign key (paciente_id, tenant_id) references public.pacientes (id, tenant_id),
  add constraint consultas_veterinario_id_fkey
    foreign key (veterinario_id, tenant_id) references public.usuarios (id, tenant_id),
  add constraint consultas_cita_id_fkey
    foreign key (cita_id, tenant_id) references public.citas (id, tenant_id),
  add constraint consultas_consulta_origen_id_fkey
    foreign key (consulta_origen_id, tenant_id) references public.consultas (id, tenant_id);

alter table public.recetas
  drop constraint recetas_consulta_id_fkey,
  drop constraint recetas_paciente_id_fkey,
  drop constraint recetas_veterinario_id_fkey,
  add constraint recetas_consulta_id_fkey
    foreign key (consulta_id, tenant_id) references public.consultas (id, tenant_id),
  add constraint recetas_paciente_id_fkey
    foreign key (paciente_id, tenant_id) references public.pacientes (id, tenant_id),
  add constraint recetas_veterinario_id_fkey
    foreign key (veterinario_id, tenant_id) references public.usuarios (id, tenant_id);

alter table public.examenes
  drop constraint examenes_paciente_id_fkey,
  drop constraint examenes_consulta_id_fkey,
  add constraint examenes_paciente_id_fkey
    foreign key (paciente_id, tenant_id) references public.pacientes (id, tenant_id),
  add constraint examenes_consulta_id_fkey
    foreign key (consulta_id, tenant_id) references public.consultas (id, tenant_id);

alter table public.vacunas
  drop constraint vacunas_paciente_id_fkey,
  drop constraint vacunas_consulta_id_fkey,
  drop constraint vacunas_veterinario_id_fkey,
  add constraint vacunas_paciente_id_fkey
    foreign key (paciente_id, tenant_id) references public.pacientes (id, tenant_id),
  add constraint vacunas_consulta_id_fkey
    foreign key (consulta_id, tenant_id) references public.consultas (id, tenant_id),
  add constraint vacunas_veterinario_id_fkey
    foreign key (veterinario_id, tenant_id) references public.usuarios (id, tenant_id);

alter table public.citas
  drop constraint citas_paciente_id_fkey,
  drop constraint citas_dueno_id_fkey,
  drop constraint citas_veterinario_id_fkey,
  drop constraint citas_sucursal_id_fkey,
  drop constraint citas_consulta_id_fkey,
  add constraint citas_paciente_id_fkey
    foreign key (paciente_id, tenant_id) references public.pacientes (id, tenant_id),
  add constraint citas_dueno_id_fkey
    foreign key (dueno_id, tenant_id) references public.duenos (id, tenant_id),
  add constraint citas_veterinario_id_fkey
    foreign key (veterinario_id, tenant_id) references public.usuarios (id, tenant_id),
  add constraint citas_sucursal_id_fkey
    foreign key (sucursal_id, tenant_id) references public.sucursales (id, tenant_id),
  add constraint citas_consulta_id_fkey
    foreign key (consulta_id, tenant_id) references public.consultas (id, tenant_id);

-- `set null (dueno_id)`: al borrar el dueño solo se anula la referencia, no
-- el tenant del documento.
alter table public.documentos_emitidos
  drop constraint documentos_emitidos_paciente_id_fkey,
  drop constraint documentos_emitidos_dueno_id_fkey,
  add constraint documentos_emitidos_paciente_id_fkey
    foreign key (paciente_id, tenant_id) references public.pacientes (id, tenant_id) on delete cascade,
  add constraint documentos_emitidos_dueno_id_fkey
    foreign key (dueno_id, tenant_id) references public.duenos (id, tenant_id) on delete set null (dueno_id);

alter table public.notificaciones_config
  drop constraint notificaciones_config_dueno_id_fkey,
  add constraint notificaciones_config_dueno_id_fkey
    foreign key (dueno_id, tenant_id) references public.duenos (id, tenant_id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 6. Unicidades por clínica (los nombres conservan `email` y
--    `rut_normalizado`, que lee `src/lib/db-errors.ts`)
-- ---------------------------------------------------------------------------

alter table public.pacientes drop constraint pacientes_numero_ficha_key;
alter table public.pacientes add constraint pacientes_numero_ficha_key unique (tenant_id, numero_ficha);
alter table public.recetas drop constraint recetas_numero_receta_key;
alter table public.recetas add constraint recetas_numero_receta_key unique (tenant_id, numero_receta);
alter table public.duenos drop constraint duenos_email_key;
alter table public.duenos add constraint duenos_email_key unique (tenant_id, email);
alter table public.duenos drop constraint duenos_usuario_id_key;
alter table public.duenos add constraint duenos_usuario_id_key unique (tenant_id, usuario_id);

drop index public.duenos_rut_normalizado_key;
create unique index duenos_rut_normalizado_key
  on public.duenos (tenant_id, rut_normalizado) where rut_normalizado is not null;
drop index public.pacientes_rut_normalizado_key;
create unique index pacientes_rut_normalizado_key
  on public.pacientes (tenant_id, rut_normalizado) where rut_normalizado is not null;

-- ---------------------------------------------------------------------------
-- 7. Correlativos PAC-/REC- por clínica, sin saltos
-- ---------------------------------------------------------------------------

create table public.tenant_correlativos (
  tenant_id uuid not null references public.tenants (id),
  tipo      text not null check (tipo in ('ficha', 'receta')),
  ultimo    integer not null default 0 check (ultimo >= 0),
  primary key (tenant_id, tipo)
);
alter table public.tenant_correlativos enable row level security;
-- Sin políticas: solo lo usan las funciones de trigger (SECURITY DEFINER).

-- El tenant 1 continúa donde iba la secuencia (o el máximo usado, si es mayor).
insert into public.tenant_correlativos (tenant_id, tipo, ultimo)
select '00000000-0000-4000-8000-000000000001', 'ficha', greatest(
  (select case when is_called then last_value else 0 end from public.seq_numero_ficha),
  coalesce((select max(substring(numero_ficha from '\d+$')::int) from public.pacientes), 0));
insert into public.tenant_correlativos (tenant_id, tipo, ultimo)
select '00000000-0000-4000-8000-000000000001', 'receta', greatest(
  (select case when is_called then last_value else 0 end from public.seq_numero_receta),
  coalesce((select max(substring(numero_receta from '\d+$')::int) from public.recetas), 0));

-- Siguiente número de un tipo para una clínica. El UPDATE bloquea la fila del
-- correlativo hasta el fin de la transacción: dos altas simultáneas de la misma
-- clínica se serializan y un rollback no deja saltos.
create function public.siguiente_correlativo(p_tenant uuid, p_tipo text) returns integer
language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  insert into tenant_correlativos as tc (tenant_id, tipo, ultimo)
  values (p_tenant, p_tipo, 1)
  on conflict (tenant_id, tipo) do update set ultimo = tc.ultimo + 1
  returning ultimo into n;
  return n;
end;
$$;

create or replace function public.set_numero_ficha()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.numero_ficha is null or new.numero_ficha = '' then
    new.numero_ficha := 'PAC-' || lpad(public.siguiente_correlativo(new.tenant_id, 'ficha')::text, 5, '0');
  end if;
  return new;
end;
$$;

create or replace function public.set_numero_receta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.numero_receta is null or new.numero_receta = '' then
    new.numero_receta := 'REC-' || lpad(public.siguiente_correlativo(new.tenant_id, 'receta')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop sequence public.seq_numero_ficha;
drop sequence public.seq_numero_receta;

-- ---------------------------------------------------------------------------
-- 8. Funciones de búsqueda, portal y plataforma
-- ---------------------------------------------------------------------------

create or replace function public.buscar_pacientes(q text default null)
returns setof public.pacientes language sql stable set search_path = public as $$
  select p.*
  from pacientes p
  where p.activo
    and p.tenant_id = public.current_tenant_id()
    and (
      q is null
      or q = ''
      or p.nombre ilike '%' || q || '%'
      or p.numero_ficha ilike '%' || q || '%'
      or exists (
        select 1
        from paciente_duenos pd
        join duenos d on d.id = pd.dueno_id
        where pd.paciente_id = p.id
          and d.telefono ilike '%' || q || '%'
      )
    )
  order by p.nombre
  limit 50;
$$;

-- ¿El usuario pertenece a la clínica de la sesión? Staff por su tenant;
-- clientes por tener una ficha de dueño en ella.
create function public.usuario_en_mi_clinica(p_usuario uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuarios u
    where u.id = p_usuario and u.tenant_id = public.current_tenant_id()
  ) or exists (
    select 1 from duenos d
    where d.usuario_id = p_usuario and d.tenant_id = public.current_tenant_id()
  );
$$;

-- ¿El cliente de la sesión tiene ficha de dueño en esta clínica?
create function public.es_cliente_de_tenant(p_tenant uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from duenos d
    where d.usuario_id = auth.uid() and d.tenant_id = p_tenant
  );
$$;

-- Portal: cada fila lleva su clínica para agrupar.
drop function public.portal_mascotas();
create function public.portal_mascotas()
returns table (id uuid, nombre text, especie text, raza text, fecha_nacimiento date,
               sexo text, peso_kg numeric, numero_ficha text, foto_url text,
               tenant_id uuid, clinica_nombre text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nombre, p.especie, p.raza, p.fecha_nacimiento,
         p.sexo, p.peso_kg, p.numero_ficha, p.foto_url, t.id, t.nombre
  from pacientes p
  join tenants t on t.id = p.tenant_id and t.activo
  where public.cliente_owns_paciente(p.id)
  order by t.nombre, p.nombre;
$$;

drop function public.portal_citas();
create function public.portal_citas()
returns table (id uuid, fecha_hora timestamptz, motivo text, estado text,
               paciente_nombre text, tenant_id uuid, clinica_nombre text)
language sql stable security definer set search_path = public as $$
  select c.id, c.fecha_hora, c.motivo, c.estado, p.nombre, t.id, t.nombre
  from citas c
  join pacientes p on p.id = c.paciente_id
  join tenants t on t.id = c.tenant_id and t.activo
  where public.cliente_owns_paciente(c.paciente_id)
  order by c.fecha_hora desc;
$$;

drop function public.portal_mi_dueno();
create function public.portal_mi_dueno()
returns table (id uuid, nombre text, rut text, telefono text, email text,
               direccion text, comuna text, sector text,
               tenant_id uuid, clinica_nombre text)
language sql stable security definer set search_path = public as $$
  select d.id, d.nombre, d.rut, d.telefono, d.email, d.direccion, d.comuna, d.sector,
         t.id, t.nombre
  from duenos d
  join tenants t on t.id = d.tenant_id and t.activo
  where d.usuario_id = auth.uid()
  order by t.nombre;
$$;

-- Marca pública de una clínica por su slug (login `/c/<slug>`): solo nombre y
-- logo, y solo de clínicas activas.
create function public.branding_por_slug(p_slug text)
returns table (slug text, nombre text, logo_url text)
language sql stable security definer set search_path = public as $$
  select t.slug, t.nombre, t.logo_url
  from tenants t
  where t.slug = lower(trim(p_slug)) and t.activo;
$$;

-- Alta de una clínica (solo la cuenta de plataforma): clínica, sucursal
-- inicial, correlativos y esquemas de vacunación copiados del tenant 1.
create function public.crear_clinica(
  p_slug text, p_nombre text, p_sucursal text,
  p_direccion text default null, p_ciudad text default null,
  p_telefono text default null, p_email text default null,
  p_numero_registro text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if public.current_rol() <> 'dev' then
    raise exception 'Solo la cuenta de plataforma puede dar de alta clínicas'
      using errcode = '42501';
  end if;
  insert into tenants (slug, nombre, direccion, ciudad, telefono, email, numero_registro)
  values (lower(trim(p_slug)), trim(p_nombre), p_direccion, p_ciudad, p_telefono,
          p_email, p_numero_registro)
  returning id into v_id;
  insert into sucursales (tenant_id, nombre, direccion, telefono, email)
  values (v_id, coalesce(nullif(trim(p_sucursal), ''), 'Principal'), p_direccion, p_telefono, p_email);
  insert into tenant_correlativos (tenant_id, tipo) values (v_id, 'ficha'), (v_id, 'receta');
  insert into esquemas_vacunacion
    (tenant_id, especie, nombre_vacuna, intervalo_dias, es_obligatoria, descripcion, activo)
  select v_id, especie, nombre_vacuna, intervalo_dias, es_obligatoria, descripcion, activo
  from esquemas_vacunacion
  where tenant_id = '00000000-0000-4000-8000-000000000001';
  return v_id;
end;
$$;

-- La cuenta de plataforma elige la clínica activa (soporte). La app refresca
-- la sesión después para que el JWT lleve el tenant nuevo.
create function public.cambiar_clinica_activa(p_tenant uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.current_rol() <> 'dev' then
    raise exception 'Solo la cuenta de plataforma puede cambiar de clínica'
      using errcode = '42501';
  end if;
  if not exists (select 1 from tenants where id = p_tenant and activo) then
    raise exception 'La clínica no existe o está desactivada' using errcode = '23514';
  end if;
  update usuarios set tenant_id = p_tenant, sucursal_id = null where id = auth.uid();
end;
$$;

revoke execute on function public.current_tenant_id()          from public, anon;
grant  execute on function public.current_tenant_id()          to authenticated;
revoke execute on function public.usuario_en_mi_clinica(uuid)  from public, anon;
grant  execute on function public.usuario_en_mi_clinica(uuid)  to authenticated;
revoke execute on function public.es_cliente_de_tenant(uuid)   from public, anon;
grant  execute on function public.es_cliente_de_tenant(uuid)   to authenticated;
revoke execute on function public.portal_mascotas()            from public, anon;
grant  execute on function public.portal_mascotas()            to authenticated;
revoke execute on function public.portal_citas()               from public, anon;
grant  execute on function public.portal_citas()               to authenticated;
revoke execute on function public.portal_mi_dueno()            from public, anon;
grant  execute on function public.portal_mi_dueno()            to authenticated;
grant  execute on function public.branding_por_slug(text)      to anon, authenticated;
revoke execute on function public.crear_clinica(text, text, text, text, text, text, text, text) from public, anon;
grant  execute on function public.crear_clinica(text, text, text, text, text, text, text, text) to authenticated;
revoke execute on function public.cambiar_clinica_activa(uuid) from public, anon;
grant  execute on function public.cambiar_clinica_activa(uuid) to authenticated;
revoke execute on function public.siguiente_correlativo(uuid, text) from public, anon, authenticated;
revoke execute on function public.tenant_desde_dueno()         from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. RLS: tenant de la sesión + las reglas de rol de siempre
-- ---------------------------------------------------------------------------

-- tenants: el staff lee su clínica; dev además lista todas y edita la activa;
-- un cliente lee las clínicas donde tiene ficha de dueño.
create policy tenants_select on public.tenants for select to authenticated
  using (
    id = public.current_tenant_id()
    or public.current_rol() = 'dev'
    or public.es_cliente_de_tenant(id)
  );
create policy tenants_update on public.tenants for update to authenticated
  using (public.current_rol() = 'dev')
  with check (public.current_rol() = 'dev');

drop policy audit_select on public.audit_log;
create policy audit_select on public.audit_log for select to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_rol() = 'dev');

drop policy citas_delete on public.citas;
drop policy citas_insert on public.citas;
drop policy citas_select on public.citas;
drop policy citas_update on public.citas;
create policy citas_delete on public.citas for delete to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy citas_insert on public.citas for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.is_staff());
create policy citas_select on public.citas for select to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (
      public.current_rol() in ('dev', 'veterinario')
      or (
        public.current_rol() = 'recepcionista'
        and (public.current_sucursal_id() is null or sucursal_id is null
             or sucursal_id = public.current_sucursal_id())
      )
    )
  );
create policy citas_update on public.citas for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_staff())
  with check (tenant_id = public.current_tenant_id() and public.is_staff());

drop policy consultas_insert on public.consultas;
drop policy consultas_select on public.consultas;
drop policy consultas_update on public.consultas;
create policy consultas_insert on public.consultas for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy consultas_select on public.consultas for select to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy consultas_update on public.consultas for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico())
  with check (tenant_id = public.current_tenant_id() and public.is_clinico());

drop policy docemit_insert on public.documentos_emitidos;
drop policy docemit_select on public.documentos_emitidos;
create policy docemit_insert on public.documentos_emitidos for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.is_staff());
create policy docemit_select on public.documentos_emitidos for select to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_staff());

drop policy duenos_delete on public.duenos;
drop policy duenos_insert on public.duenos;
drop policy duenos_select on public.duenos;
drop policy duenos_update on public.duenos;
create policy duenos_delete on public.duenos for delete to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy duenos_insert on public.duenos for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.is_staff());
create policy duenos_select on public.duenos for select to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_staff());
create policy duenos_update on public.duenos for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_staff())
  with check (tenant_id = public.current_tenant_id() and public.is_staff());

drop policy esquemas_select on public.esquemas_vacunacion;
drop policy esquemas_write on public.esquemas_vacunacion;
create policy esquemas_select on public.esquemas_vacunacion for select to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_staff());
create policy esquemas_write on public.esquemas_vacunacion for all to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico())
  with check (tenant_id = public.current_tenant_id() and public.is_clinico());

drop policy examenes_delete on public.examenes;
drop policy examenes_insert on public.examenes;
drop policy examenes_select on public.examenes;
drop policy examenes_update on public.examenes;
create policy examenes_delete on public.examenes for delete to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy examenes_insert on public.examenes for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy examenes_select on public.examenes for select to authenticated
  using (
    (tenant_id = public.current_tenant_id() and public.is_clinico())
    or (public.cliente_owns_paciente(paciente_id) and interno = false)
  );
create policy examenes_update on public.examenes for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico())
  with check (tenant_id = public.current_tenant_id() and public.is_clinico());

drop policy notif_select on public.notificaciones;
drop policy notif_update on public.notificaciones;
create policy notif_select on public.notificaciones for select to authenticated
  using (
    usuario_id = auth.uid()
    or (tenant_id = public.current_tenant_id() and public.current_rol() = 'dev')
  );
create policy notif_update on public.notificaciones for update to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

drop policy notif_config_select on public.notificaciones_config;
drop policy notif_config_upsert on public.notificaciones_config;
create policy notif_config_select on public.notificaciones_config for select to authenticated
  using (
    (tenant_id = public.current_tenant_id() and public.is_staff())
    or public.es_mi_dueno(dueno_id)
  );
create policy notif_config_upsert on public.notificaciones_config for all to authenticated
  using (public.es_mi_dueno(dueno_id))
  with check (public.es_mi_dueno(dueno_id));

drop policy paciente_duenos_delete on public.paciente_duenos;
drop policy paciente_duenos_insert on public.paciente_duenos;
drop policy paciente_duenos_select on public.paciente_duenos;
drop policy paciente_duenos_update on public.paciente_duenos;
create policy paciente_duenos_delete on public.paciente_duenos for delete to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy paciente_duenos_insert on public.paciente_duenos for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.is_staff());
create policy paciente_duenos_select on public.paciente_duenos for select to authenticated
  using (
    (tenant_id = public.current_tenant_id() and public.is_staff())
    or public.es_mi_dueno(dueno_id)
  );
create policy paciente_duenos_update on public.paciente_duenos for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_staff())
  with check (tenant_id = public.current_tenant_id() and public.is_staff());

drop policy pacientes_delete on public.pacientes;
drop policy pacientes_insert on public.pacientes;
drop policy pacientes_select on public.pacientes;
drop policy pacientes_update on public.pacientes;
create policy pacientes_delete on public.pacientes for delete to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy pacientes_insert on public.pacientes for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.is_staff());
create policy pacientes_select on public.pacientes for select to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_staff());
create policy pacientes_update on public.pacientes for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_staff())
  with check (tenant_id = public.current_tenant_id() and public.is_staff());

-- push_subscriptions es por cuenta (sin tenant): dev solo ve las de cuentas
-- de su clínica activa.
drop policy push_select on public.push_subscriptions;
create policy push_select on public.push_subscriptions for select to authenticated
  using (
    usuario_id = auth.uid()
    or (public.current_rol() = 'dev' and public.usuario_en_mi_clinica(usuario_id))
  );

drop policy recetas_insert on public.recetas;
drop policy recetas_select on public.recetas;
drop policy recetas_update on public.recetas;
create policy recetas_insert on public.recetas for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy recetas_select on public.recetas for select to authenticated
  using (
    (tenant_id = public.current_tenant_id() and public.is_clinico())
    or (public.cliente_owns_paciente(paciente_id) and vigente)
  );
create policy recetas_update on public.recetas for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico())
  with check (tenant_id = public.current_tenant_id() and public.is_clinico());

drop policy sucursales_select on public.sucursales;
drop policy sucursales_write on public.sucursales;
create policy sucursales_select on public.sucursales for select to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_staff());
create policy sucursales_write on public.sucursales for all to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_rol() = 'dev')
  with check (tenant_id = public.current_tenant_id() and public.current_rol() = 'dev');

-- usuarios: cada uno se ve a sí mismo; dev y veterinarios ven los de su
-- clínica (staff de ella y clientes con ficha en ella).
drop policy usuarios_delete on public.usuarios;
drop policy usuarios_insert on public.usuarios;
drop policy usuarios_select on public.usuarios;
drop policy usuarios_update on public.usuarios;
create policy usuarios_delete on public.usuarios for delete to authenticated
  using (public.current_rol() = 'dev' and public.usuario_en_mi_clinica(id));
create policy usuarios_insert on public.usuarios for insert to authenticated
  with check (
    public.current_rol() = 'dev'
    and (tenant_id = public.current_tenant_id() or (rol = 'cliente' and tenant_id is null))
  );
create policy usuarios_select on public.usuarios for select to authenticated
  using (
    id = auth.uid()
    or (public.current_rol() in ('dev', 'veterinario') and public.usuario_en_mi_clinica(id))
  );
create policy usuarios_update on public.usuarios for update to authenticated
  using (id = auth.uid() or (public.current_rol() = 'dev' and public.usuario_en_mi_clinica(id)))
  with check (id = auth.uid() or (public.current_rol() = 'dev' and public.usuario_en_mi_clinica(id)));

drop policy vacunas_delete on public.vacunas;
drop policy vacunas_insert on public.vacunas;
drop policy vacunas_select on public.vacunas;
drop policy vacunas_update on public.vacunas;
create policy vacunas_delete on public.vacunas for delete to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy vacunas_insert on public.vacunas for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy vacunas_select on public.vacunas for select to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico());
create policy vacunas_update on public.vacunas for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.is_clinico())
  with check (tenant_id = public.current_tenant_id() and public.is_clinico());

-- ---------------------------------------------------------------------------
-- 10. Storage: cada archivo bajo `<tenant_id>/`
-- ---------------------------------------------------------------------------

drop policy storage_private_select on storage.objects;
drop policy storage_private_insert on storage.objects;
drop policy storage_private_update on storage.objects;
drop policy storage_private_delete on storage.objects;
create policy storage_private_select on storage.objects for select to authenticated
  using (
    bucket_id in ('fotos-pacientes','examenes','recetas-pdf','historiales-pdf')
    and public.is_clinico()
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );
create policy storage_private_insert on storage.objects for insert to authenticated
  with check (
    bucket_id in ('fotos-pacientes','examenes','recetas-pdf','historiales-pdf')
    and public.is_clinico()
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );
create policy storage_private_update on storage.objects for update to authenticated
  using (
    bucket_id in ('fotos-pacientes','examenes','recetas-pdf','historiales-pdf')
    and public.is_clinico()
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  )
  with check (
    bucket_id in ('fotos-pacientes','examenes','recetas-pdf','historiales-pdf')
    and public.is_clinico()
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );
create policy storage_private_delete on storage.objects for delete to authenticated
  using (
    bucket_id in ('fotos-pacientes','examenes','recetas-pdf','historiales-pdf')
    and public.is_clinico()
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );

-- clinica-assets: lectura pública (logos); escritura solo dev, en la carpeta
-- de su clínica activa.
drop policy storage_assets_write on storage.objects;
drop policy storage_assets_update on storage.objects;
drop policy storage_assets_delete on storage.objects;
create policy storage_assets_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'clinica-assets' and public.current_rol() = 'dev'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );
create policy storage_assets_update on storage.objects for update to authenticated
  using (
    bucket_id = 'clinica-assets' and public.current_rol() = 'dev'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  )
  with check (
    bucket_id = 'clinica-assets' and public.current_rol() = 'dev'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );
create policy storage_assets_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'clinica-assets' and public.current_rol() = 'dev'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );

-- ---------------------------------------------------------------------------
-- 11. Rutas de Storage guardadas: a la carpeta del tenant 1. Los archivos los
--     mueve después `scripts/migrar-storage-tenant.mjs`; hasta entonces las
--     fotos y exámenes existentes no cargan (ventana del despliegue).
-- ---------------------------------------------------------------------------

alter table public.pacientes disable trigger user;
update public.pacientes
set foto_url = '00000000-0000-4000-8000-000000000001/' || foto_url
where foto_url is not null and foto_url !~ '^https?://';
alter table public.pacientes enable trigger user;

alter table public.examenes disable trigger user;
update public.examenes
set archivo_url = '00000000-0000-4000-8000-000000000001/' || archivo_url
where archivo_url is not null and archivo_url !~ '^https?://';
alter table public.examenes enable trigger user;

alter table public.recetas disable trigger user;
update public.recetas
set pdf_url = '00000000-0000-4000-8000-000000000001/' || pdf_url
where pdf_url is not null and pdf_url !~ '^https?://';
alter table public.recetas enable trigger user;

update public.tenants
set logo_url = '00000000-0000-4000-8000-000000000001/' || logo_url
where logo_url is not null and logo_url !~ '^https?://';

-- ---------------------------------------------------------------------------
-- 12. clinica_config ya vive en tenants
-- ---------------------------------------------------------------------------

drop table public.clinica_config;

commit;
