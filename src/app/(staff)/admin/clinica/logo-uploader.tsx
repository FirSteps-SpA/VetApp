"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { setLogoClinica } from "./actions";

const TIPOS = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export function LogoUploader({ actualUrl }: { actualUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(actualUrl);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!TIPOS.includes(file.type)) {
      setError("Formato no soportado (PNG, JPG, WEBP o SVG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("El logo supera los 2 MB.");
      return;
    }

    setSubiendo(true);
    setPreview(URL.createObjectURL(file));
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `logo_${Date.now()}.${ext}`;

    const supabase = createClient();
    const { error: upErr } = await supabase.storage
      .from("clinica-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setError("No se pudo subir el logo.");
      setSubiendo(false);
      return;
    }
    const res = await setLogoClinica(path);
    setSubiendo(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <div className="grid h-20 w-32 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Logo"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-xs text-slate-400">Sin logo</span>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          {subiendo ? "Subiendo…" : "Cambiar logo"}
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={TIPOS.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
