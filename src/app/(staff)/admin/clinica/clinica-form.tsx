"use client";

import { useFormState, useFormStatus } from "react-dom";

import type { ClinicaConfig } from "@/lib/types/db";

import { guardarClinica } from "./actions";

const field =
  "rounded-control border border-border bg-surface px-3 py-2 text-base text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";
const label = "flex flex-col gap-1 text-sm font-medium text-text";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar datos"}
    </button>
  );
}

export function ClinicaForm({ config }: { config: ClinicaConfig }) {
  const [state, action] = useFormState(guardarClinica, { error: null });

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          Nombre de la clínica *
          <input
            name="nombre_clinica"
            required
            defaultValue={config.nombre_clinica}
            className={field}
          />
        </label>
        <label className={label}>
          Slug (entrada: /c/&lt;slug&gt;/login) *
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            defaultValue={config.slug}
            className={field}
          />
          <span className="text-xs font-normal text-text-muted">
            Cambiarlo invalida los enlaces de entrada e invitación anteriores.
          </span>
        </label>
        <label className={label}>
          Número de registro
          <input
            name="numero_registro"
            defaultValue={config.numero_registro ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Dirección
          <input
            name="direccion"
            defaultValue={config.direccion ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Ciudad
          <input
            name="ciudad"
            defaultValue={config.ciudad ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Teléfono
          <input
            name="telefono"
            defaultValue={config.telefono ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Email
          <input
            name="email"
            type="email"
            defaultValue={config.email ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Plazo de cancelación en el portal (horas)
          <input
            name="horas_cancelacion"
            type="number"
            min={0}
            max={168}
            required
            defaultValue={config.horas_cancelacion}
            className={field}
          />
          <span className="text-xs font-normal text-text-muted">
            Los dueños pueden cancelar sus horas hasta este número de horas antes (0 a 168).
          </span>
        </label>
      </div>

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
