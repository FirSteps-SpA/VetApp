"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { useRouter } from "next/navigation";

import type {
  ClinicaConfig,
  DuenoDePaciente,
  EsquemaVacunacion,
  EstadoAlertaVacuna,
  Paciente,
  Vacuna,
} from "@/lib/types/db";
import { formatearFecha, isoDia } from "@/lib/utils/format";

import { crearVacuna, eliminarVacuna } from "./actions";
import { imprimirVacunacion } from "../print/imprimir";
import { PrintButton } from "../print/print-button";

const field =
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";

const hoy = () => isoDia(new Date());

function addDias(iso: string, dias: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + dias);
  return isoDia(d);
}

const CHIP: Record<EstadoAlertaVacuna, string> = {
  vencida: "bg-danger-subtle text-text",
  proxima: "bg-warning-subtle text-text",
  al_dia: "bg-accent-subtle text-accent",
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
  clinica,
  paciente,
  dueno,
}: {
  pacienteId: string;
  vacunas: Vacuna[];
  esquemas: EsquemaVacunacion[];
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
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
      {vacunas.length > 0 && (
        <div className="flex justify-end">
          <PrintButton
            label="Imprimir ficha de vacunación"
            onClick={() =>
              imprimirVacunacion({ clinica, paciente, dueno, vacunas })
            }
          />
        </div>
      )}

      {!abierto ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="inline-flex items-center gap-1.5 rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:opacity-90"
        >
          <Icon name="plus" />
          Registrar vacuna
        </button>
      ) : (
        <div className="space-y-3 rounded-card border border-border bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-text">
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
              <label className="flex flex-col gap-1 text-sm text-text">
                Nombre
                <input
                  value={nombreLibre}
                  onChange={(e) => setNombreLibre(e.target.value)}
                  className={field}
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm text-text">
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
            <label className="flex flex-col gap-1 text-sm text-text">
              Próxima dosis
              <input
                type="date"
                value={proxima}
                onChange={(e) => setProxima(e.target.value)}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-text">
              Laboratorio
              <input
                value={laboratorio}
                onChange={(e) => setLaboratorio(e.target.value)}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-text">
              Lote
              <input
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-text sm:col-span-2">
              Notas
              <input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className={field}
              />
            </label>
          </div>

          {error && (
            <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">
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
              className="rounded-control border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-sunken"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="rounded-control bg-accent px-4 py-1.5 text-sm font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
            >
              {guardando ? "Guardando…" : "Registrar"}
            </button>
          </div>
        </div>
      )}

      {/* Plan sugerido según el esquema de la especie */}
      {esquemas.length > 0 && (
        <div className="rounded-card border border-border bg-surface p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
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
                  className="flex items-center gap-2 text-sm text-text"
                >
                  <span className="flex-1">
                    {e.nombre_vacuna}
                    {e.es_obligatoria && (
                      <span className="ml-2 rounded-pill bg-surface-sunken px-1.5 py-0.5 text-xs text-text-muted">
                        obligatoria
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-text-muted">
                    cada {e.intervalo_dias} días
                  </span>
                  {aplicada && (
                    <span className="rounded-pill bg-accent-subtle px-2 py-0.5 text-xs text-accent">
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
        <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-sm text-text-muted">
          Sin vacunas registradas.
        </div>
      ) : (
        <div className="space-y-2">
          {vacunas.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 rounded-control border border-border bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-text">
                  {v.nombre_vacuna}
                  <span
                    className={`rounded-pill px-2 py-0.5 text-xs font-medium ${CHIP[v.estado_alerta]}`}
                  >
                    {CHIP_LABEL[v.estado_alerta]}
                  </span>
                </p>
                <p className="text-xs text-text-muted">
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
                className="text-xs text-danger hover:underline"
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
