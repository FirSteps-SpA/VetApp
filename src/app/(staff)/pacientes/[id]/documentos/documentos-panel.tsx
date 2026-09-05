"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";

import {
  AutorizacionDoc,
  CAMPOS_EXTRA,
  type AutorizacionData,
  type TipoAutorizacion,
} from "@/lib/pdf/autorizaciones";
import {
  generarCertificadoMicrochip,
  type MicrochipData,
} from "@/lib/pdf/microchip-overlay";
import {
  labelEspecie,
  labelTipoDocumentoLegal,
  MODOS_OBTENCION,
  RAZONES_TENENCIA,
  TIPOS_DOCUMENTO_LEGAL,
  type ClinicaConfig,
  type DocumentoEmitido,
  type DuenoDePaciente,
  type Paciente,
  type TipoDocumentoLegal,
  type TituloProfesional,
} from "@/lib/types/db";
import { formatearFecha } from "@/lib/utils/format";

import { registrarDocumentoEmitido } from "./actions";

// Datos mínimos del veterinario a cargo (una fila de `usuarios`). El emisor es
// el staff autenticado; `veterinarios` son los elegibles para emitir en nombre
// de otro.
export interface EmisorDoc {
  id: string;
  nombre: string;
  rut: string | null;
  titulo_profesional: TituloProfesional | null;
}

export interface DocumentosData {
  pacienteId: string;
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
  emitidos: DocumentoEmitido[];
  emisor: EmisorDoc | null;
  veterinarios: EmisorDoc[];
}

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

const hoy = () => formatearFecha(new Date().toISOString());

// Opciones para el componente `Selecta` (que espera tuplas [valor, etiqueta]).
const MODO_OBTENCION = MODOS_OBTENCION.map(
  (m) => [m.value, m.label] as [string, string],
);
const RAZON_TENENCIA = RAZONES_TENENCIA.map(
  (r) => [r.value, r.label] as [string, string],
);

// "Juan Pablo Pérez Soto" -> nombres: "Juan", apellidos: "Pablo Pérez Soto".
// El split es aproximado; ambos campos quedan editables en el panel.
function splitNombre(nombre: string): { nombres: string; apellidos: string } {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return {
    nombres: partes[0] ?? "",
    apellidos: partes.slice(1).join(" "),
  };
}

// Campos del veterinario a cargo a partir de un registro de `usuarios`. El
// título profesional guardado coincide 1:1 con el check del formulario oficial.
function vetFields(vet: EmisorDoc | null): Pick<
  MicrochipData,
  "vetNombres" | "vetApellidos" | "vetRut" | "tipoProfesional"
> {
  const { nombres, apellidos } = splitNombre(vet?.nombre ?? "");
  return {
    vetNombres: nombres,
    vetApellidos: apellidos,
    vetRut: vet?.rut ?? "",
    tipoProfesional: vet?.titulo_profesional ?? "",
  };
}

function initAuth(data: DocumentosData) {
  const { clinica, paciente, dueno } = data;
  return {
    clinica: clinica?.nombre_clinica ?? "",
    duenoNombre: dueno?.nombre ?? "",
    domicilio: dueno?.direccion ?? "",
    sector: dueno?.sector ?? "",
    comuna: dueno?.comuna ?? "",
    telefono: dueno?.telefono ?? "",
    duenoRut: dueno?.rut ?? "",
    mascotaNombre: paciente.nombre,
    especie: labelEspecie(paciente.especie),
    sexo: paciente.sexo ?? "",
    fechaNacimiento: paciente.fecha_nacimiento
      ? formatearFecha(paciente.fecha_nacimiento)
      : "",
    raza: paciente.raza ?? "",
    antecedentes: "",
    medicoACargo: data.emisor?.nombre ?? "",
    extra: {} as Record<string, string>,
  };
}
type AuthState = ReturnType<typeof initAuth>;

