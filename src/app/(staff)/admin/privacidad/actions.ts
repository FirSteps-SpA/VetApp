"use server";

import { revalidatePath } from "next/cache";

import { esDev } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

// Publica una versión nueva del aviso de la clínica activa. La base exige el
// rol dev y numera la versión (publicar_aviso).
export async function publicarAviso(texto: string): Promise<{ error: string | null }> {
  if (!(await esDev())) return { error: "No autorizado." };
  if (!texto.trim()) return { error: "El aviso no puede estar vacío." };
  const supabase = createClient();
  const { error } = await supabase.rpc("publicar_aviso", { p_texto: texto.trim() });
  if (error) return { error: "No se pudo publicar el aviso." };
  revalidatePath("/admin/privacidad");
  return { error: null };
}
