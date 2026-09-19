"use client";

import { useFormState, useFormStatus } from "react-dom";

import { TITULOS_PROFESIONALES, type Usuario } from "@/lib/types/db";

import { actualizarMiPerfil, type PerfilState } from "./actions";

const field =
  "rounded-control border border-border bg-surface px-3 py-2 text-base text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";
const label = "flex flex-col gap-1 text-sm font-medium text-text";

const initialState: PerfilState = { error: null, ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent transition-colors hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar"}
    </button>
  );
}

export function PerfilForm({ perfil }: { perfil: Usuario }) {
  const [state, formAction] = useFormState(actualizarMiPerfil, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2">
        <div className={label}>
          Nombre
          <p className="px-3 py-2 text-base text-text-muted">{perfil.nombre}</p>
        </div>
        <div className={label}>
          Rol
          <p className="px-3 py-2 text-base text-text-muted">{perfil.rol}</p>
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

      <p className="text-xs text-text-muted">
        El RUT y el título se usan para autollenar los datos del veterinario a
        cargo en autorizaciones y certificados.
      </p>

      {state.error && (
        <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-control bg-accent-subtle px-3 py-2 text-sm text-accent">
          Perfil guardado.
        </p>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
