import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ConsultaConVet, Receta } from "@/lib/types/db";

// Historial de consultas del paciente (más reciente primero), con el veterinario.
export async function getConsultas(
  pacienteId: string,
): Promise<ConsultaConVet[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("consultas")
    .select("*, veterinario:usuarios(nombre)")
    .eq("paciente_id", pacienteId)
    .order("fecha", { ascending: false });

  if (error) {
    console.error("getConsultas:", error.message);
    return [];
  }
  return (data as unknown as ConsultaConVet[]) ?? [];
}

// Una consulta con su veterinario y las recetas vinculadas.
export async function getConsulta(
  id: string,
): Promise<{ consulta: ConsultaConVet; recetas: Receta[] } | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("consultas")
    .select("*, veterinario:usuarios(nombre)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getConsulta:", error.message);
    return null;
  }

  const { data: recetas } = await supabase
    .from("recetas")
    .select("*")
    .eq("consulta_id", id)
    .order("fecha", { ascending: false });

  return {
    consulta: data as unknown as ConsultaConVet,
    recetas: (recetas as unknown as Receta[]) ?? [],
  };
}

// Recetas del paciente (más reciente primero).
export async function getRecetas(pacienteId: string): Promise<Receta[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recetas")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("fecha", { ascending: false });

  if (error) {
    console.error("getRecetas:", error.message);
    return [];
  }
  return (data as unknown as Receta[]) ?? [];
}
