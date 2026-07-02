"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { pdf } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/client";
import {
  DerivacionDoc,
  HistorialDoc,
  RecetaDoc,
  VacunacionDoc,
  type OpcionesHistorial,
} from "@/lib/pdf/documents";
import {
  type ClinicaConfig,
  type ConsultaConVet,
  type DuenoDePaciente,
  type Examen,
  type Paciente,
  type Receta,
  type Vacuna,
} from "@/lib/types/db";
import { formatearFecha } from "@/lib/utils/format";

import { setRecetaPdf } from "../consultas/actions";

export interface ExportData {
  pacienteId: string;
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
  consultas: ConsultaConVet[];
  recetas: Receta[];
  examenes: Examen[];
  vacunas: Vacuna[];
}

type TipoDoc = "historial" | "receta" | "derivacion" | "vacunacion";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export default function ExportPanel({
  data,
  onClose,
}: {
  data: ExportData;
  onClose: () => void;
}) {
  const router = useRouter();
  const { clinica, paciente, dueno, consultas, recetas, examenes, vacunas } =
    data;

  const [tipo, setTipo] = useState<TipoDoc>("historial");
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Historial.
  const [opciones, setOpciones] = useState<OpcionesHistorial>({
    incluirRecetas: true,
    incluirExamenes: true,
    incluirVacunas: true,
    incluirNotasInternas: false,
  });
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Receta.
  const [recetaId, setRecetaId] = useState(recetas[0]?.id ?? "");

  // Derivación.
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [consultasSel, setConsultasSel] = useState<Set<string>>(new Set());

  const consultasEnRango = useMemo(() => {
    return consultas.filter((c) => {
      const f = c.fecha.slice(0, 10);
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    });
  }, [consultas, desde, hasta]);

  function nombreVetDeReceta(r: Receta): string | null {
    const c = consultas.find((x) => x.id === r.consulta_id);
    return c?.veterinario?.nombre ?? null;
  }

  function buildDoc(): React.ReactElement | null {
    if (tipo === "receta") {
      const r = recetas.find((x) => x.id === recetaId);
      if (!r) return null;
      return (
        <RecetaDoc
          clinica={clinica}
          paciente={paciente}
          dueno={dueno}
          receta={r}
          veterinario={nombreVetDeReceta(r)}
        />
      );
    }
    if (tipo === "historial") {
      const examenesRango = examenes.filter((e) => {
        if (desde && e.fecha < desde) return false;
        if (hasta && e.fecha > hasta) return false;
        return true;
      });
      return (
        <HistorialDoc
          clinica={clinica}
          paciente={paciente}
          dueno={dueno}
          consultas={consultasEnRango}
          recetas={recetas}
          examenes={examenesRango}
          vacunas={vacunas}
          opciones={opciones}
        />
      );
    }
    if (tipo === "derivacion") {
      const sel = consultas.filter((c) => consultasSel.has(c.id));
      const examenesSel = examenes.filter(
        (e) => e.consulta_id && consultasSel.has(e.consulta_id),
      );
      return (
        <DerivacionDoc
          clinica={clinica}
          paciente={paciente}
          dueno={dueno}
          consultas={sel}
          examenes={examenesSel}
          motivo={motivo}
          destino={destino}
          veterinario={consultas[0]?.veterinario?.nombre ?? null}
        />
      );
    }
    return (
      <VacunacionDoc
        clinica={clinica}
        paciente={paciente}
        dueno={dueno}
        vacunas={vacunas}
      />
    );
  }

  async function generarBlob(): Promise<Blob | null> {
    const doc = buildDoc();
    if (!doc) {
      setError("Selecciona el contenido del documento.");
      return null;
    }
    setError(null);
    return pdf(doc).toBlob();
  }

  async function vistaPrevia() {
    setGenerando(true);
    const blob = await generarBlob();
    setGenerando(false);
    if (!blob) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
  }

  function nombreArchivo(): string {
    const base = `${paciente.numero_ficha}`;
    const map: Record<TipoDoc, string> = {
      historial: "historial",
      receta: "receta",
      derivacion: "derivacion",
      vacunacion: "vacunacion",
    };
    return `${base}_${map[tipo]}.pdf`;
  }

  async function descargar() {
    setGenerando(true);
    const blob = await generarBlob();
    setGenerando(false);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo();
    a.click();
    URL.revokeObjectURL(url);
  }

  async function guardarRecetaEnFicha() {
    const r = recetas.find((x) => x.id === recetaId);
    if (!r) return;
    setGuardando(true);
    setError(null);
    const blob = await pdf(
      <RecetaDoc
        clinica={clinica}
        paciente={paciente}
        dueno={dueno}
        receta={r}
        veterinario={nombreVetDeReceta(r)}
      />,
    ).toBlob();

    const supabase = createClient();
    const path = `${data.pacienteId}/${r.numero_receta}.pdf`;
    const { error: upErr } = await supabase.storage
      .from("recetas-pdf")
      .upload(path, blob, { upsert: true, contentType: "application/pdf" });

    if (upErr) {
      setError("No se pudo subir el PDF.");
      setGuardando(false);
      return;
    }
    const res = await setRecetaPdf(r.id, data.pacienteId, path);
    setGuardando(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-hidden />
      <div className="relative flex h-full w-full flex-col bg-slate-50 shadow-xl sm:max-w-3xl">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Exportar documento
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Tipo */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["historial", "Historial completo"],
                ["receta", "Receta"],
                ["derivacion", "Derivación"],
                ["vacunacion", "Vacunación"],
              ] as [TipoDoc, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setTipo(value);
                  setPreviewUrl(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  tipo === value
                    ? "bg-teal-50 text-teal-700"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Opciones por tipo */}
          {tipo === "historial" && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Desde
                  <input
                    type="date"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                    className={field}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Hasta
                  <input
                    type="date"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                    className={field}
                  />
                </label>
              </div>
              <div className="flex flex-col gap-1.5 text-sm text-slate-700">
                {(
                  [
                    ["incluirRecetas", "Incluir recetas"],
                    ["incluirExamenes", "Incluir exámenes"],
                    ["incluirVacunas", "Incluir vacunas"],
                    ["incluirNotasInternas", "Incluir notas internas"],
                  ] as [keyof OpcionesHistorial, string][]
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opciones[key]}
                      onChange={(e) =>
                        setOpciones({ ...opciones, [key]: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {tipo === "receta" && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              {recetas.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Este paciente no tiene recetas.
                </p>
              ) : (
                <>
                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    Receta
                    <select
                      value={recetaId}
                      onChange={(e) => setRecetaId(e.target.value)}
                      className={field}
                    >
                      {recetas.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.numero_receta} · {formatearFecha(r.fecha)}
                          {!r.vigente ? " (anulada)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={guardarRecetaEnFicha}
                    disabled={guardando || !recetaId}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {guardando ? "Guardando…" : "Guardar PDF en la ficha"}
                  </button>
                </>
              )}
            </div>
          )}

          {tipo === "derivacion" && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Destino (especialista / clínica)
                <input
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Motivo de derivación
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  className={field}
                />
              </label>
              <div>
                <p className="mb-1 text-xs text-slate-400">
                  Consultas a incluir
                </p>
                {consultas.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin consultas.</p>
                ) : (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {consultas.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={consultasSel.has(c.id)}
                          onChange={(e) => {
                            const next = new Set(consultasSel);
                            if (e.target.checked) next.add(c.id);
                            else next.delete(c.id);
                            setConsultasSel(next);
                          }}
                          className="h-4 w-4"
                        />
                        {formatearFecha(c.fecha)} · {c.diagnostico}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tipo === "vacunacion" && (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              Genera la ficha con todas las vacunas registradas
              {vacunas.length === 0 ? " (actualmente no hay vacunas)." : "."}
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {previewUrl && (
            <iframe
              src={previewUrl}
              title="Vista previa"
              className="h-[60vh] w-full rounded-lg border border-slate-200"
            />
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
          <button
            onClick={vistaPrevia}
            disabled={generando}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {generando ? "Generando…" : "Vista previa"}
          </button>
          <button
            onClick={descargar}
            disabled={generando}
            className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            Descargar PDF
          </button>
        </footer>
      </div>
    </div>
  );
}
