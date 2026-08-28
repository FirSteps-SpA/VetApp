-- VetApp — Autorizaciones y certificados: traza de documentos emitidos
-- =========================================================================
-- Registro de cada documento legal/certificado generado desde la ficha
-- (eutanasia, cirugía, hospitalización, microchip). No se guarda el PDF: el
-- documento firmado en papel es el artefacto legal; aquí solo queda la traza
-- (quién, cuándo, sobre qué paciente/dueño) y un snapshot de los campos usados.
-- =========================================================================
create table documentos_emitidos (
  id          uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id) on delete cascade,
  dueno_id    uuid references duenos(id) on delete set null,
  tipo        text not null check (tipo in ('eutanasia', 'cirugia', 'hospitalizacion', 'microchip')),
  emitido_por uuid references usuarios(id) on delete set null,
  emitido_en  timestamptz not null default now(),
  datos       jsonb not null default '{}'::jsonb
);

create index idx_docemit_paciente on documentos_emitidos (paciente_id, emitido_en desc);

alter table documentos_emitidos enable row level security;

-- Solo staff: ver y registrar emisiones. El registro lo inserta el servidor
-- con el usuario staff autenticado.
create policy docemit_select on documentos_emitidos for select to authenticated
  using (public.is_staff());
create policy docemit_insert on documentos_emitidos for insert to authenticated
  with check (public.is_staff());
