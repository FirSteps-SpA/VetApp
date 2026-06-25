"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

// Tipos soportados y límites (ver sección 2.3 de la arquitectura).
const LIMITES: { mimes: string[]; maxBytes: number; etiqueta: string }[] = [
  {
    mimes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 10 * 1024 * 1024,
    etiqueta: "imagen (10 MB)",
  },
  {
    mimes: ["application/pdf"],
    maxBytes: 25 * 1024 * 1024,
    etiqueta: "PDF (25 MB)",
  },
];

export const MIMES_ACEPTADOS = LIMITES.flatMap((l) => l.mimes).join(",");

export interface ArchivoSubido {
  archivo_url: string; // ruta relativa en el bucket
  archivo_nombre: string; // nombre original
  archivo_tipo: string; // MIME
  archivo_tamanio_bytes: number;
}

function sanitizar(nombre: string): string {
  const sinExt = nombre.replace(/\.[^.]+$/, "");
  return (
    sinExt
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // quita diacríticos
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50) || "archivo"
  );
}

export function validarArchivo(file: File): string | null {
  const regla = LIMITES.find((l) => l.mimes.includes(file.type));
  if (!regla) {
    return "Formato no soportado (usa JPG, PNG, WEBP o PDF).";
  }
  if (file.size > regla.maxBytes) {
    return `El archivo supera el límite de ${regla.etiqueta}.`;
  }
  return null;
}

// Sube el archivo al bucket `examenes` con un path anticolisión y devuelve
// los metadatos para registrar en la tabla `examenes`.
export async function subirExamen(
  supabase: SupabaseClient,
  pacienteId: string,
  file: File,
): Promise<{ data: ArchivoSubido } | { error: string }> {
  const error = validarArchivo(file);
  if (error) return { error };

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const now = new Date();
  const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const path = `${pacienteId}/${periodo}/${uuid}_${sanitizar(file.name)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("examenes")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    return { error: "No se pudo subir el archivo." };
  }

  return {
    data: {
      archivo_url: path,
      archivo_nombre: file.name,
      archivo_tipo: file.type,
      archivo_tamanio_bytes: file.size,
    },
  };
}
