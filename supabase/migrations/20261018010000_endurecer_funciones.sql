-- VetApp — Endurecimiento señalado por el advisor de seguridad de Supabase
--
-- 1) search_path fijo en todas las funciones de public: sin él, un rol que pueda
--    crear objetos en un esquema anterior del search_path podría suplantar
--    tablas/funciones usadas dentro de ellas. Ninguna usa extensiones y las
--    referencias a `auth` ya están calificadas.
-- 2) Funciones de trigger SECURITY DEFINER: nadie necesita ejecutarlas por RPC
--    (los triggers no requieren EXECUTE del usuario que dispara la operación).
-- 3) cliente_owns_paciente: la usan políticas RLS evaluadas como
--    `authenticated`, así que solo se quita a `anon`.
--
-- Las funciones portal_* y es_mi_dueno quedan ejecutables por `authenticated`
-- a propósito (son la API del portal); el advisor seguirá avisándolo.

alter function public.current_rol()                  set search_path = public;
alter function public.current_sucursal_id()          set search_path = public;
alter function public.is_staff()                     set search_path = public;
alter function public.is_clinico()                   set search_path = public;
alter function public.set_updated_at()               set search_path = public;
alter function public.set_numero_ficha()             set search_path = public;
alter function public.set_numero_receta()            set search_path = public;
alter function public.set_estado_vacuna()            set search_path = public;
alter function public.buscar_pacientes(text)         set search_path = public;
alter function public.set_peso_paciente()            set search_path = public;
alter function public.recalcular_alertas_vacunas()   set search_path = public;
alter function public.proteger_columnas_usuario()    set search_path = public;

revoke execute on function public.audit_trigger()         from public, anon, authenticated;
revoke execute on function public.sync_usuario_metadata() from public, anon, authenticated;
revoke execute on function public.cliente_owns_paciente(uuid) from public, anon;
grant  execute on function public.cliente_owns_paciente(uuid) to authenticated;
