-- VetApp — spec 8 (portal-lanzamiento).
--
-- 1. Cancelación de horas por el dueño: plazo por clínica, marca de quién
--    canceló y una función dedicada (el cliente sigue sin escribir en
--    `citas`, auditoría #6).
-- 2. Bienvenida del portal: se recuerda en la base, no en el dispositivo.

begin;

alter table public.tenants
  add column horas_cancelacion integer not null default 24
    constraint tenants_horas_cancelacion_check check (horas_cancelacion between 0 and 168);

alter table public.citas
  add column cancelada_por_cliente boolean not null default false,
  add column cancelada_en timestamptz;

alter table public.usuarios add column bienvenida_vista_en timestamptz;

-- ¿Puede el dueño de la sesión cancelar esta hora? Misma regla que aplica
-- cancelar_cita_portal; el portal la usa para ofrecer o no el botón.
create function public.cita_cancelable(p_cita uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from citas c
    join tenants t on t.id = c.tenant_id and t.activo
    where c.id = p_cita
      and c.estado in ('pendiente', 'confirmada')
      and c.fecha_hora >= now() + make_interval(hours => t.horas_cancelacion)
      and public.cliente_owns_paciente(c.paciente_id)
  );
$$;

-- El dueño cancela su hora: solo cambia estado, marca, fecha y motivo.
-- Devuelve lo necesario para el acuse (su ficha de dueño en esa clínica).
create function public.cancelar_cita_portal(p_cita uuid, p_motivo text default null)
returns table (tenant_id uuid, dueno_id uuid, fecha_hora timestamptz, paciente_nombre text)
language plpgsql security definer set search_path = public as $$
declare
  v_cita citas;
begin
  if not public.cita_cancelable(p_cita) then
    raise exception 'La hora no se puede cancelar desde el portal' using errcode = '42501';
  end if;

  update citas
  set estado = 'cancelada',
      cancelada_por_cliente = true,
      cancelada_en = now(),
      notas_cliente = coalesce(nullif(left(trim(p_motivo), 500), ''), notas_cliente)
  where id = p_cita
  returning * into v_cita;

  return query
    select v_cita.tenant_id,
           (select d.id from duenos d
             where d.usuario_id = auth.uid() and d.tenant_id = v_cita.tenant_id),
           v_cita.fecha_hora,
           (select p.nombre from pacientes p where p.id = v_cita.paciente_id);
end;
$$;

-- portal_citas: además, si cada hora se puede cancelar.
drop function public.portal_citas();
create function public.portal_citas()
returns table (id uuid, fecha_hora timestamptz, motivo text, estado text,
               paciente_nombre text, tenant_id uuid, clinica_nombre text,
               cancelable boolean, cancelada_por_cliente boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.fecha_hora, c.motivo, c.estado, p.nombre, t.id, t.nombre,
         public.cita_cancelable(c.id), c.cancelada_por_cliente
  from citas c
  join pacientes p on p.id = c.paciente_id
  join tenants t on t.id = c.tenant_id and t.activo
  where public.cliente_owns_paciente(c.paciente_id)
  order by c.fecha_hora desc;
$$;

revoke execute on function public.cita_cancelable(uuid)             from public, anon;
grant  execute on function public.cita_cancelable(uuid)             to authenticated;
revoke execute on function public.cancelar_cita_portal(uuid, text)  from public, anon;
grant  execute on function public.cancelar_cita_portal(uuid, text)  to authenticated;
revoke execute on function public.portal_citas()                    from public, anon;
grant  execute on function public.portal_citas()                    to authenticated;

commit;
