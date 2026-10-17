-- VetApp — Protección de columnas privilegiadas de `usuarios` y desactivación efectiva
--
-- 1) `usuarios_update` permite a cualquier usuario editar SU propia fila (para
--    nombre, RUT, título profesional). Como los GRANT son a nivel de tabla, eso
--    incluía `rol`, y el trigger `sync_usuario_metadata` lo propagaba al JWT:
--    un cliente del portal podía hacerse `dev`. Este trigger rechaza cambios a
--    rol/sucursal/activo/email si quien edita (usuario final) no es dev.
--    El service_role (auth.uid() nulo) y el SQL Editor no se ven afectados.
--
-- 2) `activo = false` no tenía efecto: el rol seguía en app_metadata y RLS lo
--    seguía aceptando. Ahora un usuario inactivo propaga rol 'inactivo' al JWT,
--    que no coincide con ningún rol de RLS ni de rutas. Las sesiones abiertas
--    lo reflejan al refrescar el token (≤ 1 h) o al volver a iniciar sesión.

create or replace function public.proteger_columnas_usuario()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null
     and public.current_rol() <> 'dev'
     and (
       new.rol         is distinct from old.rol
       or new.sucursal_id is distinct from old.sucursal_id
       or new.activo      is distinct from old.activo
       or new.email       is distinct from old.email
     )
  then
    raise exception 'No autorizado a modificar rol, sucursal, estado o email'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger trg_usuarios_proteger_columnas
  before update on usuarios
  for each row execute function public.proteger_columnas_usuario();

create or replace function public.sync_usuario_metadata()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  update auth.users
  set raw_app_meta_data =
        coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('rol', case when new.activo then new.rol else 'inactivo' end)
        || case
             when new.sucursal_id is not null
               then jsonb_build_object('sucursal_id', new.sucursal_id::text)
             else '{}'::jsonb
           end
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_usuarios_sync_metadata on usuarios;
create trigger trg_usuarios_sync_metadata
  after insert or update of rol, sucursal_id, activo on usuarios
  for each row execute function public.sync_usuario_metadata();

-- Re-sincroniza los usuarios ya desactivados para que pierdan el acceso.
update usuarios set activo = activo where not activo;
