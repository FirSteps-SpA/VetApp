"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Dueno, DuenoDePaciente } from "@/lib/types/db";

import {
  buscarDuenos,
  crearYVincularDueno,
  desvincularDueno,
  marcarPrincipal,
  vincularDueno,
} from "./actions";
import { invitarCliente, revocarAcceso } from "./invite-actions";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export function ManageDuenos({
  pacienteId,
  duenos,
}: {
  pacienteId: string;
  duenos: DuenoDePaciente[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Buscar/vincular existente.
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Dueno[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  // Invitación al portal.
  const [enlace, setEnlace] = useState<{ duenoId: string; url: string } | null>(
    null,
  );

  // Crear nuevo.
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  const idsActuales = new Set(duenos.map((d) => d.id));

  async function run(fn: () => Promise<{ error: string | null }>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return false;
    }
    router.refresh();
    return true;
  }

  async function buscar() {
    setBuscando(true);
    setError(null);
    const res = await buscarDuenos(query);
    setResultados(res.filter((d) => !idsActuales.has(d.id)));
    setBuscando(false);
  }

  async function invitar(id: string) {
    setBusy(true);
    setError(null);
    const res = await invitarCliente(id, pacienteId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEnlace({ duenoId: id, url: res.link });
    router.refresh();
  }

  async function crear() {
    const ok = await run(() => crearYVincularDueno(pacienteId, nuevo));
    if (ok) {
      setNuevo({ nombre: "", telefono: "", email: "", direccion: "" });
      setMostrarNuevo(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Dueños actuales */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">
          Dueños del paciente
        </h2>
        {duenos.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  {d.nombre}
                  {d.es_principal && (
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                      Principal
                    </span>
                  )}
                  {d.usuario_id && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      Portal activo
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500">{d.telefono}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <Link
                  href={`/pacientes/${pacienteId}/duenos/${d.id}/editar`}
                  className="font-medium text-teal-700 hover:underline"
                >
                  Editar
                </Link>
                {d.usuario_id ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("¿Revocar el acceso al portal?"))
                        run(() => revocarAcceso(d.id, pacienteId));
                    }}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    Revocar portal
                  </button>
                ) : d.email ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => invitar(d.id)}
                    className="text-blue-700 hover:underline disabled:opacity-50"
                  >
                    Invitar al portal
                  </button>
                ) : (
                  <span className="text-slate-400" title="Requiere email">
                    Sin email
                  </span>
                )}
                {!d.es_principal && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => marcarPrincipal(pacienteId, d.id))}
                      className="text-slate-600 hover:underline disabled:opacity-50"
                    >
                      Marcar principal
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm("¿Desvincular este dueño?"))
                          run(() => desvincularDueno(pacienteId, d.id));
                      }}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      Quitar
                    </button>
                  </>
                )}
              </div>
            </div>

            {enlace?.duenoId === d.id && (
              <div className="mt-3 rounded-lg bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-800">
                  Enlace de acceso (compártelo con el dueño):
                </p>
                <input
                  readOnly
                  value={enlace.url}
                  onFocus={(e) => e.target.select()}
                  className="mt-1 w-full rounded border border-blue-200 bg-white px-2 py-1 text-xs text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(enlace.url)}
                  className="mt-1 text-xs font-medium text-blue-700 hover:underline"
                >
                  Copiar enlace
                </button>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Vincular existente */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">
          Vincular dueño existente
        </h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            placeholder="Buscar por nombre, teléfono o email…"
            className={field}
          />
          <button
            type="button"
            onClick={buscar}
            disabled={buscando || !query.trim()}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Buscar
          </button>
        </div>

        {resultados && resultados.length === 0 && (
          <p className="text-sm text-slate-500">Sin coincidencias disponibles.</p>
        )}
        {resultados && resultados.length > 0 && (
          <div className="space-y-2">
            {resultados.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {d.nombre}
                  </p>
                  <p className="text-xs text-slate-500">
                    {d.telefono}
                    {d.email ? ` · ${d.email}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    const ok = await run(() => vincularDueno(pacienteId, d.id));
                    if (ok) setResultados((r) => r?.filter((x) => x.id !== d.id) ?? null);
                  }}
                  className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  Vincular
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Crear nuevo */}
      <section className="space-y-2">
        {mostrarNuevo ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700">Nuevo dueño</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Nombre *"
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                className={field}
              />
              <input
                placeholder="Teléfono *"
                value={nuevo.telefono}
                onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
                className={field}
              />
              <input
                placeholder="Email"
                type="email"
                value={nuevo.email}
                onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
                className={field}
              />
              <input
                placeholder="Dirección"
                value={nuevo.direccion}
                onChange={(e) =>
                  setNuevo({ ...nuevo, direccion: e.target.value })
                }
                className={field}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarNuevo(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={crear}
                disabled={busy}
                className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
              >
                Crear y vincular
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMostrarNuevo(true)}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            + Crear y vincular un dueño nuevo
          </button>
        )}
      </section>
    </div>
  );
}
