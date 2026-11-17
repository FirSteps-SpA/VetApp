"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { esDev } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

// Acciones de la cuenta de plataforma (spec 6). La base las vuelve a exigir:
// `crear_clinica` y `cambiar_clinica_activa` verifican el rol dev, y la RLS de
// `tenants` solo deja editar a dev.

const SLUG = /^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/;

export async function crearClinica(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  if (!(await esDev())) return { error: "No autorizado." };
  const str = (k: string) => (formData.get(k) as string | null)?.trim() ?? "";
  const nombre = str("nombre");
  const slug = str("slug").toLowerCase();
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!SLUG.test(slug)) {
    return {
      error: "El slug solo admite minúsculas, números y guiones (sin guion al inicio o al final).",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("crear_clinica", {
    p_slug: slug,
    p_nombre: nombre,
    p_sucursal: str("sucursal") || "Principal",
    p_direccion: str("direccion") || null,
    p_ciudad: str("ciudad") || null,
    p_telefono: str("telefono") || null,
    p_email: str("email") || null,
    p_numero_registro: str("numero_registro") || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "Ese slug no está disponible." };
    return { error: "No se pudo crear la clínica." };
  }
  revalidatePath("/admin/clinicas");
  return { error: null };
}

export async function cambiarActivo(
  id: string,
  activo: boolean,
): Promise<{ error: string | null }> {
  if (!(await esDev())) return { error: "No autorizado." };
  const supabase = createClient();
  const { error } = await supabase.from("tenants").update({ activo }).eq("id", id);
  if (error) return { error: "No se pudo actualizar la clínica." };
  revalidatePath("/admin/clinicas");
  return { error: null };
}

// Cambia la clínica activa de la cuenta de plataforma y refresca la sesión
// para que el JWT lleve el tenant nuevo.
export async function cambiarClinicaActiva(id: string): Promise<{ error: string | null }> {
  if (!(await esDev())) return { error: "No autorizado." };
  const supabase = createClient();
  const { error } = await supabase.rpc("cambiar_clinica_activa", { p_tenant: id });
  if (error) return { error: "No se pudo cambiar de clínica." };
  await supabase.auth.refreshSession();
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
