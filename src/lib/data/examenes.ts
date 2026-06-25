import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Examen } from "@/lib/types/db";

export async function getExamenes(pacienteId: string): Promise<Examen[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("examenes")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("fecha", { ascending: false });

  if (error) {
    console.error("getExamenes:", error.message);
    return [];
  }
  return (data as unknown as Examen[]) ?? [];
}

// URLs firmadas (1h) para los archivos, indexadas por id de examen.
export async function getUrlsExamenes(
  examenes: Examen[],
): Promise<Record<string, string>> {
  const conArchivo = examenes.filter((e) => e.archivo_url);
  if (conArchivo.length === 0) return {};

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("examenes")
    .createSignedUrls(
      conArchivo.map((e) => e.archivo_url as string),
      3600,
    );

  if (error || !data) {
    console.error("getUrlsExamenes:", error?.message);
    return {};
  }

  // createSignedUrls preserva el orden de los paths solicitados.
  const urls: Record<string, string> = {};
  conArchivo.forEach((examen, i) => {
    const signed = data[i]?.signedUrl;
    if (signed) urls[examen.id] = signed;
  });
  return urls;
}
