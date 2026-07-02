"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { TIPOS_CONSULTA, type ConsultaConVet, type TipoConsulta } from "@/lib/types/db";

import { actualizarConsulta } from "../../actions";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const label = "flex flex-col gap-1 text-sm font-medium text-slate-700";

export function EditConsultaForm({
  pacienteId,
  consulta,
}: {
  pacienteId: string;
  consulta: ConsultaConVet;
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoConsulta>(consulta.tipo);
  const [motivo, setMotivo] = useState(consulta.motivo);
  const [anamnesis, setAnamnesis] = useState(consulta.anamnesis ?? "");
  const [examenFisico, setExamenFisico] = useState(consulta.examen_fisico ?? "");
  const [diagnostico, setDiagnostico] = useState(consulta.diagnostico);
  const [diagDiferencial, setDiagDiferencial] = useState(
    consulta.diagnostico_diferencial ?? "",
  );
  const [tratamiento, setTratamiento] = useState(consulta.tratamiento);
  const [pesoKg, setPesoKg] = useState(consulta.peso_kg?.toString() ?? "");
  const [temperatura, setTemperatura] = useState(
    consulta.temperatura_c?.toString() ?? "",
  );
  const [notas, setNotas] = useState(consulta.notas ?? "");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    const res = await actualizarConsulta(consulta.id, pacienteId, {
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
    });
    setGuardando(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push(`/pacientes/${pacienteId}/consultas/${consulta.id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
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
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Anamnesis
          <textarea value={anamnesis} onChange={(e) => setAnamnesis(e.target.value)} rows={2} className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Examen físico
          <textarea value={examenFisico} onChange={(e) => setExamenFisico(e.target.value)} rows={2} className={field} />
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
          Diagnóstico *
          <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} rows={2} className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Diagnóstico diferencial
          <textarea value={diagDiferencial} onChange={(e) => setDiagDiferencial(e.target.value)} rows={2} className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Tratamiento *
          <textarea value={tratamiento} onChange={(e) => setTratamiento(e.target.value)} rows={2} className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Notas
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={field} />
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
