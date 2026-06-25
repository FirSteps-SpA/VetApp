"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { iconoEspecie, type Especie } from "@/lib/types/db";

import { setFotoPaciente } from "./actions";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

export function PhotoUploader({
  pacienteId,
  especie,
  initialUrl,
}: {
  pacienteId: string;
  especie: Especie;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (!TIPOS.includes(file.type)) {
      setError("Formato no soportado (usa JPG, PNG o WEBP).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen supera los 10 MB.");
      return;
    }

    setSubiendo(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${pacienteId}/perfil_${Date.now()}.${ext}`;

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("fotos-pacientes")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError("No se pudo subir la imagen.");
      setSubiendo(false);
      return;
    }

    const { error: saveError } = await setFotoPaciente(pacienteId, path);
    if (saveError) {
      setError(saveError);
      setSubiendo(false);
      return;
    }

    setSubiendo(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-slate-100 text-4xl">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Foto del paciente"
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{iconoEspecie(especie)}</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="text-xs font-medium text-teal-700 hover:underline disabled:opacity-60"
      >
        {subiendo ? "Subiendo…" : preview ? "Cambiar foto" : "Agregar foto"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={TIPOS.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
