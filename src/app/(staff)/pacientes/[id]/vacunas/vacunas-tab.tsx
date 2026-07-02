"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { EsquemaVacunacion, EstadoAlertaVacuna, Vacuna } from "@/lib/types/db";
import { formatearFecha, isoDia } from "@/lib/utils/format";

import { crearVacuna, eliminarVacuna } from "./actions";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

const hoy = () => isoDia(new Date());

function addDias(iso: string, dias: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + dias);
  return isoDia(d);
}

const CHIP: Record<EstadoAlertaVacuna, string> = {
  vencida: "bg-red-50 text-red-700",
  proxima: "bg-amber-50 text-amber-700",
  al_dia: "bg-teal-50 text-teal-700",
};
const CHIP_LABEL: Record<EstadoAlertaVacuna, string> = {
  vencida: "Vencida",
  proxima: "Próxima",
  al_dia: "Al día",
};

export function VacunasTab({
  pacienteId,
  vacunas,
  esquemas,
}: {
  pacienteId: string;
  vacunas: Vacuna[];
  esquemas: EsquemaVacunacion[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombreSel, setNombreSel] = useState("");
  const [nombreLibre, setNombreLibre] = useState("");
  const [laboratorio, setLaboratorio] = useState("");
  const [lote, setLote] = useState("");
  const [fechaAplic, setFechaAplic] = useState(hoy());
  const [proxima, setProxima] = useState("");
  const [notas, setNotas] = useState("");

  const usaLibre = nombreSel === "__otro__";
  const nombreFinal = usaLibre ? nombreLibre : nombreSel;

  // Al elegir un esquema o cambiar la fecha, sugiere la próxima dosis.
  function recalcularProxima(nombre: string, fecha: string) {
    const esquema = esquemas.find((e) => e.nombre_vacuna === nombre);
    if (esquema && fecha) setProxima(addDias(fecha, esquema.intervalo_dias));
  }

  function reset() {
    setNombreSel("");
    setNombreLibre("");
    setLaboratorio("");
    setLote("");
    setFechaAplic(hoy());
    setProxima("");
    setNotas("");
    setError(null);
  }

  async function guardar() {
    if (!nombreFinal.trim()) {
      setError("Selecciona o escribe el nombre de la vacuna.");
      return;
    }
    setGuardando(true);
    setError(null);
    const res = await crearVacuna({
      pacienteId,
      nombre_vacuna: nombreFinal,
      laboratorio,
      lote,
      fecha_aplicacion: fechaAplic,
      proxima_dosis: proxima || undefined,
      notas,
    });
    setGuardando(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    reset();
    setAbierto(false);
    router.refresh();
  }

  async function quitar(id: string) {
    if (!window.confirm("¿Eliminar este registro de vacuna?")) return;
    const res = await eliminarVacuna(id, pacienteId);
    if (res.error) setError(res.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      {!abierto ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          + Registrar vacuna
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Vacuna
              <select
                value={nombreSel}
                onChange={(e) => {
                  setNombreSel(e.target.value);
                  if (e.target.value !== "__otro__")
                    recalcularProxima(e.target.value, fechaAplic);
                }}
                className={field}
              >
                <option value="">Seleccionar…</option>
                {esquemas.map((e) => (
                  <option key={e.id} value={e.nombre_vacuna}>
                    {e.nombre_vacuna}
                  </option>
                ))}
                <option value="__otro__">Otra…</option>
              </select>
            </label>
            {usaLibre && (
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Nombre
                <input
                  value={nombreLibre}
                  onChange={(e) => setNombreLibre(e.target.value)}
                  className={field}
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Fecha de aplicación
              <input
                type="date"
                value={fechaAplic}
                onChange={(e) => {
                  setFechaAplic(e.target.value);
                  recalcularProxima(nombreFinal, e.target.value);
                }}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Próxima dosis
              <input
                type="date"
                value={proxima}
                onChange={(e) => setProxima(e.target.value)}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Laboratorio
              <input
                value={laboratorio}
                onChange={(e) => setLaboratorio(e.target.value)}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Lote
              <input
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
              Notas
              <input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className={field}
              />
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                setAbierto(false);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {guardando ? "Guardando…" : "Registrar"}
            </button>
          </div>
        </div>
      )}

      {/* Plan sugerido según el esquema de la especie */}
      {esquemas.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Plan sugerido ({esquemas[0].especie})
          </h3>
          <div className="space-y-1">
            {esquemas.map((e) => {
              const aplicada = vacunas.some(
                (v) =>
                  v.nombre_vacuna.toLowerCase() ===
                  e.nombre_vacuna.toLowerCase(),
              );
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <span className="flex-1">
                    {e.nombre_vacuna}
                    {e.es_obligatoria && (
                      <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                        obligatoria
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400">
                    cada {e.intervalo_dias} días
                  </span>
                  {aplicada && (
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                      ✓ registrada
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      {vacunas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Sin vacunas registradas.
        </div>
      ) : (
        <div className="space-y-2">
          {vacunas.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  {v.nombre_vacuna}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${CHIP[v.estado_alerta]}`}
                  >
                    {CHIP_LABEL[v.estado_alerta]}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  Aplicada {formatearFecha(v.fecha_aplicacion)}
                  {v.proxima_dosis
                    ? ` · próxima ${formatearFecha(v.proxima_dosis)}`
                    : ""}
                  {v.laboratorio ? ` · ${v.laboratorio}` : ""}
                  {v.lote ? ` · lote ${v.lote}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => quitar(v.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
