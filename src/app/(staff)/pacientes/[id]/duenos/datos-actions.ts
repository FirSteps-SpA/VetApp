"use server";

import { revalidatePath } from "next/cache";

import { esRol } from "@/lib/auth/guards";
import { getClinicaConfig } from "@/lib/data/clinica";
import { logError } from "@/lib/log";
import { armarPaqueteDesdeStaff } from "@/lib/privacidad/paquete-staff";
import type { PaqueteDatos } from "@/lib/privacidad/paquete";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ClinicaConfig } from "@/lib/types/db";

// Derechos del dueño ejercidos a pedido en la clínica (spec 7): exportar sus
// datos y anonimizarlo. Solo staff clínico; la base lo vuelve a exigir.

const esClinico = () => esRol("dev", "veterinario");

export async function exportarDatosDueno(
  duenoId: string,
): Promise<
  { ok: true; paquete: PaqueteDatos; clinica: ClinicaConfig | null } | { ok: false; error: string }
> {
  if (!(await esClinico())) return { ok: false, error: "No autorizado." };
  const supabase = createClient();
  // Primero el registro: si no se puede registrar, no se entregan los datos.
  const { error } = await supabase.rpc("registrar_acceso", {
    p_accion: "exportar_datos",
    p_dueno: duenoId,
  });
  if (error) return { ok: false, error: "No se pudo preparar la exportación." };
  const [paquete, clinica] = await Promise.all([armarPaqueteDesdeStaff(duenoId), getClinicaConfig()]);
  if (!paquete) return { ok: false, error: "No se pudo preparar la exportación." };
  return { ok: true, paquete, clinica };
}

// Borra los datos personales del dueño (irreversible). La cuenta del portal se
// elimina solo si ya no tiene ficha en ninguna clínica.
export async function anonimizarDueno(
  duenoId: string,
  pacienteId: string,
  confirmacion: string,
): Promise<{ error: string | null }> {
  if (!(await esClinico())) return { error: "No autorizado." };
  if (confirmacion !== "ELIMINAR") return { error: "Confirmación incorrecta: no se eliminó nada." };

  const supabase = createClient();
  const { data: cuenta, error } = await supabase.rpc("anonimizar_dueno", { p_dueno: duenoId });
  if (error) return { error: "No se pudieron eliminar los datos." };

  if (cuenta) {
    const admin = createAdminClient();
    const { count } = await admin
      .from("duenos")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", cuenta as string);
    if (!count) {
      const { error: errBorrar } = await admin.auth.admin.deleteUser(cuenta as string);
      if (errBorrar) logError(new Error(`anonimizarDueno deleteUser: ${errBorrar.message}`));
    }
  }
  revalidatePath(`/pacientes/${pacienteId}`, "layout");
  return { error: null };
}
