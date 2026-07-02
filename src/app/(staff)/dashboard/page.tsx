import Link from "next/link";
import type { Metadata } from "next";

import { getAlertasVacunas } from "@/lib/data/vacunas";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const alertas = await getAlertasVacunas();
  const vencidas = alertas.filter((a) => a.estado_alerta === "vencida").length;
  const proximas = alertas.filter((a) => a.estado_alerta === "proxima").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Resumen del día.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/pacientes"
          className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300"
        >
          <h2 className="font-medium text-slate-900">Pacientes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Buscar, registrar y abrir la ficha clínica.
          </p>
        </Link>

        <Link
          href="/pacientes/nuevo"
          className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300"
        >
          <h2 className="font-medium text-slate-900">Nuevo paciente</h2>
          <p className="mt-1 text-sm text-slate-500">
            Alta de mascota y dueño en un solo flujo.
          </p>
        </Link>
      </div>

      <Link
        href="/vacunas"
        className="mt-4 flex items-center gap-6 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300"
      >
        <div>
          <p className="text-2xl font-semibold text-red-700">{vencidas}</p>
          <p className="text-xs text-slate-500">vacunas vencidas</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-amber-700">{proximas}</p>
          <p className="text-xs text-slate-500">próximas (30 días)</p>
        </div>
        <span className="ml-auto text-sm text-teal-700">Ver vacunas →</span>
      </Link>
    </div>
  );
}
