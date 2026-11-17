-- Verificación de la migración multi-tenant (spec 6). Solo lectura.
-- Uso: psql (o `supabase db query`) contra la base migrada. Cada consulta
-- debe devolver lo indicado en su comentario.

-- 1. Políticas de `public` sin filtro de clínica. Esperado: solo las
--    justificadas (por cuenta o por dueño, no por clínica):
--    notif_update, notif_config_upsert, push_delete, push_insert,
--    tenants_update (solo dev: activa, desactiva y edita cualquier clínica).
select tablename, policyname
from pg_policies
where schemaname = 'public'
  and coalesce(qual, '') || coalesce(with_check, '') not like '%current_tenant_id()%'
  and coalesce(qual, '') || coalesce(with_check, '') not like '%usuario_en_mi_clinica%'
  and coalesce(qual, '') || coalesce(with_check, '') not like '%es_cliente_de_tenant%'
order by 1, 2;

-- 2. Tablas de `public` con RLS desactivada. Esperado: ninguna.
select c.relname
from pg_class c
where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity;

-- 3. Filas sin clínica en tablas que la exigen. Esperado: 0 en todas.
select 'pacientes' as tabla, count(*) from pacientes where tenant_id is null
union all select 'duenos', count(*) from duenos where tenant_id is null
union all select 'consultas', count(*) from consultas where tenant_id is null
union all select 'recetas', count(*) from recetas where tenant_id is null
union all select 'usuarios staff', count(*) from usuarios where rol <> 'cliente' and tenant_id is null;

-- 4. Reparto por clínica (en el ensayo sobre producción: todo en el tenant 1).
select t.slug, t.nombre,
  (select count(*) from pacientes p where p.tenant_id = t.id) as pacientes,
  (select count(*) from duenos d where d.tenant_id = t.id) as duenos,
  (select count(*) from consultas c where c.tenant_id = t.id) as consultas,
  (select count(*) from recetas r where r.tenant_id = t.id) as recetas,
  (select count(*) from vacunas v where v.tenant_id = t.id) as vacunas,
  (select count(*) from citas ci where ci.tenant_id = t.id) as citas,
  (select count(*) from examenes e where e.tenant_id = t.id) as examenes,
  (select count(*) from usuarios u where u.tenant_id = t.id) as staff
from tenants t
order by t.created_at;

-- 5. Correlativos frente al máximo usado. Esperado: ultimo >= maximo.
select tc.tenant_id, tc.tipo, tc.ultimo,
  case tc.tipo
    when 'ficha' then (select max(substring(numero_ficha from '\d+$')::int) from pacientes p where p.tenant_id = tc.tenant_id)
    else (select max(substring(numero_receta from '\d+$')::int) from recetas r where r.tenant_id = tc.tenant_id)
  end as maximo
from tenant_correlativos tc
order by 1, 2;

-- 6. Archivos fuera de la carpeta de una clínica existente (no basta con que
--    el primer segmento sea un UUID: las fotos usaban `<paciente_id>/...`). Esperado: 0 tras el script de Storage.
select bucket_id, count(*)
from storage.objects
where not exists (
    select 1 from public.tenants t where t.id::text = (storage.foldername(name))[1]
  )
  and name not like '%.emptyFolderPlaceholder'
group by 1;
