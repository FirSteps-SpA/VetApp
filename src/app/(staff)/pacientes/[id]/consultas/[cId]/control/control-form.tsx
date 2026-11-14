"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  SelectorVeterinario,
  veterinarioPorDefecto,
  type VeterinarioOpcion,
} from "@/components/selector-veterinario";
import type { ConsultaConVet } from "@/lib/types/db";

import { crearControl } from "../../actions";
import { RecetaEditor, useReceta } from "../../receta-editor";

const field =
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-base text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";
const label = "flex flex-col gap-1 text-sm font-medium text-text";

// Formulario reducido de control: solo la evolución es obligatoria; motivo,
// diagnóstico y tratamiento vienen de la consulta de origen (editables).
export function ControlForm({
  pacienteId,
  origen,
  veterinarios,
  usuarioId,
}: {
  pacienteId: string;
  origen: ConsultaConVet;
  veterinarios: VeterinarioOpcion[];
  usuarioId: string | null;
}) {
  const router = useRouter();
  const [veterinarioId, setVeterinarioId] = useState(() =>
    veterinarioPorDefecto(veterinarios, usuarioId),
  );
  const [evolucion, setEvolucion] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [motivo, setMotivo] = useState(origen.motivo);
  const [diagnostico, setDiagnostico] = useState(origen.diagnostico);
  const [tratamiento, setTratamiento] = useState(origen.tratamiento);
  const [proximoFecha, setProximoFecha] = useState("");
  const [proximoHora, setProximoHora] = useState("");
  const receta = useReceta();

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (!veterinarioId) {
      setError("Elige el veterinario responsable.");
      return;
    }
    if (!evolucion.trim()) {
      setError("La evolución es obligatoria.");
      return;
    }
    setGuardando(true);
    setError(null);
    const res = await crearControl(origen.id, {
      veterinarioId,
      evolucion,
      motivo,
      diagnostico,
      tratamiento,
      peso_kg: pesoKg,
      temperatura_c: temperatura,
      receta: receta.aInput(),
      proximoFecha: proximoFecha || undefined,
      proximoHora: proximoHora || undefined,
    });
    setGuardando(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/pacientes/${pacienteId}/consultas/${res.origenId}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2">
        <label className={`${label} sm:col-span-2`}>
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
        <label className={`${label} sm:col-span-2`}>
          Evolución *
          <textarea
            value={evolucion}
            onChange={(e) => setEvolucion(e.target.value)}
            rows={3}
            autoFocus
            className={field}
          />
        </label>
        <label className={label}>
          Peso (kg)
          <input type="number" step="0.01" min="0" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} className={field} />
        </label>
        <label className={label}>
          Temperatura (°C)
          <input type="number" step="0.1" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Motivo *
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Diagnóstico *
          <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} rows={2} className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Tratamiento *
          <textarea value={tratamiento} onChange={(e) => setTratamiento(e.target.value)} rows={2} className={field} />
        </label>
      </div>

      <RecetaEditor receta={receta} />

      <div className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2">
        <h3 className="text-sm font-semibold text-text sm:col-span-2">
          Próximo control (opcional)
        </h3>
        <label className={label}>
          Fecha
          <input type="date" value={proximoFecha} onChange={(e) => setProximoFecha(e.target.value)} className={field} />
        </label>
        <label className={label}>
          Hora
          <input type="time" value={proximoHora} onChange={(e) => setProximoHora(e.target.value)} className={field} />
        </label>
      </div>

      {error && (
        <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-control border border-border px-4 py-2.5 text-sm font-medium text-text hover:bg-surface-sunken"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar control"}
        </button>
      </div>
    </div>
  );
}
