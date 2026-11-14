"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { useRouter } from "next/navigation";

import {
  SelectorVeterinario,
  veterinarioPorDefecto,
  type VeterinarioOpcion,
} from "@/components/selector-veterinario";
import { createClient } from "@/lib/supabase/client";
import { MIMES_ACEPTADOS, subirExamen } from "@/lib/examenes-upload";
import {
  TIPOS_CONSULTA,
  TIPOS_EXAMEN,
  type TipoConsulta,
  type TipoExamen,
} from "@/lib/types/db";

import { crearConsulta, type ExamenPendiente } from "./actions";
import { RecetaEditor, useReceta } from "./receta-editor";

interface AdjuntoRow extends ExamenPendiente {
  key: number;
}

const field =
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-base text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";
const label = "flex flex-col gap-1 text-sm font-medium text-text";


export function NuevaConsultaDrawer({
  pacienteId,
  citaId,
  autoOpen,
  veterinarios,
  usuarioId,
}: {
  pacienteId: string;
  citaId?: string;
  autoOpen?: boolean;
  veterinarios: VeterinarioOpcion[];
  usuarioId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!!autoOpen);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos de consulta. El veterinario responsable parte en el usuario actual si
  // es elegible; si no (p. ej. 'dev'), hay que elegirlo.
  const [veterinarioId, setVeterinarioId] = useState(() =>
    veterinarioPorDefecto(veterinarios, usuarioId),
  );
  const [tipo, setTipo] = useState<TipoConsulta>("consulta");
  const [motivo, setMotivo] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [examenFisico, setExamenFisico] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [diagDiferencial, setDiagDiferencial] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [notas, setNotas] = useState("");

  // Receta.
  const receta = useReceta();

  // Adjuntos (se suben a Storage al seleccionarlos; se vinculan al guardar).
  const fileRef = useRef<HTMLInputElement>(null);
  const [adjuntos, setAdjuntos] = useState<AdjuntoRow[]>([]);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);
  const adjuntoKey = useRef(0);

  async function agregarAdjunto(file: File) {
    setSubiendoAdjunto(true);
    setError(null);
    const supabase = createClient();
    const res = await subirExamen(supabase, pacienteId, file);
    setSubiendoAdjunto(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setAdjuntos((rows) => [
      ...rows,
      {
        key: adjuntoKey.current++,
        tipo: file.type.startsWith("image/") ? "foto" : "otro",
        nombre: file.name.replace(/\.[^.]+$/, ""),
        fecha: new Date().toISOString().slice(0, 10),
        ...res.data,
      },
    ]);
  }

  function reset() {
    setVeterinarioId(veterinarioPorDefecto(veterinarios, usuarioId));
    setTipo("consulta");
    setMotivo("");
    setAnamnesis("");
    setExamenFisico("");
    setDiagnostico("");
    setDiagDiferencial("");
    setTratamiento("");
    setPesoKg("");
    setTemperatura("");
    setNotas("");
    receta.reset();
    setAdjuntos([]);
    setError(null);
  }

  function close() {
    const dirty = motivo || diagnostico || tratamiento || anamnesis;
    if (dirty && !window.confirm("¿Descartar la consulta sin guardar?")) return;
    setOpen(false);
    reset();
  }

  async function submit() {
    if (!veterinarioId) {
      setError("Elige el veterinario responsable.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const result = await crearConsulta({
      pacienteId,
      veterinarioId,
      tipo,
      motivo,
      anamnesis,
      examen_fisico: examenFisico,
      diagnostico,
      diagnostico_diferencial: diagDiferencial,
      tratamiento,
      peso_kg: pesoKg,
      temperatura_c: temperatura,
      notas,
      receta: receta.aInput(),
      examenes: adjuntos.map((a) => ({
        tipo: a.tipo,
        nombre: a.nombre,
        fecha: a.fecha,
        descripcion: a.descripcion,
        archivo_url: a.archivo_url,
        archivo_nombre: a.archivo_nombre,
        archivo_tipo: a.archivo_tipo,
        archivo_tamanio_bytes: a.archivo_tamanio_bytes,
      })),
      citaId: citaId ?? null,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setOpen(false);
    reset();
    if (citaId) router.replace(`/pacientes/${pacienteId}`);
    else router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:opacity-90"
      >
        <Icon name="plus" />
        Nueva consulta
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/30"
            onClick={close}
            aria-hidden
          />
          <div className="relative flex h-full w-full flex-col bg-surface-sunken shadow-xl sm:max-w-2xl">
            <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
              <h2 className="text-lg font-semibold text-text">
                Nueva consulta
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-control px-2 py-1 text-text-muted hover:bg-surface-sunken hover:text-text-muted"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Datos clínicos */}
              <section className="space-y-3 rounded-card border border-border bg-surface p-4">
                <label className={label}>
                  Veterinario responsable *
                  <SelectorVeterinario
                    veterinarios={veterinarios}
                    value={veterinarioId}
                    onChange={setVeterinarioId}
                    usuarioId={usuarioId}
                    required
                    className={field}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={label}>
                    Tipo
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as TipoConsulta)}
                      className={field}
                    >
                      {TIPOS_CONSULTA.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={label}>
                    Motivo *
                    <input
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className={field}
                    />
                  </label>
                </div>
                <label className={label}>
                  Anamnesis
                  <textarea
                    value={anamnesis}
                    onChange={(e) => setAnamnesis(e.target.value)}
                    rows={2}
                    className={field}
                  />
                </label>
                <label className={label}>
                  Examen físico
                  <textarea
                    value={examenFisico}
                    onChange={(e) => setExamenFisico(e.target.value)}
                    rows={2}
                    className={field}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={label}>
                    Peso (kg)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pesoKg}
                      onChange={(e) => setPesoKg(e.target.value)}
                      className={field}
                    />
                  </label>
                  <label className={label}>
                    Temperatura (°C)
                    <input
                      type="number"
                      step="0.1"
                      value={temperatura}
                      onChange={(e) => setTemperatura(e.target.value)}
                      className={field}
                    />
                  </label>
                </div>
              </section>

              {/* Diagnóstico y tratamiento */}
              <section className="space-y-3 rounded-card border border-border bg-surface p-4">
                <label className={label}>
                  Diagnóstico diferencial
                  <textarea
                    value={diagDiferencial}
                    onChange={(e) => setDiagDiferencial(e.target.value)}
                    rows={2}
                    className={field}
                  />
                </label>
                <label className={label}>
                  Diagnóstico *
                  <textarea
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                    rows={2}
                    className={field}
                  />
                </label>
                <label className={label}>
                  Tratamiento *
                  <textarea
                    value={tratamiento}
                    onChange={(e) => setTratamiento(e.target.value)}
                    rows={2}
                    className={field}
                  />
                </label>
                <label className={label}>
                  Notas / instrucciones para el dueño
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={2}
                    className={field}
                  />
                </label>
              </section>

              <RecetaEditor receta={receta} />

              {/* Adjuntar exámenes */}
              <section className="space-y-3 rounded-card border border-border bg-surface p-4">
                <h3 className="text-sm font-semibold text-text">
                  Adjuntar exámenes
                </h3>

                {adjuntos.map((a, i) => (
                  <div
                    key={a.key}
                    className="flex items-center gap-2 rounded-control border border-border p-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-text">
                      {a.archivo_nombre}
                    </span>
                    <select
                      value={a.tipo}
                      onChange={(e) =>
                        setAdjuntos((rows) =>
                          rows.map((r) =>
                            r.key === a.key
                              ? { ...r, tipo: e.target.value as TipoExamen }
                              : r,
                          ),
                        )
                      }
                      className="rounded-control border border-border bg-surface px-2 py-1 text-sm"
                    >
                      {TIPOS_EXAMEN.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setAdjuntos((rows) => rows.filter((r) => r.key !== a.key))
                      }
                      className="text-xs text-danger hover:underline"
                      aria-label={`Quitar adjunto ${i + 1}`}
                    >
                      Quitar
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={subiendoAdjunto}
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline disabled:opacity-60"
                >
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  {subiendoAdjunto ? "Subiendo…" : "Adjuntar archivo"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept={MIMES_ACEPTADOS}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void agregarAdjunto(f);
                    e.target.value = "";
                  }}
                />
              </section>

              {error && (
                <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">
                  {error}
                </p>
              )}
            </div>

            <footer className="flex justify-end gap-2 border-t border-border bg-surface px-5 py-3">
              <button
                type="button"
                onClick={close}
                className="rounded-control border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-sunken"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="rounded-control bg-accent px-5 py-2 text-sm font-medium text-on-accent transition-colors hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Guardando…" : "Guardar consulta"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
