"use server";

import { revalidatePath } from "next/cache";

import { getClinicasDelCliente } from "@/lib/data/clinica";
import { getMisDuenos } from "@/lib/data/portal";
import { armarPaqueteDesdePortal } from "@/lib/privacidad/paquete-portal";
import type { PaqueteDatos } from "@/lib/privacidad/paquete";
import { createClient } from "@/lib/supabase/server";
import type { ClinicaConfig } from "@/lib/types/db";

// El dueño acepta el aviso vigente de una clínica (la base verifica que sea
// el vigente y que tenga ficha en ella).
export async function aceptarAviso(avisoId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.rpc("aceptar_aviso", { p_aviso: avisoId });
  if (error) return { error: "No se pudo registrar tu aceptación. Recarga la página." };
  revalidatePath("/portal", "layout");
  return { error: null };
}

// Paquete de datos del dueño en una clínica (derecho de acceso y
// portabilidad). La exportación queda en el registro de accesos antes de
// entregar los datos.
export async function obtenerMisDatos(
  tenantId: string,
): Promise<
  { ok: true; paquete: PaqueteDatos; clinica: ClinicaConfig | null } | { ok: false; error: string }
> {
  const dueno = (await getMisDuenos()).find((d) => d.tenant_id === tenantId);
  if (!dueno || dueno.aviso_pendiente) return { ok: false, error: "No disponible." };
  const supabase = createClient();
  const { error } = await supabase.rpc("registrar_acceso", {
    p_accion: "exportar_datos",
    p_dueno: dueno.id,
  });
  if (error) return { ok: false, error: "No se pudo preparar la descarga." };
  const [paquete, clinicas] = await Promise.all([armarPaqueteDesdePortal(dueno), getClinicasDelCliente()]);
  if (!paquete) return { ok: false, error: "No se pudo preparar la descarga." };
  return { ok: true, paquete, clinica: clinicas.find((c) => c.id === tenantId) ?? null };
}
