-- VetApp — El portal deja de leer tablas clínicas directamente (auditoría #5 y #6)
--
-- #5: RLS filtra filas, no columnas. Un cliente leía por la API (o recibía en el
--     navegador) columnas internas de sus propias filas: consultas.anamnesis,
--     examen_fisico, diagnostico_diferencial, notas; pacientes.notas;
--     duenos.notas (notas del staff sobre el propio dueño); citas.notas;
--     vacunas.notas. Ahora el rol `cliente` no tiene SELECT directo sobre esas
--     tablas: el portal usa funciones `portal_*` que devuelven solo las columnas
--     permitidas y solo de sus mascotas.
-- #6: el cliente podía actualizar cualquier columna de sus citas (confirmarlas,
--     reagendarlas, cambiar veterinario) e insertarlas con cualquier estado. Las
--     solicitudes del portal se crean en el servidor (service_role), así que se
--     elimina la escritura directa del cliente sobre `citas` y `duenos`.
--
-- `recetas` (solo vigentes) y `examenes` (solo no internos) mantienen su lectura
-- directa: no tienen columnas internas.

-- ---------------------------------------------------------------------------
-- Helper: ¿el dueño pertenece al usuario autenticado? (sin depender de la RLS
-- de `duenos`, que ya no permite leer al cliente)
-- ---------------------------------------------------------------------------
create or replace function public.es_mi_dueno(p_dueno uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from duenos d where d.id = p_dueno and d.usuario_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- RLS: el cliente pierde el acceso directo
-- ---------------------------------------------------------------------------
drop policy duenos_select on duenos;
create policy duenos_select on duenos for select to authenticated
  using (public.is_staff());
drop policy duenos_update on duenos;
create policy duenos_update on duenos for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy pacientes_select on pacientes;
create policy pacientes_select on pacientes for select to authenticated
  using (public.is_staff());

drop policy consultas_select on consultas;
create policy consultas_select on consultas for select to authenticated
  using (public.is_clinico());

drop policy vacunas_select on vacunas;
create policy vacunas_select on vacunas for select to authenticated
  using (public.is_clinico());

drop policy citas_select on citas;
create policy citas_select on citas for select to authenticated
  using (
    public.current_rol() in ('dev','veterinario')
    or (
      public.current_rol() = 'recepcionista'
      and (
        public.current_sucursal_id() is null
        or sucursal_id is null
        or sucursal_id = public.current_sucursal_id()
      )
    )
  );
drop policy citas_insert on citas;
create policy citas_insert on citas for insert to authenticated
  with check (public.is_staff());
drop policy citas_update on citas;
create policy citas_update on citas for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Políticas que consultaban `duenos` bajo la RLS del cliente.
drop policy paciente_duenos_select on paciente_duenos;
create policy paciente_duenos_select on paciente_duenos for select to authenticated
  using (public.is_staff() or public.es_mi_dueno(dueno_id));

drop policy notif_config_select on notificaciones_config;
create policy notif_config_select on notificaciones_config for select to authenticated
  using (public.is_staff() or public.es_mi_dueno(dueno_id));
drop policy notif_config_upsert on notificaciones_config;
create policy notif_config_upsert on notificaciones_config for all to authenticated
  using (public.es_mi_dueno(dueno_id))
  with check (public.es_mi_dueno(dueno_id));

-- ---------------------------------------------------------------------------
-- Lecturas del portal: solo columnas permitidas, solo del cliente autenticado
-- ---------------------------------------------------------------------------
create or replace function public.portal_mi_dueno()
returns table (
  id uuid, nombre text, rut text, telefono text, email text,
  direccion text, comuna text, sector text
)
language sql stable security definer set search_path = public as $$
  select d.id, d.nombre, d.rut, d.telefono, d.email, d.direccion, d.comuna, d.sector
  from duenos d
  where d.usuario_id = auth.uid();
$$;

create or replace function public.portal_mascotas()
returns table (
  id uuid, nombre text, especie text, raza text, fecha_nacimiento date,
  sexo text, peso_kg numeric, numero_ficha text, foto_url text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.nombre, p.especie, p.raza, p.fecha_nacimiento,
         p.sexo, p.peso_kg, p.numero_ficha, p.foto_url
  from pacientes p
  where public.cliente_owns_paciente(p.id)
  order by p.nombre;
$$;

create or replace function public.portal_consultas(p_paciente uuid)
returns table (id uuid, fecha timestamptz, tipo text, diagnostico text, tratamiento text)
language sql stable security definer set search_path = public as $$
  select c.id, c.fecha, c.tipo, c.diagnostico, c.tratamiento
  from consultas c
  where c.paciente_id = p_paciente and public.cliente_owns_paciente(p_paciente)
  order by c.fecha desc;
$$;

create or replace function public.portal_vacunas(p_paciente uuid)
returns table (
  id uuid, nombre_vacuna text, fecha_aplicacion date,
  proxima_dosis date, estado_alerta text
)
language sql stable security definer set search_path = public as $$
  select v.id, v.nombre_vacuna, v.fecha_aplicacion, v.proxima_dosis, v.estado_alerta
  from vacunas v
  where v.paciente_id = p_paciente and public.cliente_owns_paciente(p_paciente)
  order by v.fecha_aplicacion desc;
$$;

create or replace function public.portal_citas()
returns table (id uuid, fecha_hora timestamptz, motivo text, estado text, paciente_nombre text)
language sql stable security definer set search_path = public as $$
  select c.id, c.fecha_hora, c.motivo, c.estado, p.nombre
  from citas c
  join pacientes p on p.id = c.paciente_id
  where public.cliente_owns_paciente(c.paciente_id)
  order by c.fecha_hora desc;
$$;

-- Solo usuarios autenticados (anon no).
revoke execute on function
  public.es_mi_dueno(uuid), public.portal_mi_dueno(), public.portal_mascotas(),
  public.portal_consultas(uuid), public.portal_vacunas(uuid), public.portal_citas()
  from public, anon;
grant execute on function
  public.es_mi_dueno(uuid), public.portal_mi_dueno(), public.portal_mascotas(),
  public.portal_consultas(uuid), public.portal_vacunas(uuid), public.portal_citas()
  to authenticated;
