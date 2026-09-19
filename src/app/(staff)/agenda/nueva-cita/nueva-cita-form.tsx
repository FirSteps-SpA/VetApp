"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Paciente } from "@/lib/types/db";
import { isoDia } from "@/lib/utils/format";

import { buscarPacientesAgenda, crearCita } from "../actions";

const field =
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";
const label = "flex flex-col gap-1 text-sm font-medium text-text";

export function NuevaCitaForm({
  preseleccionado,
  fechaInicial,
}: {
  preseleccionado: { id: string; nombre: string } | null;
  fechaInicial: string;
}) {
  const router = useRouter();

  const [paciente, setPaciente] = useState(preseleccionado);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Paciente[] | null>(null);

  const [fecha, setFecha] = useState(fechaInicial || isoDia(new Date()));
  const [hora, setHora] = useState("09:00");
  const [duracion, setDuracion] = useState(30);
  const [motivo, setMotivo] = useState("");
  const [notas, setNotas] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buscar() {
    setResultados(await buscarPacientesAgenda(query));
  }

  async function guardar() {
    if (!paciente) {
      setError("Selecciona un paciente.");
      return;
    }
    if (!motivo.trim()) {
      setError("El motivo es obligatorio.");
      return;
    }
    const fechaHora = new Date(`${fecha}T${hora}:00`);
    if (Number.isNaN(fechaHora.getTime())) {
      setError("Fecha u hora inválida.");
      return;
    }

    setGuardando(true);
    setError(null);
    const res = await crearCita({
      pacienteId: paciente.id,
      fecha_hora: fechaHora.toISOString(),
      duracion_minutos: duracion,
      motivo,
      notas,
    });
    setGuardando(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push(`/agenda?fecha=${fecha}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Paciente */}
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="mb-2 text-sm font-semibold text-text">Paciente</p>
        {paciente ? (
          <div className="flex items-center justify-between rounded-control border border-accent bg-accent-subtle p-2">
            <span className="text-sm font-medium text-text">
              {paciente.nombre}
            </span>
            {!preseleccionado && (
              <button
                type="button"
                onClick={() => setPaciente(null)}
                className="text-xs font-medium text-accent hover:underline"
              >
                Cambiar
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    buscar();
                  }
                }}
                placeholder="Buscar paciente…"
                className={field}
              />
              <button
                type="button"
                onClick={buscar}
                className="shrink-0 rounded-control border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface-sunken"
              >
                Buscar
              </button>
            </div>
            {resultados?.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaciente({ id: p.id, nombre: p.nombre })}
                className="flex w-full items-center justify-between rounded-control border border-border p-2 text-left hover:border-accent"
              >
                <span className="text-sm font-medium text-text">
                  {p.nombre}
                </span>
                <span className="text-xs text-text-muted">{p.numero_ficha}</span>
              </button>
            ))}
            {resultados && resultados.length === 0 && (
              <p className="text-sm text-text-muted">Sin coincidencias.</p>
            )}
          </div>
        )}
      </div>

      {/* Datos de la cita */}
      <div className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2">
        <label className={label}>
          Fecha
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={field}
          />
        </label>
        <label className={label}>
          Hora
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={field}
          />
        </label>
        <label className={label}>
          Duración (minutos)
          <input
            type="number"
            min={5}
            step={5}
            value={duracion}
            onChange={(e) => setDuracion(Number(e.target.value))}
            className={field}
          />
        </label>
        <label className={label}>
          Motivo
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className={field}
          />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Notas
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className={field}
          />
        </label>
      </div>

      {error && (
        <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">
          {error}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Agendar cita"}
        </button>
      </div>
    </div>
  );
}
