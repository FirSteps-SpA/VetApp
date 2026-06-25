-- VetApp — Schema base (Fase I, con estructura multi-sucursal anticipada)
-- Identificadores en ASCII: `duenos`/`dueno_id` en lugar de `dueños`/`dueño_id`
-- para evitar comillas dobles obligatorias y problemas con PostgREST.

-- gen_random_uuid() está disponible en el core de PostgreSQL (Supabase lo habilita).

-- =========================================================================
-- Sucursales (multi-sucursal anticipada — ver sección 10.3 de la arquitectura)
-- =========================================================================
create table sucursales (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  direccion   text,
  telefono    text,
  email       text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =========================================================================
-- Usuarios (extiende auth.users)
-- =========================================================================
create table usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  email       text not null unique,
  rol         text not null check (rol in ('dev','veterinario','recepcionista','cliente')),
  sucursal_id uuid references sucursales(id),          -- nullable: multi-sucursal anticipada
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =========================================================================
-- Dueños
-- =========================================================================
create table duenos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  telefono    text not null,
  email       text unique,
  direccion   text,
  usuario_id  uuid unique references usuarios(id),      -- nullable: vínculo a portal (Fase II)
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =========================================================================
-- Pacientes
-- =========================================================================
create table pacientes (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  especie          text not null check (especie in ('perro','gato','conejo','ave','reptil','otro')),
  raza             text,
  fecha_nacimiento date,
  sexo             text check (sexo in ('macho','hembra','desconocido')),
  castrado         boolean default false,
  peso_kg          numeric(5,2),
  foto_url         text,
  numero_ficha     text not null unique,                -- generado por trigger (PAC-00001)
  activo           boolean not null default true,
  notas            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_pacientes_nombre on pacientes (nombre);
create index idx_pacientes_activos on pacientes (activo) where activo;

-- =========================================================================
-- Paciente ↔ Dueño (N:M)
-- =========================================================================
create table paciente_duenos (
  paciente_id  uuid not null references pacientes(id) on delete cascade,
  dueno_id     uuid not null references duenos(id) on delete cascade,
  es_principal boolean not null default false,
  created_at   timestamptz not null default now(),
  primary key (paciente_id, dueno_id)
);

-- Solo un dueño principal por paciente.
create unique index idx_paciente_principal on paciente_duenos (paciente_id) where es_principal;
create index idx_paciente_duenos_dueno on paciente_duenos (dueno_id);

-- =========================================================================
-- Consultas
-- =========================================================================
create table consultas (
  id                       uuid primary key default gen_random_uuid(),
  paciente_id              uuid not null references pacientes(id),
  veterinario_id           uuid not null references usuarios(id),
  cita_id                  uuid,                          -- FK a citas (se agrega al final, ref circular)
  fecha                    timestamptz not null default now(),
  tipo                     text not null default 'consulta'
                             check (tipo in ('consulta','control','cirugia','urgencia','vacunacion')),
  motivo                   text not null,
  anamnesis                text,
  examen_fisico            text,
  diagnostico              text not null,
  diagnostico_diferencial  text,
  tratamiento              text not null,
  peso_kg                  numeric(5,2),
  temperatura_c            numeric(4,1),
  notas                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index idx_consultas_paciente_fecha on consultas (paciente_id, fecha desc);
create index idx_consultas_vet_fecha on consultas (veterinario_id, fecha);
create index idx_consultas_cita on consultas (cita_id) where cita_id is not null;

-- =========================================================================
-- Recetas
-- =========================================================================
create table recetas (
  id                      uuid primary key default gen_random_uuid(),
  consulta_id             uuid not null references consultas(id),
  paciente_id             uuid not null references pacientes(id),
  veterinario_id          uuid not null references usuarios(id),
  numero_receta           text not null unique,           -- generado por trigger (REC-00001)
  fecha                   timestamptz not null default now(),
  medicamentos            jsonb not null,
  instrucciones_generales text,
  vigente                 boolean not null default true,
  pdf_url                 text,
  created_at              timestamptz not null default now()
);

create index idx_recetas_paciente on recetas (paciente_id, fecha desc);
create index idx_recetas_consulta on recetas (consulta_id);

-- =========================================================================
-- Exámenes (archivos adjuntos)
-- =========================================================================
create table examenes (
  id                     uuid primary key default gen_random_uuid(),
  paciente_id            uuid not null references pacientes(id),
  consulta_id            uuid references consultas(id),    -- nullable: adjunto directo a la ficha
  tipo                   text not null
                           check (tipo in ('hemograma','radiografia','ecografia','biopsia','cultivo','foto','otro')),
  nombre                 text not null,
  descripcion            text,
  archivo_url            text,
  archivo_nombre         text,
  archivo_tipo           text,
  archivo_tamanio_bytes  integer,
  interno                boolean not null default false,   -- true = no visible para clientes (Fase II)
  fecha                  date not null,
  created_at             timestamptz not null default now()
);

create index idx_examenes_paciente_fecha on examenes (paciente_id, fecha desc);
create index idx_examenes_consulta on examenes (consulta_id) where consulta_id is not null;
create index idx_examenes_tipo on examenes (tipo);

-- =========================================================================
-- Vacunas
-- =========================================================================
create table vacunas (
  id              uuid primary key default gen_random_uuid(),
  paciente_id     uuid not null references pacientes(id),
  consulta_id     uuid references consultas(id),
  veterinario_id  uuid not null references usuarios(id),
  nombre_vacuna   text not null,
  laboratorio     text,
  lote            text,
  fecha_aplicacion date not null,
  proxima_dosis   date,
  estado_alerta   text default 'al_dia' check (estado_alerta in ('al_dia','proxima','vencida')),
  notas           text,
  created_at      timestamptz not null default now()
);

create index idx_vacunas_paciente on vacunas (paciente_id, fecha_aplicacion desc);
create index idx_vacunas_estado on vacunas (estado_alerta) where estado_alerta <> 'al_dia';

-- =========================================================================
-- Esquemas de vacunación (configurable)
-- =========================================================================
create table esquemas_vacunacion (
  id             uuid primary key default gen_random_uuid(),
  especie        text not null,
  nombre_vacuna  text not null,
  intervalo_dias integer not null,
  es_obligatoria boolean default false,
  descripcion    text,
  activo         boolean default true
);

-- =========================================================================
-- Citas (agenda) — lleva sucursal_id (entidad operativa)
-- =========================================================================
create table citas (
  id                  uuid primary key default gen_random_uuid(),
  paciente_id         uuid not null references pacientes(id),
  dueno_id            uuid references duenos(id),
  veterinario_id      uuid not null references usuarios(id),
  sucursal_id         uuid references sucursales(id),     -- nullable: multi-sucursal anticipada
  fecha_hora          timestamptz not null,
  duracion_minutos    integer not null default 30,
  motivo              text not null,
  estado              text not null default 'pendiente'
                        check (estado in ('pendiente','confirmada','en_consulta','realizada','cancelada','no_asistio')),
  notas               text,
  notas_cliente       text,
  creado_por_cliente  boolean default false,
  consulta_id         uuid,                                -- FK a consultas (se agrega al final)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_citas_vet_fecha on citas (veterinario_id, fecha_hora);
create index idx_citas_paciente on citas (paciente_id, fecha_hora desc);
create index idx_citas_estado on citas (estado, fecha_hora);
create index idx_citas_sucursal on citas (sucursal_id, fecha_hora);

-- =========================================================================
-- Configuración de la clínica (fila única)
-- =========================================================================
create table clinica_config (
  id              integer primary key default 1 check (id = 1),
  nombre_clinica  text not null,
  direccion       text,
  telefono        text,
  email           text,
  logo_url        text,
  numero_registro text,
  ciudad          text,
  updated_at      timestamptz not null default now()
);

-- =========================================================================
-- Audit log (escrito solo por triggers SECURITY DEFINER)
-- =========================================================================
create table audit_log (
  id                bigserial primary key,
  tabla             text not null,
  registro_id       uuid not null,
  operacion         text not null check (operacion in ('INSERT','UPDATE','DELETE')),
  usuario_id        uuid references usuarios(id),
  datos_anteriores  jsonb,
  datos_nuevos      jsonb,
  created_at        timestamptz not null default now()
);

-- =========================================================================
-- FKs circulares consultas ↔ citas (ambas nullable)
-- =========================================================================
alter table consultas
  add constraint consultas_cita_id_fkey foreign key (cita_id) references citas(id);
alter table citas
  add constraint citas_consulta_id_fkey foreign key (consulta_id) references consultas(id);
