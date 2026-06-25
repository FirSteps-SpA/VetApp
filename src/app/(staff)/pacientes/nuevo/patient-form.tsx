"use client";

import { useFormState, useFormStatus } from "react-dom";

import { ESPECIES, SEXOS } from "@/lib/types/db";

import { crearPaciente, type FormState } from "./actions";

const initialState: FormState = { error: null };

const fieldClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const labelClass = "flex flex-col gap-1 text-sm font-medium text-slate-700";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Registrar paciente"}
    </button>
  );
}

export function PatientForm() {
  const [state, formAction] = useFormState(crearPaciente, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">
          Dueño
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Nombre *
            <input name="dueno_nombre" required className={fieldClass} />
          </label>
          <label className={labelClass}>
            Teléfono *
            <input
              name="dueno_telefono"
              required
              inputMode="tel"
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Email
            <input name="dueno_email" type="email" className={fieldClass} />
          </label>
          <label className={labelClass}>
            Dirección
            <input name="dueno_direccion" className={fieldClass} />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">
          Paciente
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Nombre *
            <input name="nombre" required className={fieldClass} />
          </label>
          <label className={labelClass}>
            Especie *
            <select name="especie" required defaultValue="" className={fieldClass}>
              <option value="" disabled>
                Seleccionar…
              </option>
              {ESPECIES.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Raza
            <input name="raza" className={fieldClass} />
          </label>
          <label className={labelClass}>
            Fecha de nacimiento
            <input
              name="fecha_nacimiento"
              type="date"
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Sexo
            <select name="sexo" defaultValue="" className={fieldClass}>
              <option value="">Sin especificar</option>
              {SEXOS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Peso (kg)
            <input
              name="peso_kg"
              type="number"
              step="0.01"
              min="0"
              className={fieldClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input name="castrado" type="checkbox" className="h-4 w-4" />
            Castrado / esterilizado
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Notas
            <textarea name="notas" rows={3} className={fieldClass} />
          </label>
        </div>
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
