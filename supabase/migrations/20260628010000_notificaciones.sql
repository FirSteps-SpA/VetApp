-- VetApp — Fase 8: reservas y notificaciones

-- =========================================================================
-- Suscripciones Web Push (una por dispositivo/navegador del usuario)
-- =========================================================================
create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index idx_push_usuario on push_subscriptions (usuario_id);

alter table push_subscriptions enable row level security;

create policy push_select on push_subscriptions for select to authenticated
  using (usuario_id = auth.uid() or public.current_rol() = 'dev');
create policy push_insert on push_subscriptions for insert to authenticated
  with check (usuario_id = auth.uid());
create policy push_delete on push_subscriptions for delete to authenticated
  using (usuario_id = auth.uid());

-- =========================================================================
-- Preferencias de notificación por dueño (opt-in/out por tipo y canal)
-- =========================================================================
create table notificaciones_config (
  dueno_id             uuid primary key references duenos(id) on delete cascade,
  recordatorio_citas   boolean not null default true,
  recordatorio_vacunas boolean not null default true,
  canal_email          boolean not null default true,
  canal_push           boolean not null default true,
  updated_at           timestamptz not null default now()
);

alter table notificaciones_config enable row level security;

create policy notif_config_select on notificaciones_config for select to authenticated
  using (
    public.is_staff()
    or exists (select 1 from duenos d where d.id = dueno_id and d.usuario_id = auth.uid())
  );
create policy notif_config_upsert on notificaciones_config for all to authenticated
  using (exists (select 1 from duenos d where d.id = dueno_id and d.usuario_id = auth.uid()))
  with check (exists (select 1 from duenos d where d.id = dueno_id and d.usuario_id = auth.uid()));

create trigger trg_notif_config_updated before update on notificaciones_config
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Notificaciones (bandeja in-app + registro de envíos)
-- =========================================================================
create table notificaciones (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid not null references usuarios(id) on delete cascade,
  tipo            text not null,
  titulo          text not null,
  cuerpo          text,
  url             text,
  referencia_tipo text,
  referencia_id   uuid,
  leida           boolean not null default false,
  created_at      timestamptz not null default now()
);

create index idx_notif_usuario on notificaciones (usuario_id, created_at desc);

-- Dedup de recordatorios: una notificación por (usuario, tipo, referencia).
create unique index idx_notif_dedup
  on notificaciones (usuario_id, tipo, referencia_id)
  where referencia_id is not null;

alter table notificaciones enable row level security;

create policy notif_select on notificaciones for select to authenticated
  using (usuario_id = auth.uid() or public.current_rol() = 'dev');
create policy notif_update on notificaciones for update to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());
-- INSERT lo hace el servidor con service_role (bypassa RLS); sin política de insert.
