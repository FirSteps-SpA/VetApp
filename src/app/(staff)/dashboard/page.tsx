import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Resumen del día. Las alertas de agenda y vacunas se incorporan en la
        Fase 6.
      </p>

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
    </div>
  );
}
