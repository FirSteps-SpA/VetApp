import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Dueno } from "@/lib/types/db";

export async function getDueno(id: string): Promise<Dueno | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("duenos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getDueno:", error.message);
    return null;
  }
  return data as Dueno | null;
}
