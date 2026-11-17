"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";

import { cambiarActivo, cambiarClinicaActiva, crearClinica } from "./actions";

const field =
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-base text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";
const label = "flex flex-col gap-1 text-sm font-medium text-text";
const boton =
  "rounded-control border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-sunken disabled:opacity-60";

export function CrearClinicaForm() {
  const [state, action] = useFormState(crearClinica, { error: null });
  return (
    <form action={action} className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2">
      <label className={label}>
        Nombre *
        <input name="nombre" required className={field} />
      </label>
      <label className={label}>
        Slug * (URL de entrada)
        <input name="slug" required placeholder="pradera" pattern="[a-z0-9-]+" className={field} />
      </label>
      <label className={label}>
        Sucursal inicial
        <input name="sucursal" placeholder="Principal" className={field} />
      </label>
      <label className={label}>
        N° de registro
        <input name="numero_registro" className={field} />
      </label>
      <label className={label}>
        Dirección
        <input name="direccion" className={field} />
      </label>
      <label className={label}>
        Ciudad
        <input name="ciudad" className={field} />
      </label>
      <label className={label}>
        Teléfono
        <input name="telefono" className={field} />
      </label>
      <label className={label}>
        Email
        <input name="email" type="email" className={field} />
      </label>
      {state.error && (
        <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text sm:col-span-2">
          {state.error}
        </p>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent hover:opacity-90"
        >
          Crear clínica
        </button>
      </div>
    </form>
  );
}

export function UsarClinicaButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await cambiarClinicaActiva(id);
            if (r?.error) setError(r.error);
          })
        }
        className={boton}
      >
        {pending ? "Cambiando…" : "Usar como activa"}
      </button>
      {error && <span className="text-sm text-danger">{error}</span>}
    </>
  );
}

export function ClinicaActivaToggle({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (activo && !window.confirm("¿Desactivar la clínica? Su staff y sus dueños dejarán de poder entrar.")) {
            return;
          }
          await cambiarActivo(id, !activo);
          router.refresh();
        })
      }
      className={boton}
    >
      {activo ? "Desactivar" : "Reactivar"}
    </button>
  );
}
