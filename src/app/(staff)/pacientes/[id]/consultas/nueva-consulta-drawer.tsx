"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { MIMES_ACEPTADOS, subirExamen } from "@/lib/examenes-upload";
import {
  TIPOS_CONSULTA,
  TIPOS_EXAMEN,
  type Medicamento,
  type TipoConsulta,
  type TipoExamen,
} from "@/lib/types/db";

import { crearConsulta, type ExamenPendiente } from "./actions";

interface AdjuntoRow extends ExamenPendiente {
  key: number;
}

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const label = "flex flex-col gap-1 text-sm font-medium text-slate-700";

interface MedRow extends Medicamento {
  key: number;
}

const emptyMed = (key: number): MedRow => ({
  key,
  nombre: "",
  presentacion: "",
  dosis: "",
  frecuencia: "",
  duracion: "",
  instrucciones: "",
});

export function NuevaConsultaDrawer({ pacienteId }: { pacienteId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos de consulta.
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
  const [conReceta, setConReceta] = useState(false);
  const [meds, setMeds] = useState<MedRow[]>([emptyMed(0)]);
  const [instrucciones, setInstrucciones] = useState("");

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
    setConReceta(false);
    setMeds([emptyMed(0)]);
    setInstrucciones("");
    setAdjuntos([]);
    setError(null);
  }

  function close() {
    const dirty = motivo || diagnostico || tratamiento || anamnesis;
    if (dirty && !window.confirm("¿Descartar la consulta sin guardar?")) return;
    setOpen(false);
    reset();
  }

  function updateMed(key: number, patch: Partial<Medicamento>) {
    setMeds((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);

    const result = await crearConsulta({
      pacienteId,
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
      receta: conReceta
        ? {
            instrucciones_generales: instrucciones,
            medicamentos: meds.map((m) => ({
              nombre: m.nombre,
              presentacion: m.presentacion,
              dosis: m.dosis,
              frecuencia: m.frecuencia,
              duracion: m.duracion,
              instrucciones: m.instrucciones,
            })),
          }
        : null,
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
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
      >
        + Nueva consulta
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/30"
            onClick={close}
            aria-hidden
          />
          <div className="relative flex h-full w-full flex-col bg-slate-50 shadow-xl sm:max-w-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Nueva consulta
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Datos clínicos */}
              <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
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
              <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
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
                  Diagnóstico diferencial
                  <textarea
                    value={diagDiferencial}
                    onChange={(e) => setDiagDiferencial(e.target.value)}
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

              {/* Receta inline */}
              <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Receta</h3>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={conReceta}
                      onChange={(e) => setConReceta(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Agregar receta
                  </label>
                </div>

                {conReceta && (
                  <div className="space-y-3">
                    {meds.map((m, i) => (
                      <div
                        key={m.key}
                        className="space-y-2 rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500">
                            Medicamento {i + 1}
                          </span>
                          {meds.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setMeds((rows) =>
                                  rows.filter((r) => r.key !== m.key),
                                )
                              }
                              className="text-xs text-red-600 hover:underline"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                        <input
                          placeholder="Nombre *"
                          value={m.nombre}
                          onChange={(e) =>
                            updateMed(m.key, { nombre: e.target.value })
                          }
                          className={field}
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            placeholder="Presentación"
                            value={m.presentacion}
                            onChange={(e) =>
                              updateMed(m.key, { presentacion: e.target.value })
                            }
                            className={field}
                          />
                          <input
                            placeholder="Dosis"
                            value={m.dosis}
                            onChange={(e) =>
                              updateMed(m.key, { dosis: e.target.value })
                            }
                            className={field}
                          />
                          <input
                            placeholder="Frecuencia"
                            value={m.frecuencia}
                            onChange={(e) =>
                              updateMed(m.key, { frecuencia: e.target.value })
                            }
                            className={field}
                          />
                          <input
                            placeholder="Duración"
                            value={m.duracion}
                            onChange={(e) =>
                              updateMed(m.key, { duracion: e.target.value })
                            }
                            className={field}
                          />
                        </div>
                        <input
                          placeholder="Instrucciones"
                          value={m.instrucciones}
                          onChange={(e) =>
                            updateMed(m.key, { instrucciones: e.target.value })
                          }
                          className={field}
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setMeds((rows) => [
                          ...rows,
                          emptyMed((rows.at(-1)?.key ?? 0) + 1),
                        ])
                      }
                      className="text-sm font-medium text-teal-700 hover:underline"
                    >
                      + Agregar medicamento
                    </button>

                    <label className={label}>
                      Instrucciones generales
                      <textarea
                        value={instrucciones}
                        onChange={(e) => setInstrucciones(e.target.value)}
                        rows={2}
                        className={field}
                      />
                    </label>
                  </div>
                )}
              </section>

              {/* Adjuntar exámenes */}
              <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Adjuntar exámenes
                </h3>

                {adjuntos.map((a, i) => (
                  <div
                    key={a.key}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
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
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
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
                      className="text-xs text-red-600 hover:underline"
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
                  className="text-sm font-medium text-teal-700 hover:underline disabled:opacity-60"
                >
                  {subiendoAdjunto ? "Subiendo…" : "+ Adjuntar archivo"}
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
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
            </div>

            <footer className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
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
