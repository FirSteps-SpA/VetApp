-- VetApp — Fase 3: el peso registrado en una consulta actualiza el del paciente.
-- Se dispara solo al crear la consulta (no al editar una histórica), de modo que
-- pacientes.peso_kg refleja el último peso registrado.

create or replace function public.set_peso_paciente()
returns trigger language plpgsql as $$
begin
  if new.peso_kg is not null then
    update pacientes
    set peso_kg = new.peso_kg
    where id = new.paciente_id;
  end if;
  return new;
end;
$$;

create trigger trg_consulta_peso after insert on consultas
  for each row execute function public.set_peso_paciente();
