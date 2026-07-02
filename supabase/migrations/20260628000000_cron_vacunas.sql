-- VetApp — Fase 6: recálculo nocturno de alertas de vacunas.
-- El trigger on-write ya mantiene estado_alerta al día en cada insert/update;
-- esta función + cron es una red de seguridad para que el estado avance con el
-- paso del tiempo aunque no haya actividad sobre el registro.

create or replace function public.recalcular_alertas_vacunas()
returns void language sql as $$
  update vacunas set estado_alerta = case
    when proxima_dosis is null then 'al_dia'
    when proxima_dosis < current_date then 'vencida'
    when proxima_dosis <= current_date + 30 then 'proxima'
    else 'al_dia'
  end;
$$;

-- ---------------------------------------------------------------------------
-- Programación con pg_cron (OPCIONAL).
-- Requiere habilitar la extensión pg_cron primero:
--   Dashboard → Database → Extensions → pg_cron
-- Luego ejecutar (una vez):
--
--   select cron.schedule(
--     'recalcular-alertas-vacunas',
--     '0 0 * * *',                                  -- todos los días a las 00:00
--     $$ select public.recalcular_alertas_vacunas(); $$
--   );
--
-- Para quitarlo: select cron.unschedule('recalcular-alertas-vacunas');
-- ---------------------------------------------------------------------------
