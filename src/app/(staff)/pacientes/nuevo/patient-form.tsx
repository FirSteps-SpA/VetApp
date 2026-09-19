"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  ESPECIES,
  MODOS_OBTENCION,
  RAZONES_TENENCIA,
  SEXOS,
  type Dueno,
} from "@/lib/types/db";
import { buscarDuenos } from "@/app/(staff)/pacientes/[id]/duenos/actions";

import { crearPaciente, type FormState } from "./actions";

const initialState: FormState = { error: null };

const fieldClass =
  "rounded-control border border-border bg-surface px-3 py-2 text-base text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";
const labelClass = "flex flex-col gap-1 text-sm font-medium text-text";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent transition-colors hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Registrar paciente"}
    </button>
  );
}

function DuenoExistente({
  seleccionado,
  onSelect,
}: {
  seleccionado: Dueno | null;
  onSelect: (d: Dueno | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Dueno[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function buscar() {
    setBuscando(true);
    setResultados(await buscarDuenos(query));
    setBuscando(false);
  }

  if (seleccionado) {
    return (
      <div className="flex items-center justify-between rounded-control border border-accent bg-accent-subtle p-3">
        <div>
          <p className="text-sm font-medium text-text">
            {seleccionado.nombre}
          </p>
          <p className="text-xs text-text-muted">{seleccionado.telefono}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-xs font-medium text-accent hover:underline"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
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
          placeholder="Buscar por nombre, teléfono o email…"
          className={`${fieldClass} flex-1`}
        />
        <button
          type="button"
          onClick={buscar}
          disabled={buscando || !query.trim()}
          className="shrink-0 rounded-control border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface-sunken disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
      {resultados && resultados.length === 0 && (
        <p className="text-sm text-text-muted">Sin coincidencias.</p>
      )}
      {resultados && resultados.length > 0 && (
        <div className="space-y-1">
          {resultados.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d)}
              className="flex w-full items-center justify-between rounded-control border border-border bg-surface p-2 text-left hover:border-accent"
            >
              <span className="text-sm font-medium text-text">
                {d.nombre}
              </span>
              <span className="text-xs text-text-muted">{d.telefono}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PatientForm() {
  const [state, formAction] = useFormState(crearPaciente, initialState);
  const [modo, setModo] = useState<"nuevo" | "existente">("nuevo");
  const [seleccionado, setSeleccionado] = useState<Dueno | null>(null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="dueno_modo" value={modo} />
      <input type="hidden" name="dueno_id" value={seleccionado?.id ?? ""} />

      <fieldset className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <legend className="px-1 text-sm font-semibold text-text">
          Dueño
        </legend>

        <div className="flex gap-2">
          {(["nuevo", "existente"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`rounded-control px-3 py-1.5 text-sm font-medium transition-colors ${
                modo === m
                  ? "bg-accent-subtle text-accent"
                  : "text-text-muted hover:bg-surface-sunken"
              }`}
            >
              {m === "nuevo" ? "Dueño nuevo" : "Dueño existente"}
            </button>
          ))}
        </div>

        {modo === "existente" ? (
          <DuenoExistente
            seleccionado={seleccionado}
            onSelect={setSeleccionado}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Nombre *
              <input name="dueno_nombre" className={fieldClass} />
            </label>
            <label className={labelClass}>
              Teléfono *
              <input
                name="dueno_telefono"
                inputMode="tel"
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              RUT
              <input name="dueno_rut" className={fieldClass} />
            </label>
            <label className={labelClass}>
              Email
              <input name="dueno_email" type="email" className={fieldClass} />
            </label>
            <label className={labelClass}>
              Dirección
              <input name="dueno_direccion" className={fieldClass} />
            </label>
            <label className={labelClass}>
              Comuna
              <input name="dueno_comuna" className={fieldClass} />
            </label>
            <label className={labelClass}>
              Sector
              <input name="dueno_sector" className={fieldClass} />
            </label>
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <legend className="px-1 text-sm font-semibold text-text">
          Paciente
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Nombre *
            <input name="nombre" required className={fieldClass} />
          </label>
          <label className={labelClass}>
            RUT
            <input name="rut" className={fieldClass} />
          </label>
          <label className={labelClass}>
            Especie *
            <select name="especie" required defaultValue="" className={fieldClass}>
              <option value="" disabled>
                Seleccionar…
              </option>
              {ESPECIES.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Raza
            <input name="raza" className={fieldClass} />
          </label>
          <label className={labelClass}>
            Color
            <input name="color" className={fieldClass} />
          </label>
          <label className={labelClass}>
            Modo de obtención
            <select name="modo_obtencion" defaultValue="" className={fieldClass}>
              <option value="">Sin especificar</option>
              {MODOS_OBTENCION.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Razón de tenencia
            <select name="razon_tenencia" defaultValue="" className={fieldClass}>
              <option value="">Sin especificar</option>
              {RAZONES_TENENCIA.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Fecha de nacimiento
            <input
              name="fecha_nacimiento"
              type="date"
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Sexo
            <select name="sexo" defaultValue="" className={fieldClass}>
              <option value="">Sin especificar</option>
              {SEXOS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Peso (kg)
            <input
              name="peso_kg"
              type="number"
              step="0.01"
              min="0"
              className={fieldClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-text">
            <input name="castrado" type="checkbox" className="h-4 w-4" />
            Castrado / esterilizado
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Notas
            <textarea name="notas" rows={3} className={fieldClass} />
          </label>
        </div>
      </fieldset>

      {state.error && (
        <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
