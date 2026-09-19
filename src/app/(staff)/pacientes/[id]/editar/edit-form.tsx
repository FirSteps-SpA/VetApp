"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  ESPECIES,
  MODOS_OBTENCION,
  RAZONES_TENENCIA,
  SEXOS,
  type Paciente,
} from "@/lib/types/db";

import { actualizarPaciente, type EditarPacienteState } from "../actions";

const field =
  "rounded-control border border-border bg-surface px-3 py-2 text-base text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";
const label = "flex flex-col gap-1 text-sm font-medium text-text";

const initialState: EditarPacienteState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent transition-colors hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

export function EditForm({ paciente }: { paciente: Paciente }) {
  const action = actualizarPaciente.bind(null, paciente.id);
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2">
        <label className={label}>
          Nombre *
          <input
            name="nombre"
            required
            defaultValue={paciente.nombre}
            className={field}
          />
        </label>
        <label className={label}>
          RUT
          <input name="rut" defaultValue={paciente.rut ?? ""} className={field} />
        </label>
        <label className={label}>
          Especie *
          <select
            name="especie"
            required
            defaultValue={paciente.especie}
            className={field}
          >
            {ESPECIES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Raza
          <input
            name="raza"
            defaultValue={paciente.raza ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Color
          <input
            name="color"
            defaultValue={paciente.color ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Modo de obtención
          <select
            name="modo_obtencion"
            defaultValue={paciente.modo_obtencion ?? ""}
            className={field}
          >
            <option value="">Sin especificar</option>
            {MODOS_OBTENCION.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Razón de tenencia
          <select
            name="razon_tenencia"
            defaultValue={paciente.razon_tenencia ?? ""}
            className={field}
          >
            <option value="">Sin especificar</option>
            {RAZONES_TENENCIA.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Fecha de nacimiento
          <input
            name="fecha_nacimiento"
            type="date"
            defaultValue={paciente.fecha_nacimiento ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Sexo
          <select
            name="sexo"
            defaultValue={paciente.sexo ?? ""}
            className={field}
          >
            <option value="">Sin especificar</option>
            {SEXOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Peso (kg)
          <input
            name="peso_kg"
            type="number"
            step="0.01"
            min="0"
            defaultValue={paciente.peso_kg ?? ""}
            className={field}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-text">
          <input
            name="castrado"
            type="checkbox"
            defaultChecked={paciente.castrado ?? false}
            className="h-4 w-4"
          />
          Castrado / esterilizado
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-text">
          <input
            name="activo"
            type="checkbox"
            defaultChecked={paciente.activo}
            className="h-4 w-4"
          />
          Activo (desmarcar para archivar)
        </label>
        <label className={`${label} sm:col-span-2`}>
          Notas
          <textarea
            name="notas"
            rows={3}
            defaultValue={paciente.notas ?? ""}
            className={field}
          />
        </label>
      </fieldset>

      {state.error && (
        <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
