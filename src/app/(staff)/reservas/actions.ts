"use server";

import { revalidatePath } from "next/cache";

import { notificarDueno } from "@/lib/notificaciones/enviar";
import { createClient } from "@/lib/supabase/server";
import { formatearFechaHora } from "@/lib/utils/format";

async function getCita(citaId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("citas")
    .select("id, paciente_id, dueno_id, fecha_hora, pacientes(nombre)")
    .eq("id", citaId)
    .maybeSingle();
  return data as
    | {
        id: string;
        paciente_id: string;
        dueno_id: string | null;
        fecha_hora: string;
        pacientes: { nombre: string } | null;
      }
    | null;
}

export async function confirmarSolicitud(
  citaId: string,
  fechaHora?: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const cita = await getCita(citaId);
  if (!cita) return { error: "Solicitud no encontrada." };

  const update: Record<string, unknown> = { estado: "confirmada" };
  if (fechaHora) update.fecha_hora = fechaHora;

  const { error } = await supabase.from("citas").update(update).eq("id", citaId);
  if (error) return { error: "No se pudo confirmar." };

  const cuando = formatearFechaHora(fechaHora ?? cita.fecha_hora);
  if (cita.dueno_id) {
    await notificarDueno(cita.dueno_id, {
      tipo: "cita_confirmada",
      titulo: "Cita confirmada",
      cuerpo: `Tu hora para ${cita.pacientes?.nombre ?? "tu mascota"} quedó confirmada: ${cuando}.`,
      url: "/portal/citas",
      preferencia: "citas",
    });
  }

  revalidatePath("/reservas");
  revalidatePath("/agenda");
  return { error: null };
}

export async function rechazarSolicitud(
  citaId: string,
  motivo: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const cita = await getCita(citaId);
  if (!cita) return { error: "Solicitud no encontrada." };

  const { error } = await supabase
    .from("citas")
    .update({ estado: "cancelada", notas_cliente: motivo || null })
    .eq("id", citaId);
  if (error) return { error: "No se pudo rechazar." };

  if (cita.dueno_id) {
    await notificarDueno(cita.dueno_id, {
      tipo: "cita_rechazada",
      titulo: "Solicitud de hora rechazada",
      cuerpo: motivo
        ? `Tu solicitud para ${cita.pacientes?.nombre ?? "tu mascota"} fue rechazada: ${motivo}`
        : `Tu solicitud para ${cita.pacientes?.nombre ?? "tu mascota"} fue rechazada.`,
      url: "/portal/citas",
      preferencia: "citas",
    });
  }

  revalidatePath("/reservas");
  return { error: null };
}
