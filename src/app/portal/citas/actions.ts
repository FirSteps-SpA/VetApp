"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface SolicitarCitaInput {
  pacienteId: string;
  fecha: string;
  hora: string;
  motivo: string;
}

// El cliente solicita una hora. Valida propiedad con su sesión (RLS) y crea la
// cita como pendiente con un veterinario por defecto, usando el cliente admin.
export async function solicitarCita(
  input: SolicitarCitaInput,
): Promise<{ error: string | null }> {
  if (!input.motivo?.trim()) return { error: "Indica el motivo." };
  if (!input.fecha || !input.hora) return { error: "Indica fecha y hora." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  // Verifica que la mascota pertenece al cliente (RLS aplica).
  const { data: pac } = await supabase
    .from("pacientes")
    .select("id")
    .eq("id", input.pacienteId)
    .maybeSingle();
  if (!pac) return { error: "Mascota no válida." };

  const { data: dueno } = await supabase
    .from("duenos")
    .select("id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const admin = createAdminClient();
  const { data: vet } = await admin
    .from("usuarios")
    .select("id")
    .in("rol", ["veterinario", "dev"])
    .eq("activo", true)
    .order("rol", { ascending: false }) // 'veterinario' antes que 'dev'
    .limit(1)
    .maybeSingle();
  if (!vet) return { error: "No hay veterinario disponible." };

  const fechaHora = new Date(`${input.fecha}T${input.hora}:00`);
  if (Number.isNaN(fechaHora.getTime())) return { error: "Fecha/hora inválida." };

  const { error } = await admin.from("citas").insert({
    paciente_id: input.pacienteId,
    dueno_id: dueno?.id ?? null,
    veterinario_id: vet.id,
    fecha_hora: fechaHora.toISOString(),
    duracion_minutos: 30,
    motivo: input.motivo.trim(),
    estado: "pendiente",
    creado_por_cliente: true,
  });

  if (error) return { error: "No se pudo enviar la solicitud." };

  revalidatePath("/portal/citas");
  revalidatePath("/reservas");
  return { error: null };
}
