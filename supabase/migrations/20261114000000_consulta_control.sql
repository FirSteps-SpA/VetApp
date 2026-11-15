-- VetApp — Control rápido enlazado a su consulta de origen (spec 4)
--
-- Un control es una consulta de tipo 'control' con `consulta_origen_id`. Los
-- controles no se anidan: el origen es siempre una consulta sin origen (la
-- action aplana "control de un control"). El origen es del mismo paciente y no
-- se cambia después de crear el control. `evolucion` guarda la evolución
-- registrada en el control.

alter table consultas
  add column consulta_origen_id uuid references consultas(id),
  add column evolucion text,
  add constraint consultas_origen_solo_control
    check (consulta_origen_id is null or tipo = 'control');

create index idx_consultas_origen on consultas (consulta_origen_id)
  where consulta_origen_id is not null;

create or replace function public.validar_consulta_origen()
returns trigger language plpgsql set search_path = public as $$
declare
  origen record;
begin
  if tg_op = 'UPDATE' then
    if new.consulta_origen_id is distinct from old.consulta_origen_id then
      raise exception 'la consulta de origen de un control no se puede cambiar'
        using errcode = '23514';
    end if;
    return new;
  end if;

  if new.consulta_origen_id is not null then
    select paciente_id, consulta_origen_id into origen
    from consultas where id = new.consulta_origen_id;
    if origen.paciente_id is distinct from new.paciente_id then
      raise exception 'la consulta de origen es de otro paciente'
        using errcode = '23514';
    end if;
    if origen.consulta_origen_id is not null then
      raise exception 'la consulta de origen es a su vez un control'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_consultas_origen before insert or update of consulta_origen_id on consultas
  for each row execute function public.validar_consulta_origen();

revoke execute on function public.validar_consulta_origen() from public, anon, authenticated;
