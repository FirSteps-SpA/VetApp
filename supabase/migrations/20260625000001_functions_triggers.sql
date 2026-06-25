-- VetApp — Funciones y triggers

-- =========================================================================
-- Helpers de identidad (leen el rol/sucursal del JWT, no de la tabla)
-- =========================================================================
create or replace function public.current_rol()
returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'rol', '');
$$;

create or replace function public.current_sucursal_id()
returns uuid language sql stable as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'sucursal_id', '')::uuid;
$$;

create or replace function public.is_staff()
returns boolean language sql stable as $$
  select public.current_rol() in ('dev','veterinario','recepcionista');
$$;

create or replace function public.is_clinico()
returns boolean language sql stable as $$
  select public.current_rol() in ('dev','veterinario');
$$;

-- ¿El cliente autenticado es dueño del paciente? SECURITY DEFINER para no
-- recursar sobre las RLS de paciente_duenos/duenos.
create or replace function public.cliente_owns_paciente(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from paciente_duenos pd
    join duenos d on d.id = pd.dueno_id
    where pd.paciente_id = p_id
      and d.usuario_id = auth.uid()
  );
$$;

-- =========================================================================
-- updated_at automático
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_sucursales_updated   before update on sucursales   for each row execute function public.set_updated_at();
create trigger trg_usuarios_updated     before update on usuarios     for each row execute function public.set_updated_at();
create trigger trg_duenos_updated       before update on duenos       for each row execute function public.set_updated_at();
create trigger trg_pacientes_updated    before update on pacientes    for each row execute function public.set_updated_at();
create trigger trg_consultas_updated    before update on consultas    for each row execute function public.set_updated_at();
create trigger trg_citas_updated        before update on citas        for each row execute function public.set_updated_at();
create trigger trg_clinica_updated      before update on clinica_config for each row execute function public.set_updated_at();

-- =========================================================================
-- Números correlativos legibles (PAC-00001 / REC-00001)
-- =========================================================================
create sequence if not exists seq_numero_ficha start 1;
create sequence if not exists seq_numero_receta start 1;

create or replace function public.set_numero_ficha()
returns trigger language plpgsql as $$
begin
  if new.numero_ficha is null or new.numero_ficha = '' then
    new.numero_ficha := 'PAC-' || lpad(nextval('seq_numero_ficha')::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger trg_pacientes_numero before insert on pacientes
  for each row execute function public.set_numero_ficha();

create or replace function public.set_numero_receta()
returns trigger language plpgsql as $$
begin
  if new.numero_receta is null or new.numero_receta = '' then
    new.numero_receta := 'REC-' || lpad(nextval('seq_numero_receta')::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger trg_recetas_numero before insert on recetas
  for each row execute function public.set_numero_receta();

-- =========================================================================
-- Estado de alerta de vacunas (desnormalizado, recalculado on-write)
-- =========================================================================
create or replace function public.set_estado_vacuna()
returns trigger language plpgsql as $$
begin
  if new.proxima_dosis is null then
    new.estado_alerta := 'al_dia';
  elsif new.proxima_dosis < current_date then
    new.estado_alerta := 'vencida';
  elsif new.proxima_dosis <= current_date + 30 then
    new.estado_alerta := 'proxima';
  else
    new.estado_alerta := 'al_dia';
  end if;
  return new;
end;
$$;

create trigger trg_vacunas_estado before insert or update on vacunas
  for each row execute function public.set_estado_vacuna();

-- =========================================================================
-- Auditoría de tablas clínicas (consultas, recetas, vacunas)
-- =========================================================================
create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_log (tabla, registro_id, operacion, usuario_id, datos_nuevos)
    values (tg_table_name, new.id, 'INSERT', auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into audit_log (tabla, registro_id, operacion, usuario_id, datos_anteriores, datos_nuevos)
    values (tg_table_name, new.id, 'UPDATE', auth.uid(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into audit_log (tabla, registro_id, operacion, usuario_id, datos_anteriores)
    values (tg_table_name, old.id, 'DELETE', auth.uid(), to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

create trigger trg_audit_consultas after insert or update or delete on consultas
  for each row execute function public.audit_trigger();
create trigger trg_audit_recetas after insert or update or delete on recetas
  for each row execute function public.audit_trigger();
create trigger trg_audit_vacunas after insert or update or delete on vacunas
  for each row execute function public.audit_trigger();

-- =========================================================================
-- Propaga rol y sucursal a auth.users.app_metadata (los lee el JWT/RLS).
-- Nota: las sesiones activas requieren re-login para refrescar el JWT.
-- =========================================================================
create or replace function public.sync_usuario_metadata()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  update auth.users
  set raw_app_meta_data =
        coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('rol', new.rol)
        || case
             when new.sucursal_id is not null
               then jsonb_build_object('sucursal_id', new.sucursal_id::text)
             else '{}'::jsonb
           end
  where id = new.id;
  return new;
end;
$$;

create trigger trg_usuarios_sync_metadata
  after insert or update of rol, sucursal_id on usuarios
  for each row execute function public.sync_usuario_metadata();
