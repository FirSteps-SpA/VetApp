import type { Metadata } from "next";

import { getSolicitudes } from "@/lib/data/citas";

import { SolicitudesConTabs } from "./solicitudes-con-tabs";

export const metadata: Metadata = {
  title: "Reservas",
};

export default async function ReservasPage() {
  const solicitudes = await getSolicitudes();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-page font-semibold text-text">
        Solicitudes de hora
      </h1>
      <p className="text-body text-text-muted">
        Solicitudes de hora hechas por clientes desde el portal.
      </p>

      <SolicitudesConTabs solicitudes={solicitudes} />
    </div>
  );
}
