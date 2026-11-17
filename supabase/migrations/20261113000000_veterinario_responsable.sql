-- VetApp — Veterinario responsable seleccionable (spec 3)
--
-- El staff puede registrar consultas, recetas y vacunas a nombre de otro
-- veterinario. Estos triggers garantizan que `veterinario_id` sea siempre un
-- usuario con rol 'veterinario' y activo, también para escrituras directas por
-- la API. Solo se valida al insertar o al CAMBIAR el valor: los registros
-- históricos (p. ej. a nombre de 'dev') siguen siendo editables.
--
-- La receta hereda el veterinario de su consulta: al cambiarlo en la consulta
-- se propaga a sus recetas. audit_log sigue registrando auth.uid() como autor.

create or replace function public.es_veterinario_elegible(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuarios
    where id = p_id and rol = 'veterinario' and activo
  );
$$;

-- SECURITY DEFINER: llama a es_veterinario_elegible, que no es ejecutable por
-- `authenticated`.
create or replace function public.validar_veterinario_responsable()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT' or new.veterinario_id is distinct from old.veterinario_id)
     and not public.es_veterinario_elegible(new.veterinario_id) then
    raise exception 'veterinario_id % no es un veterinario activo', new.veterinario_id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger trg_consultas_veterinario before insert or update of veterinario_id on consultas
  for each row execute function public.validar_veterinario_responsable();
create trigger trg_recetas_veterinario before insert or update of veterinario_id on recetas
  for each row execute function public.validar_veterinario_responsable();
create trigger trg_vacunas_veterinario before insert or update of veterinario_id on vacunas
  for each row execute function public.validar_veterinario_responsable();

-- Sin SECURITY DEFINER: la actualización de recetas pasa por RLS (is_clinico)
-- y por sus triggers de validación y auditoría con el mismo autor.
create or replace function public.propagar_veterinario_a_recetas()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.veterinario_id is distinct from old.veterinario_id then
    update recetas set veterinario_id = new.veterinario_id
    where consulta_id = new.id and veterinario_id is distinct from new.veterinario_id;
  end if;
  return new;
end;
$$;

create trigger trg_consultas_propagar_veterinario after update of veterinario_id on consultas
  for each row execute function public.propagar_veterinario_a_recetas();

-- Nadie las necesita por RPC: los triggers no requieren EXECUTE del usuario.
revoke execute on function public.es_veterinario_elegible(uuid)          from public, anon, authenticated;
revoke execute on function public.validar_veterinario_responsable()       from public, anon, authenticated;
revoke execute on function public.propagar_veterinario_a_recetas()        from public, anon, authenticated;
