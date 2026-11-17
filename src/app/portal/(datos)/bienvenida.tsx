"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { marcarBienvenidaVista } from "./bienvenida-actions";

// Bienvenida del primer ingreso al portal (spec 8). Al cerrarla queda marcada
// en la cuenta, así que no vuelve en otro dispositivo.
export function Bienvenida({ nombre }: { nombre: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <section className="rounded-card border border-accent bg-accent-subtle p-4">
      <h2 className="mb-2 text-lg font-semibold text-text">¡Bienvenido{nombre ? `, ${nombre}` : ""}!</h2>
      <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-text">
        <li>Mira a tus mascotas, sus vacunas y descarga su historial y recetas.</li>
        <li>Solicita horas y cancélalas dentro del plazo de la clínica.</li>
        <li>Recibe recordatorios de citas y vacunas por correo o en el celular.</li>
        <li>Revisa el aviso de privacidad y descarga tus datos cuando quieras.</li>
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await marcarBienvenidaVista();
              router.refresh();
            })
          }
          className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-60"
        >
          Entendido
        </button>
        <Link href="/portal/ayuda" className="text-sm font-medium text-accent hover:underline">
          Ver la ayuda
        </Link>
      </div>
    </section>
  );
}
