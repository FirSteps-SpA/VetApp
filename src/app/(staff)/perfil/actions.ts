"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { TITULOS_PROFESIONALES, type TituloProfesional } from "@/lib/types/db";

export interface PerfilState {
  error: string | null;
  ok: boolean;
}

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

// Actualiza el RUT y el título profesional del propio registro de staff. RLS
// (`usuarios_update` con id = auth.uid()) restringe la edición a la fila propia.
export async function actualizarMiPerfil(
  _prev: PerfilState,
  formData: FormData,
): Promise<PerfilState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida.", ok: false };

  const titulo = str(formData, "titulo_profesional") as TituloProfesional | "";
  if (titulo && !TITULOS_PROFESIONALES.some((t) => t.value === titulo)) {
    return { error: "Título profesional inválido.", ok: false };
  }

  const { error } = await supabase
    .from("usuarios")
    .update({
      rut: str(formData, "rut") || null,
      titulo_profesional: titulo || null,
    })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar el perfil.", ok: false };

  revalidatePath("/perfil");
  return { error: null, ok: true };
}