function initMicro(data: DocumentosData): MicrochipData {
  const { clinica, paciente } = data;
  return {
    nombre: paciente.nombre,
    especie:
      paciente.especie === "perro" || paciente.especie === "gato"
        ? paciente.especie
        : "",
    sexo:
      paciente.sexo === "macho" || paciente.sexo === "hembra"
        ? paciente.sexo
        : "",
    raza: paciente.raza ?? "",
    esterilizado:
      paciente.castrado === true ? "si" : paciente.castrado === false ? "no" : "",
    color: paciente.color ?? "",
    fechaNacimiento: paciente.fecha_nacimiento
      ? formatearFecha(paciente.fecha_nacimiento)
      : "",
    tipoProcedimiento: "",
    modoObtencion: paciente.modo_obtencion ?? "",
    razonTenencia: paciente.razon_tenencia ?? "",
    ...vetFields(data.emisor),
    comuna: clinica?.ciudad ?? "",
    fechaProcedimiento: hoy(),
  };
}

export default function DocumentosPanel({
  data,
  onClose,
}: {
  data: DocumentosData;
  onClose: () => void;
}) {
  const [tipo, setTipo] = useState<TipoDocumentoLegal>("eutanasia");
  const [auth, setAuth] = useState<AuthState>(() => initAuth(data));
  const [micro, setMicro] = useState<MicrochipData>(() => initMicro(data));
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Veterinario a cargo: por defecto el emisor, con opción de emitir en nombre
  // de otro. La lista incluye al emisor aunque no sea veterinario.
  const vets = useMemo<EmisorDoc[]>(() => {
    const porId = new Map<string, EmisorDoc>();
    if (data.emisor) porId.set(data.emisor.id, data.emisor);
    for (const v of data.veterinarios) porId.set(v.id, v);
    return Array.from(porId.values());
  }, [data.emisor, data.veterinarios]);
  const [vetId, setVetId] = useState(() => data.emisor?.id ?? "");

  function aplicarVet(id: string) {
    setVetId(id);
    const vet = vets.find((v) => v.id === id) ?? null;
    setAuth((s) => ({ ...s, medicoACargo: vet?.nombre ?? "" }));
    setMicro((s) => ({ ...s, ...vetFields(vet) }));
  }

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const esMicrochip = tipo === "microchip";
  const tipoAuth = tipo as TipoAutorizacion; // válido cuando !esMicrochip

  const setA = (patch: Partial<AuthState>) =>
    setAuth((s) => ({ ...s, ...patch }));
  const setM = (patch: Partial<MicrochipData>) =>
    setMicro((s) => ({ ...s, ...patch }));

  const motivoInvalido = useMemo<string | null>(() => {
    if (esMicrochip) {
      if (!micro.nombre.trim()) return "Falta el nombre del animal.";
      if (!micro.especie) return "Marca la especie (perro o gato).";
      if (!micro.tipoProcedimiento)
        return "Marca el tipo de procedimiento (implantación o verificación).";
      return null;
    }
    if (!auth.duenoNombre.trim()) return "Falta el nombre del autorizante.";
    if (!auth.mascotaNombre.trim()) return "Falta el nombre del animal.";
    if (!auth.medicoACargo.trim()) return "Indica el médico veterinario a cargo.";
    return null;
  }, [esMicrochip, micro, auth]);

  function buildAutorizacionData(): AutorizacionData {
    return {
      tipo: tipoAuth,
      // El encabezado necesita los datos completos de la clínica; el nombre
      // sigue siendo editable en el panel y se refleja sobre el objeto base.
      clinica: data.clinica
        ? { ...data.clinica, nombre_clinica: auth.clinica || data.clinica.nombre_clinica }
        : null,
      duenoNombre: auth.duenoNombre,
      domicilio: auth.domicilio,
      sector: auth.sector,
      comuna: auth.comuna,
      telefono: auth.telefono,
      duenoRut: auth.duenoRut,
      mascotaNombre: auth.mascotaNombre,
      especie: auth.especie,
      sexo: auth.sexo,
      fechaNacimiento: auth.fechaNacimiento,
      raza: auth.raza,
      antecedentes: auth.antecedentes,
      medicoACargo: auth.medicoACargo,
      extra: CAMPOS_EXTRA[tipoAuth].map((label) => ({
        label,
        value: auth.extra[label] ?? "",
      })),
    };
  }

  async function generarBlob(): Promise<Blob> {
    if (esMicrochip) return generarCertificadoMicrochip(micro);
    return pdf(<AutorizacionDoc data={buildAutorizacionData()} />).toBlob();
  }

  function snapshot(): Record<string, unknown> {
    return esMicrochip
      ? (micro as unknown as Record<string, unknown>)
      : (buildAutorizacionData() as unknown as Record<string, unknown>);
  }

  function nombreArchivo(): string {
    const base = data.paciente.numero_ficha;
    return `${base}_${tipo}.pdf`;
  }

  async function emitir(accion: "descargar" | "imprimir") {
    if (motivoInvalido) return;
    setGenerando(true);
    setError(null);
    try {
      const blob = await generarBlob();
      const url = URL.createObjectURL(blob);
      if (accion === "descargar") {
        const a = document.createElement("a");
        a.href = url;
        a.download = nombreArchivo();
        a.click();
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      // Traza (no bloquea la entrega del documento).
      void registrarDocumentoEmitido({
        pacienteId: data.pacienteId,
        duenoId: data.dueno?.id ?? null,
        tipo,
        datos: snapshot(),
      });
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError("No se pudo generar el documento.");
    } finally {
      setGenerando(false);
    }
  }

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
        aria-label="Autorizaciones y certificados"
        tabIndex={-1}
        className="relative flex h-full w-full flex-col bg-slate-50 shadow-xl outline-none sm:max-w-3xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Autorizaciones y certificados
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Tipo (2×2) */}
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_DOCUMENTO_LEGAL.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTipo(value)}
                aria-pressed={tipo === value}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                  tipo === value
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {vets.length > 0 && (
            <label className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              Veterinario a cargo
              <select
                value={vetId}
                onChange={(e) => aplicarVet(e.target.value)}
                className={field}
              >
                {!vets.some((v) => v.id === vetId) && (
                  <option value={vetId}>—</option>
                )}
                {vets.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                    {v.id === data.emisor?.id ? " (tú)" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!esMicrochip ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">
                Datos precargados desde la ficha — editá lo que haga falta.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Veterinaria" value={auth.clinica} onChange={(v) => setA({ clinica: v })} />
                <Campo label="Médico veterinario a cargo" value={auth.medicoACargo} onChange={(v) => setA({ medicoACargo: v })} />
                <Campo label="Autorizante (nombre)" value={auth.duenoNombre} onChange={(v) => setA({ duenoNombre: v })} />
                <Campo label="RUT autorizante" value={auth.duenoRut} onChange={(v) => setA({ duenoRut: v })} />
                <Campo label="Domicilio" value={auth.domicilio} onChange={(v) => setA({ domicilio: v })} />
                <Campo label="Teléfono" value={auth.telefono} onChange={(v) => setA({ telefono: v })} />
                <Campo label="Sector" value={auth.sector} onChange={(v) => setA({ sector: v })} />
                <Campo label="Comuna" value={auth.comuna} onChange={(v) => setA({ comuna: v })} />
                <Campo label="Animal (nombre)" value={auth.mascotaNombre} onChange={(v) => setA({ mascotaNombre: v })} />
                <Campo label="Raza" value={auth.raza} onChange={(v) => setA({ raza: v })} />
                <Campo label="Especie" value={auth.especie} onChange={(v) => setA({ especie: v })} />
                <Campo label="Sexo" value={auth.sexo} onChange={(v) => setA({ sexo: v })} />
                <Campo label="Fecha de nacimiento" value={auth.fechaNacimiento} onChange={(v) => setA({ fechaNacimiento: v })} />
              </div>
              <Campo
                label="Antecedentes del caso"
                value={auth.antecedentes}
                onChange={(v) => setA({ antecedentes: v })}
                textarea
              />
              {CAMPOS_EXTRA[tipoAuth].map((label) => (
                <Campo
                  key={label}
                  label={label}
                  value={auth.extra[label] ?? ""}
                  onChange={(v) =>
                    setA({ extra: { ...auth.extra, [label]: v } })
                  }
                  textarea
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">
                Se imprime sobre el certificado oficial. Datos del animal
                precargados; completá procedimiento y datos del profesional.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Nombre" value={micro.nombre} onChange={(v) => setM({ nombre: v })} />
                <Campo label="Raza" value={micro.raza} onChange={(v) => setM({ raza: v })} />
                <Selecta label="Especie" value={micro.especie} onChange={(v) => setM({ especie: v as MicrochipData["especie"] })} options={[["perro", "Perro"], ["gato", "Gato"]]} />
                <Selecta label="Sexo" value={micro.sexo} onChange={(v) => setM({ sexo: v as MicrochipData["sexo"] })} options={[["macho", "Macho"], ["hembra", "Hembra"]]} />
                <Selecta label="Esterilizado" value={micro.esterilizado} onChange={(v) => setM({ esterilizado: v as MicrochipData["esterilizado"] })} options={[["si", "Sí"], ["no", "No"]]} />
                <Campo label="Color" value={micro.color} onChange={(v) => setM({ color: v })} />
                <Campo label="Fecha de nacimiento" value={micro.fechaNacimiento} onChange={(v) => setM({ fechaNacimiento: v })} />
                <Selecta label="Tipo de procedimiento" value={micro.tipoProcedimiento} onChange={(v) => setM({ tipoProcedimiento: v as MicrochipData["tipoProcedimiento"] })} options={[["implantacion", "Implantación"], ["verificacion", "Verificación"]]} />
                <Selecta label="Modo de obtención" value={micro.modoObtencion} onChange={(v) => setM({ modoObtencion: v as MicrochipData["modoObtencion"] })} options={MODO_OBTENCION} />
                <Selecta label="Razón de tenencia" value={micro.razonTenencia} onChange={(v) => setM({ razonTenencia: v as MicrochipData["razonTenencia"] })} options={RAZON_TENENCIA} />
                <Campo label="Veterinario — Nombres" value={micro.vetNombres} onChange={(v) => setM({ vetNombres: v })} />
                <Campo label="Veterinario — Apellidos" value={micro.vetApellidos} onChange={(v) => setM({ vetApellidos: v })} />
                <Campo label="Veterinario — RUT" value={micro.vetRut} onChange={(v) => setM({ vetRut: v })} />
                <Selecta label="Profesional" value={micro.tipoProfesional} onChange={(v) => setM({ tipoProfesional: v as MicrochipData["tipoProfesional"] })} options={[["medico", "Médico Veterinario"], ["tecnico", "Técnico Veterinario"]]} />
                <Campo label="Comuna" value={micro.comuna} onChange={(v) => setM({ comuna: v })} />
                <Campo label="Fecha del procedimiento" value={micro.fechaProcedimiento} onChange={(v) => setM({ fechaProcedimiento: v })} />
              </div>
            </div>
          )}

          {motivoInvalido && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {motivoInvalido}
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Historial de documentos emitidos */}
          {data.emitidos.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Documentos emitidos
              </p>
              <ul className="space-y-1 text-sm text-slate-700">
                {data.emitidos.map((d) => (
                  <li key={d.id} className="flex justify-between gap-2">
                    <span>{labelTipoDocumentoLegal(d.tipo)}</span>
                    <span className="text-slate-400">
                      {formatearFecha(d.emitido_en)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
          <button
            type="button"
            onClick={() => emitir("imprimir")}
            disabled={generando || motivoInvalido !== null}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            {generando ? "Generando…" : "Imprimir"}
          </button>
          <button
            type="button"
            onClick={() => emitir("descargar")}
            disabled={generando || motivoInvalido !== null}
            className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            Descargar PDF
          </button>
        </footer>
      </div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label}
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className={field}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={field}
        />
      )}
    </label>
  );
}

function Selecta({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={field}
      >
        <option value="">—</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
