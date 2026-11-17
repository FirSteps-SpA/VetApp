"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface SolicitarCitaInput {
  pacienteId: string;
  fechaHora: string; // ISO 8601, calculado en el navegador del cliente
  motivo: string;
}

// El cliente solicita una hora. Valida propiedad con su sesión (RLS) y crea la
// cita como pendiente con un veterinario por defecto, usando el cliente admin.
export async function solicitarCita(
  input: SolicitarCitaInput,
): Promise<{ error: string | null }> {
  if (!input.motivo?.trim()) return { error: "Indica el motivo." };
  if (!input.fechaHora) return { error: "Indica fecha y hora." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  // Verifica que la mascota pertenece al cliente (portal_mascotas filtra por dueño).
  const { data: pac } = await supabase
    .rpc("portal_mascotas")
    .eq("id", input.pacienteId)
    .maybeSingle<{ id: string; tenant_id: string }>();
  if (!pac) return { error: "Mascota no válida." };

  // La cita, el dueño y el veterinario son de la clínica de la mascota.
  const { data: dueno } = await supabase
    .rpc("portal_mi_dueno")
    .eq("tenant_id", pac.tenant_id)
    .maybeSingle<{ id: string }>();

  const admin = createAdminClient();
  const { data: vet } = await admin
    .from("usuarios")
    .select("id")
    .eq("rol", "veterinario")
    .eq("tenant_id", pac.tenant_id)
    .eq("activo", true)
    .order("nombre")
    .limit(1)
    .maybeSingle();
  if (!vet) return { error: "No hay veterinario disponible." };

  const fechaHora = new Date(input.fechaHora);
  if (Number.isNaN(fechaHora.getTime())) return { error: "Fecha/hora inválida." };

  const { error } = await admin.from("citas").insert({
    tenant_id: pac.tenant_id,
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
