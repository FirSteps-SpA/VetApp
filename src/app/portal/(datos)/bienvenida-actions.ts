"use server";

import { createClient } from "@/lib/supabase/server";

// Cierra la bienvenida del portal para esta cuenta (spec 8).
export async function marcarBienvenidaVista(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("usuarios")
    .update({ bienvenida_vista_en: new Date().toISOString() })
    .eq("id", user.id)
    .is("bienvenida_vista_en", null);
}
