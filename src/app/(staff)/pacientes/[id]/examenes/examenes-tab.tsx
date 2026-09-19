"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
  MIMES_ACEPTADOS,
  subirExamen,
  validarArchivo,
} from "@/lib/examenes-upload";
import {
  esImagen,
  esPdf,
  labelTipoExamen,
  TIPOS_EXAMEN,
  type Examen,
  type TipoExamen,
} from "@/lib/types/db";
import { formatearFecha } from "@/lib/utils/format";

import { crearExamen, eliminarExamen } from "./actions";

const field =
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";

const hoy = () => new Date().toISOString().slice(0, 10);

export function ExamenesTab({
  pacienteId,
  examenes,
  urls,
}: {
  pacienteId: string;
  examenes: Examen[];
  urls: Record<string, string>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoExamen>("foto");
  const [fecha, setFecha] = useState(hoy());
  const [descripcion, setDescripcion] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtro, setFiltro] = useState<TipoExamen | "todos">("todos");
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  function tomarArchivo(f: File) {
    const err = validarArchivo(f);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFile(f);
    if (!nombre) setNombre(f.name.replace(/\.[^.]+$/, ""));
    setTipo(f.type.startsWith("image/") ? "foto" : "otro");
  }

  function resetForm() {
    setFile(null);
    setNombre("");
    setTipo("foto");
    setFecha(hoy());
    setDescripcion("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function agregar() {
    if (!file) {
      setError("Selecciona o arrastra un archivo.");
      return;
    }
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setSubiendo(true);
    setError(null);

    const supabase = createClient();
    const subida = await subirExamen(supabase, pacienteId, file);
    if ("error" in subida) {
      setError(subida.error);
      setSubiendo(false);
      return;
    }

    const res = await crearExamen({
      pacienteId,
      tipo,
      nombre,
      descripcion,
      fecha,
      ...subida.data,
    });

    setSubiendo(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    resetForm();
    router.refresh();
  }

  async function quitar(id: string) {
    if (!window.confirm("¿Eliminar este examen y su archivo?")) return;
    const res = await eliminarExamen(id, pacienteId);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  const visibles =
    filtro === "todos" ? examenes : examenes.filter((e) => e.tipo === filtro);

  return (
    <div className="space-y-5">
      {/* Subida */}
      <div className="space-y-3 rounded-card border border-border bg-surface p-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) tomarArchivo(f);
          }}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-control border-2 border-dashed border-border px-4 py-6 text-center text-sm text-text-muted hover:border-accent"
        >
          {file ? (
            <span className="font-medium text-text">{file.name}</span>
          ) : (
            <>Arrastra un archivo aquí o haz clic para seleccionar (JPG, PNG, WEBP, PDF)</>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={MIMES_ACEPTADOS}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) tomarArchivo(f);
          }}
        />

        {file && (
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Nombre descriptivo *"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={field}
            />
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoExamen)}
              className={field}
            >
              {TIPOS_EXAMEN.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={field}
            />
            <input
              placeholder="Descripción / resultados"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={field}
            />
          </div>
        )}

        {subiendo && (
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-surface-sunken">
            <div className="h-full w-1/3 animate-pulse rounded-pill bg-accent-subtle0" />
          </div>
        )}

        {error && (
          <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">
            {error}
          </p>
        )}

        {file && (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={subiendo}
              className="rounded-control border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-sunken disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={agregar}
              disabled={subiendo}
              className="rounded-control bg-accent px-4 py-1.5 text-sm font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
            >
              {subiendo ? "Subiendo…" : "Agregar examen"}
            </button>
          </div>
        )}
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Filtrar:</span>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as TipoExamen | "todos")}
          className="rounded-control border border-border bg-surface px-2 py-1 text-sm"
        >
          <option value="todos">Todos</option>
          {TIPOS_EXAMEN.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {visibles.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-sm text-text-muted">
          {examenes.length === 0
            ? "Sin exámenes adjuntos."
            : "Sin exámenes de este tipo."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibles.map((e) => {
            const url = urls[e.id] ?? null;
            return (
              <div
                key={e.id}
                className="flex gap-3 rounded-card border border-border bg-surface p-3"
              >
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-control bg-surface-sunken">
                  {url && esImagen(e.archivo_tipo) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={e.nombre}
                      onClick={() => setModalUrl(url)}
                      className="h-full w-full cursor-zoom-in object-cover"
                    />
                  ) : (
                    <span className="text-2xl">
                      {esPdf(e.archivo_tipo) ? "📄" : "📎"}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {e.nombre}
                  </p>
                  <p className="text-xs text-text-muted">
                    {labelTipoExamen(e.tipo)} · {formatearFecha(e.fecha)}
                  </p>
                  {e.descripcion && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                      {e.descripcion}
                    </p>
                  )}
                  <div className="mt-1 flex gap-1 text-xs">
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-2 font-medium text-accent hover:underline"
                      >
                        Abrir / Descargar
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => quitar(e.id)}
                      className="inline-flex items-center px-2 py-2 text-danger hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de imagen */}
      {modalUrl && (
        <div
          onClick={() => setModalUrl(null)}
          className="fixed inset-0 z-40 grid place-items-center bg-slate-900/70 p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={modalUrl}
            alt="Vista del examen"
            className="max-h-full max-w-full rounded-control object-contain"
          />
        </div>
      )}
    </div>
  );
}
