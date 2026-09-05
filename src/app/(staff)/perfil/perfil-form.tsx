"use client";

import { useFormState, useFormStatus } from "react-dom";

import { TITULOS_PROFESIONALES, type Usuario } from "@/lib/types/db";

import { actualizarMiPerfil, type PerfilState } from "./actions";

const field =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const label = "flex flex-col gap-1 text-sm font-medium text-slate-700";

const initialState: PerfilState = { error: null, ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar"}
    </button>
  );
}

export function PerfilForm({ perfil }: { perfil: Usuario }) {
  const [state, formAction] = useFormState(actualizarMiPerfil, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <div className={label}>
          Nombre
          <p className="px-3 py-2 text-base text-slate-500">{perfil.nombre}</p>
        </div>
        <div className={label}>
          Rol
          <p className="px-3 py-2 text-base text-slate-500">{perfil.rol}</p>
        </div>
        <label className={label}>
          RUT profesional
          <input
            name="rut"
            defaultValue={perfil.rut ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Título profesional
          <select
            name="titulo_profesional"
            defaultValue={perfil.titulo_profesional ?? ""}
            className={field}
          >
            <option value="">Sin especificar</option>
            {TITULOS_PROFESIONALES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-slate-500">
        El RUT y el título se usan para autollenar los datos del veterinario a
        cargo en autorizaciones y certificados.
      </p>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">
          Perfil guardado.
        </p>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
