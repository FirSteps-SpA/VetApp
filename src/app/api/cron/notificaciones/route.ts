import { NextResponse, type NextRequest } from "next/server";

import { notificarDueno } from "@/lib/notificaciones/enviar";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatearFecha, formatearFechaHora } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

// Recordatorios: citas ~24h antes y vacunas próximas (30 días).
// Protegido por CRON_SECRET (Authorization: Bearer <secret>).
// Programar con Vercel Cron u otro scheduler apuntando a esta URL.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("no autorizado", { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  // --- Citas ~24h adelante (ventana 23–25h) ---
  const desde = new Date(now.getTime() + 23 * 3600_000).toISOString();
  const hasta = new Date(now.getTime() + 25 * 3600_000).toISOString();
  const { data: citas } = await admin
    .from("citas")
    .select("id, dueno_id, fecha_hora, pacientes(nombre)")
    .in("estado", ["pendiente", "confirmada"])
    .gte("fecha_hora", desde)
    .lt("fecha_hora", hasta);

  let citasNotif = 0;
  for (const c of (citas as unknown as {
    id: string;
    dueno_id: string | null;
    fecha_hora: string;
    pacientes: { nombre: string } | null;
  }[]) ?? []) {
    if (!c.dueno_id) continue;
    await notificarDueno(c.dueno_id, {
      tipo: "recordatorio_cita",
      titulo: "Recordatorio de cita",
      cuerpo: `Tienes una cita ${formatearFechaHora(c.fecha_hora)} para ${c.pacientes?.nombre ?? "tu mascota"}.`,
      url: "/portal/citas",
      referenciaTipo: "cita",
      referenciaId: c.id,
      preferencia: "citas",
    });
    citasNotif++;
  }

  // --- Vacunas próximas (proxima_dosis dentro de 30 días) ---
  const hoy = now.toISOString().slice(0, 10);
  const en30 = new Date(now.getTime() + 30 * 86400_000).toISOString().slice(0, 10);
  const { data: vacunas } = await admin
    .from("vacunas")
    .select("id, paciente_id, nombre_vacuna, proxima_dosis, pacientes(nombre)")
    .eq("estado_alerta", "proxima")
    .gte("proxima_dosis", hoy)
    .lte("proxima_dosis", en30);

  let vacunasNotif = 0;
  for (const v of (vacunas as unknown as {
    id: string;
    paciente_id: string;
    nombre_vacuna: string;
    proxima_dosis: string;
    pacientes: { nombre: string } | null;
  }[]) ?? []) {
    const { data: link } = await admin
      .from("paciente_duenos")
      .select("dueno_id")
      .eq("paciente_id", v.paciente_id)
      .eq("es_principal", true)
      .maybeSingle();
    if (!link?.dueno_id) continue;
    await notificarDueno(link.dueno_id as string, {
      tipo: "recordatorio_vacuna",
      titulo: "Recordatorio de vacuna",
      cuerpo: `${v.pacientes?.nombre ?? "Tu mascota"}: ${v.nombre_vacuna} vence el ${formatearFecha(v.proxima_dosis)}.`,
      url: "/portal",
      referenciaTipo: "vacuna",
      referenciaId: v.id,
      preferencia: "vacunas",
    });
    vacunasNotif++;
  }

  return NextResponse.json({ ok: true, citas: citasNotif, vacunas: vacunasNotif });
}
