-- VetApp — recalcular_alertas_vacunas() la ejecuta a diario el cron de Vercel
-- (/api/cron/notificaciones) con service_role vía RPC, en lugar del pg_cron
-- opcional.
--
-- Por RPC rige pg_safeupdate (Supabase rechaza UPDATE sin WHERE), así que se
-- filtra a las filas cuyo estado cambió: además evita reescribir toda la tabla.
create or replace function public.recalcular_alertas_vacunas()
returns void language sql set search_path = public as $$
  update vacunas v set estado_alerta = n.estado
  from (
    select id, case
      when proxima_dosis is null then 'al_dia'
      when proxima_dosis < current_date then 'vencida'
      when proxima_dosis <= current_date + 30 then 'proxima'
      else 'al_dia'
    end as estado
    from vacunas
  ) n
  where v.id = n.id and v.estado_alerta is distinct from n.estado;
$$;

-- Nadie más necesita llamarla por RPC.
revoke execute on function public.recalcular_alertas_vacunas() from public, anon, authenticated;
grant execute on function public.recalcular_alertas_vacunas() to service_role;
