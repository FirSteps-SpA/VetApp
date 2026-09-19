"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";

import {
  DerivacionDoc,
  HistorialDoc,
  RecetaDoc,
  VacunacionDoc,
  type OpcionesHistorial,
  type RecetaItem,
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
type Alcance = "completo" | "rango";

const TIPOS: [TipoDoc, string][] = [
  ["historial", "Historial"],
  ["receta", "Recetas"],
  ["vacunacion", "Vacunas"],
  ["derivacion", "Derivación"],
];

const field =
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";

export default function ExportPanel({
  data,
  onClose,
}: {
  data: ExportData;
  onClose: () => void;
}) {
  const { clinica, paciente, dueno, consultas, recetas, examenes, vacunas } =
    data;

  const [tipo, setTipo] = useState<TipoDoc>("historial");
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewStale, setPreviewStale] = useState(false);

  // Historial.
  const [alcance, setAlcance] = useState<Alcance>("completo");
  const [opciones, setOpciones] = useState<OpcionesHistorial>({
    incluirRecetas: true,
    incluirExamenes: true,
    incluirVacunas: true,
    incluirNotasInternas: false,
  });
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Recetas (multi-selección).
  const [recetasSel, setRecetasSel] = useState<Set<string>>(
    () => new Set(recetas[0] ? [recetas[0].id] : []),
  );

  // Derivación.
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [consultasSel, setConsultasSel] = useState<Set<string>>(new Set());

  // --- Vista previa: invalidación y limpieza de blobs ---
  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  // Cerrar con Escape + foco inicial.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function limpiarPreview() {
    setPreviewUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    setPreviewStale(false);
    setError(null);
  }

  // Cualquier cambio de selección deja la vista previa desactualizada.
  function tocado() {
    setPreviewStale(true);
  }

  function cambiarTipo(t: TipoDoc) {
    if (t === tipo) return;
    setTipo(t);
    limpiarPreview();
  }

  // --- Contenido del historial según alcance + inclusiones (única fuente
  // usada tanto por el documento como por el resumen "Incluye…"). ---
  const historial = useMemo(() => {
    const enRango = (fechaISO: string) => {
      if (alcance !== "rango") return true;
      const f = fechaISO.slice(0, 10);
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    };
    return {
      consultasInc: consultas.filter((c) => enRango(c.fecha)),
      recetasInc: opciones.incluirRecetas
        ? recetas.filter((r) => enRango(r.fecha))
        : [],
      examenesInc: opciones.incluirExamenes
        ? examenes.filter((e) => enRango(e.fecha))
        : [],
      vacunasInc: opciones.incluirVacunas
        ? vacunas.filter((v) => enRango(v.fecha_aplicacion))
        : [],
    };
  }, [alcance, desde, hasta, opciones, consultas, recetas, examenes, vacunas]);

  function nombreVetDeReceta(r: Receta): string | null {
    const c = consultas.find((x) => x.id === r.consulta_id);
    return c?.veterinario?.nombre ?? null;
  }

  const recetasMarcadas = useMemo(
    () => recetas.filter((r) => recetasSel.has(r.id)),
    [recetas, recetasSel],
  );

  // --- Validez: motivo por el cual NO se puede generar (o null si se puede). ---
  const motivoInvalido = useMemo<string | null>(() => {
    if (tipo === "historial") {
      if (alcance === "rango" && desde && hasta && desde > hasta) {
        return "El rango es inválido: «Desde» es posterior a «Hasta».";
      }
      const total =
        historial.consultasInc.length +
        historial.recetasInc.length +
        historial.examenesInc.length +
        historial.vacunasInc.length;
      if (total === 0) return "La selección no incluye ningún contenido.";
      return null;
    }
    if (tipo === "receta") {
      return recetasMarcadas.length === 0 ? "Marca al menos una receta." : null;
    }
    if (tipo === "derivacion") {
      if (!destino.trim()) return "Indica el destino de la derivación.";
      if (consultasSel.size === 0)
        return "Selecciona al menos una consulta a incluir.";
      return null;
    }
    // vacunacion
    return vacunas.length === 0 ? "No hay vacunas registradas." : null;
  }, [
    tipo,
    alcance,
    desde,
    hasta,
    historial,
    recetasMarcadas,
    destino,
    consultasSel,
    vacunas,
  ]);

  // --- Resumen "Incluye: …" en vivo. ---
  const resumen = useMemo<string>(() => {
    const plural = (n: number, s: string, p: string) =>
      `${n} ${n === 1 ? s : p}`;
    if (tipo === "historial") {
      const partes = [plural(historial.consultasInc.length, "consulta", "consultas")];
      if (opciones.incluirRecetas)
        partes.push(plural(historial.recetasInc.length, "receta", "recetas"));
      if (opciones.incluirExamenes)
        partes.push(plural(historial.examenesInc.length, "examen", "exámenes"));
      if (opciones.incluirVacunas)
        partes.push(plural(historial.vacunasInc.length, "vacuna", "vacunas"));
      return partes.join(" · ");
    }
    if (tipo === "receta")
      return plural(recetasMarcadas.length, "receta", "recetas");
    if (tipo === "derivacion")
      return plural(consultasSel.size, "consulta", "consultas");
    return plural(vacunas.length, "vacuna", "vacunas");
  }, [
    tipo,
    historial,
    opciones,
    recetasMarcadas,
    consultasSel,
    vacunas,
  ]);

  function buildDoc(): React.ReactElement | null {
    if (tipo === "receta") {
      if (recetasMarcadas.length === 0) return null;
      const items: RecetaItem[] = recetasMarcadas.map((r) => ({
        receta: r,
        veterinario: nombreVetDeReceta(r),
      }));
      return (
        <RecetaDoc
          clinica={clinica}
          paciente={paciente}
          dueno={dueno}
          items={items}
        />
      );
    }
    if (tipo === "historial") {
      return (
        <HistorialDoc
          clinica={clinica}
          paciente={paciente}
          dueno={dueno}
          consultas={historial.consultasInc}
          recetas={historial.recetasInc}
          examenes={historial.examenesInc}
          vacunas={historial.vacunasInc}
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
    if (!doc) return null;
    setError(null);
    return pdf(doc).toBlob();
  }

  async function vistaPrevia() {
    setGenerando(true);
    try {
      const blob = await generarBlob();
      if (!blob) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewStale(false);
    } catch {
      setError("No se pudo generar la vista previa.");
    } finally {
      setGenerando(false);
    }
  }

  function nombreArchivo(): string {
    const base = paciente.numero_ficha;
    if (tipo === "receta") {
      return recetasMarcadas.length === 1
        ? `${base}_${recetasMarcadas[0].numero_receta}.pdf`
        : `${base}_recetas.pdf`;
    }
    const map: Record<Exclude<TipoDoc, "receta">, string> = {
      historial: "historial",
      derivacion: "derivacion",
      vacunacion: "vacunacion",
    };
    return `${base}_${map[tipo]}.pdf`;
  }

  async function descargar() {
    setGenerando(true);
    try {
      const blob = await generarBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo();
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo generar el documento.");
    } finally {
      setGenerando(false);
    }
  }

  const acciones_off = generando || motivoInvalido !== null;

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/30"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Exportar documento"
        tabIndex={-1}
        className="relative flex h-full w-full flex-col bg-surface-sunken shadow-xl outline-none sm:max-w-3xl"
      >
        <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
          <h2 className="text-lg font-semibold text-text">
            Exportar documento
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-control px-2 py-1 text-text-muted hover:bg-surface-sunken hover:text-text-muted"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Tipo (tarjetas 2×2) */}
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => cambiarTipo(value)}
                aria-pressed={tipo === value}
                className={`rounded-card border px-4 py-3 text-sm font-semibold transition-colors ${
                  tipo === value
                    ? "border-accent bg-accent text-on-accent"
                    : "border-border bg-surface text-text hover:bg-surface-sunken"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Opciones por tipo */}
          {tipo === "historial" && (
            <div className="space-y-3 rounded-card border border-border bg-surface p-4">
              <div className="flex flex-wrap gap-4 text-sm text-text">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="alcance"
                    checked={alcance === "completo"}
                    onChange={() => {
                      setAlcance("completo");
                      tocado();
                    }}
                    className="h-4 w-4"
                  />
                  Historial completo
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="alcance"
                    checked={alcance === "rango"}
                    onChange={() => {
                      setAlcance("rango");
                      tocado();
                    }}
                    className="h-4 w-4"
                  />
                  Rango de fechas
                </label>
              </div>

              {alcance === "rango" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm text-text">
                    Desde
                    <input
                      type="date"
                      value={desde}
                      onChange={(e) => {
                        setDesde(e.target.value);
                        tocado();
                      }}
                      className={field}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-text">
                    Hasta
                    <input
                      type="date"
                      value={hasta}
                      onChange={(e) => {
                        setHasta(e.target.value);
                        tocado();
                      }}
                      className={field}
                    />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-text sm:grid-cols-2">
                {(
                  [
                    ["incluirRecetas", "Incluir recetas"],
                    ["incluirVacunas", "Incluir vacunas"],
                    ["incluirExamenes", "Incluir exámenes"],
                    ["incluirNotasInternas", "Incluir notas internas"],
                  ] as [keyof OpcionesHistorial, string][]
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opciones[key]}
                      onChange={(e) => {
                        setOpciones({ ...opciones, [key]: e.target.checked });
                        tocado();
                      }}
                      className="h-4 w-4"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {tipo === "receta" && (
            <div className="space-y-2 rounded-card border border-border bg-surface p-4">
              {recetas.length === 0 ? (
                <p className="text-sm text-text-muted">
                  Este paciente no tiene recetas.
                </p>
              ) : (
                <>
                  <p className="text-xs text-text-muted">
                    Marca las recetas a incluir (se combinan en un PDF)
                  </p>
                  <div className="max-h-60 space-y-1 overflow-y-auto">
                    {recetas.map((r) => (
                      <label
                        key={r.id}
                        className="flex items-center gap-2 rounded-control px-1 py-1.5 text-sm text-text hover:bg-surface-sunken"
                      >
                        <input
                          type="checkbox"
                          checked={recetasSel.has(r.id)}
                          onChange={(e) => {
                            const next = new Set(recetasSel);
                            if (e.target.checked) next.add(r.id);
                            else next.delete(r.id);
                            setRecetasSel(next);
                            tocado();
                          }}
                          className="h-4 w-4"
                        />
                        <span className="font-medium text-text">
                          {r.numero_receta}
                        </span>
                        <span className="text-text-muted">
                          {formatearFecha(r.fecha)}
                        </span>
                        {!r.vigente && (
                          <span className="text-xs text-text-muted">
                            (anulada)
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tipo === "derivacion" && (
            <div className="space-y-3 rounded-card border border-border bg-surface p-4">
              <label className="flex flex-col gap-1 text-sm text-text">
                Destino (especialista / clínica)
                <input
                  value={destino}
                  onChange={(e) => {
                    setDestino(e.target.value);
                    tocado();
                  }}
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-text">
                Motivo de derivación
                <textarea
                  value={motivo}
                  onChange={(e) => {
                    setMotivo(e.target.value);
                    tocado();
                  }}
                  rows={2}
                  className={field}
                />
              </label>
              <div>
                <p className="mb-1 text-xs text-text-muted">
                  Consultas a incluir
                </p>
                {consultas.length === 0 ? (
                  <p className="text-sm text-text-muted">Sin consultas.</p>
                ) : (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {consultas.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 text-sm text-text"
                      >
                        <input
                          type="checkbox"
                          checked={consultasSel.has(c.id)}
                          onChange={(e) => {
                            const next = new Set(consultasSel);
                            if (e.target.checked) next.add(c.id);
                            else next.delete(c.id);
                            setConsultasSel(next);
                            tocado();
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
            <p className="rounded-card border border-border bg-surface p-4 text-sm text-text-muted">
              Genera la ficha con todas las vacunas registradas
              {vacunas.length === 0 ? " (actualmente no hay vacunas)." : "."}
            </p>
          )}

          {/* Resumen del contenido */}
          <p className="text-sm text-text-muted">
            <span className="text-text-muted">Incluye:</span> {resumen}
          </p>

          {/* Motivo por el que no se puede generar */}
          {motivoInvalido && (
            <p className="rounded-control bg-warning-subtle px-3 py-2 text-sm text-text">
              {motivoInvalido}
            </p>
          )}

          {error && (
            <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">
              {error}
            </p>
          )}

          {previewUrl && (
            <div className="relative">
              {previewStale && (
                <div className="absolute right-2 top-2 rounded-pill bg-warning-subtle px-3 py-1 text-xs font-medium text-text shadow">
                  Vista previa desactualizada · vuelve a generarla
                </div>
              )}
              <iframe
                src={previewUrl}
                title="Vista previa"
                className={`h-[60vh] w-full rounded-control border border-border ${
                  previewStale ? "opacity-50" : ""
                }`}
              />
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-surface px-5 py-3">
          <button
            type="button"
            onClick={vistaPrevia}
            disabled={acciones_off}
            className="rounded-control border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-sunken disabled:opacity-50"
          >
            {generando ? "Generando…" : "Vista previa"}
          </button>
          <button
            type="button"
            onClick={descargar}
            disabled={acciones_off}
            className="rounded-control bg-accent px-5 py-2 text-sm font-medium text-on-accent hover:opacity-90 disabled:opacity-50"
          >
            Descargar PDF
          </button>
        </footer>
      </div>
    </div>
  );
}
