-- VetApp — Fase 2: búsqueda de pacientes
-- Busca por nombre, número de ficha o teléfono del dueño.
-- SECURITY INVOKER (default): respeta las RLS del usuario que la invoca.

create or replace function public.buscar_pacientes(q text default null)
returns setof pacientes
language sql
stable
as $$
  select p.*
  from pacientes p
  where p.activo
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

grant execute on function public.buscar_pacientes(text) to authenticated;
