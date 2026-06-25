import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getRol } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defensa en profundidad: el middleware ya protege la ruta, pero validamos aquí también.
  if (!user) redirect("/login");

  const rol = getRol(user);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            {user.email} · rol: {rol ?? "—"}
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Fase 1 — Fundación. Los módulos de pacientes, consultas, agenda y vacunas
        se incorporan en las siguientes fases.
      </section>
    </main>
  );
}
