import Link from "next/link";
import type { Metadata } from "next";

import { countSolicitudesPendientes, getCitasRango } from "@/lib/data/citas";
import { getAlertasVacunas } from "@/lib/data/vacunas";

export const metadata: Metadata = {
  title: "Dashboard",
};

function StatTile({
  href,
  valor,
  label,
  tono = "text",
}: {
  href: string;
  valor: number;
  label: string;
  tono?: "text" | "danger" | "warning";
}) {
  const valorClass =
    tono === "danger"
      ? "text-danger"
      : tono === "warning"
        ? "text-warning"
        : "text-text";
  return (
    <Link
      href={href}
      className="rounded-card border border-border bg-surface p-4 transition-colors hover:border-accent"
    >
      <p className={`text-page font-semibold tabular-nums ${valorClass}`}>
        {valor}
      </p>
      <p className="mt-0.5 text-support text-text-muted">{label}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const [alertas, reservasPendientes, citasHoy] = await Promise.all([
    getAlertasVacunas(),
    countSolicitudesPendientes(),
    getCitasRango(hoy.toISOString(), manana.toISOString()),
  ]);
  const vencidas = alertas.filter((a) => a.estado_alerta === "vencida").length;
  const proximas = alertas.filter((a) => a.estado_alerta === "proxima").length;

  return (
    <div>
      <h1 className="text-page font-semibold text-text">Dashboard</h1>
      <p className="mt-1 text-body text-text-muted">Resumen del día.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 desktop:grid-cols-4">
        <StatTile
          href="/agenda"
          valor={citasHoy.length}
          label="citas hoy"
        />
        <StatTile
          href="/reservas"
          valor={reservasPendientes}
          label="reservas pendientes"
          tono={reservasPendientes > 0 ? "warning" : "text"}
        />
        <StatTile
          href="/vacunas"
          valor={vencidas}
          label="vacunas vencidas"
          tono={vencidas > 0 ? "danger" : "text"}
        />
        <StatTile
          href="/vacunas"
          valor={proximas}
          label="vacunas próximas (30 días)"
          tono={proximas > 0 ? "warning" : "text"}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link
          href="/pacientes"
          className="rounded-card border border-border bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="font-medium text-text">Pacientes</h2>
          <p className="mt-1 text-body text-text-muted">
            Buscar, registrar y abrir la ficha clínica.
          </p>
        </Link>

        <Link
          href="/pacientes/nuevo"
          className="rounded-card border border-border bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="font-medium text-text">Nuevo paciente</h2>
          <p className="mt-1 text-body text-text-muted">
            Alta de mascota y dueño en un solo flujo.
          </p>
        </Link>
      </div>
    </div>
  );
}
