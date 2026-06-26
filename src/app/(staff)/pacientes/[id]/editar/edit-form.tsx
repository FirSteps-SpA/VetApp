"use client";

import { useFormState, useFormStatus } from "react-dom";

import { ESPECIES, SEXOS, type Paciente } from "@/lib/types/db";

import { actualizarPaciente, type EditarPacienteState } from "../actions";

const field =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const label = "flex flex-col gap-1 text-sm font-medium text-slate-700";

const initialState: EditarPacienteState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
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
      <fieldset className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
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
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            name="castrado"
            type="checkbox"
            defaultChecked={paciente.castrado ?? false}
            className="h-4 w-4"
          />
          Castrado / esterilizado
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
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
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
