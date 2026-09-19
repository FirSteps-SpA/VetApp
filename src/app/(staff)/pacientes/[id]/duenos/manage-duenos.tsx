"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ActionMenu } from "@/components/action-menu";
import { Icon } from "@/components/icon";

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
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";

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
    rut: "",
    email: "",
    direccion: "",
    comuna: "",
    sector: "",
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
      setNuevo({
        nombre: "",
        telefono: "",
        rut: "",
        email: "",
        direccion: "",
        comuna: "",
        sector: "",
      });
      setMostrarNuevo(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">
          {error}
        </p>
      )}

      {/* Dueños actuales */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-text">
          Dueños del paciente
        </h2>
        {duenos.map((d) => (
          <div
            key={d.id}
            className="rounded-card border border-border bg-surface p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-text">
                  {d.nombre}
                  {d.es_principal && (
                    <span className="rounded-pill bg-accent-subtle px-2 py-0.5 text-xs text-accent">
                      Principal
                    </span>
                  )}
                  {d.usuario_id && (
                    <span className="rounded-pill bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      Portal activo
                    </span>
                  )}
                </p>
                <p className="text-sm text-text-muted">{d.telefono}</p>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/pacientes/${pacienteId}/duenos/${d.id}/editar`}
                  className="inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-accent hover:underline"
                >
                  <Icon name="pencil" className="h-3.5 w-3.5" />
                  Editar
                </Link>
                <ActionMenu
                  acciones={[
                    d.usuario_id
                      ? {
                          label: "Revocar portal",
                          danger: true,
                          disabled: busy,
                          onClick: () => {
                            if (window.confirm("¿Revocar el acceso al portal?"))
                              run(() => revocarAcceso(d.id, pacienteId));
                          },
                        }
                      : d.email
                        ? {
                            label: "Invitar al portal",
                            disabled: busy,
                            onClick: () => invitar(d.id),
                          }
                        : { label: "Invitar (requiere email)", disabled: true },
                    ...(!d.es_principal
                      ? [
                          {
                            label: "Marcar principal",
                            disabled: busy,
                            onClick: () =>
                              run(() => marcarPrincipal(pacienteId, d.id)),
                          },
                          {
                            label: "Quitar",
                            danger: true,
                            disabled: busy,
                            onClick: () => {
                              if (window.confirm("¿Desvincular este dueño?"))
                                run(() => desvincularDueno(pacienteId, d.id));
                            },
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            </div>

            {enlace?.duenoId === d.id && (
              <div className="mt-3 rounded-control bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-800">
                  Enlace de acceso (compártelo con el dueño):
                </p>
                <input
                  readOnly
                  value={enlace.url}
                  onFocus={(e) => e.target.select()}
                  className="mt-1 w-full rounded border border-blue-200 bg-surface px-2 py-1 text-xs text-text"
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
        <h2 className="text-sm font-semibold text-text">
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
            className="shrink-0 rounded-control border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface-sunken disabled:opacity-50"
          >
            Buscar
          </button>
        </div>

        {resultados && resultados.length === 0 && (
          <p className="text-sm text-text-muted">Sin coincidencias disponibles.</p>
        )}
        {resultados && resultados.length > 0 && (
          <div className="space-y-2">
            {resultados.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 rounded-control border border-border bg-surface p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {d.nombre}
                  </p>
                  <p className="text-xs text-text-muted">
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
                  className="shrink-0 rounded-control bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
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
          <div className="space-y-3 rounded-card border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-text">Nuevo dueño</h2>
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
                placeholder="RUT"
                value={nuevo.rut}
                onChange={(e) => setNuevo({ ...nuevo, rut: e.target.value })}
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
              <input
                placeholder="Comuna"
                value={nuevo.comuna}
                onChange={(e) => setNuevo({ ...nuevo, comuna: e.target.value })}
                className={field}
              />
              <input
                placeholder="Sector"
                value={nuevo.sector}
                onChange={(e) => setNuevo({ ...nuevo, sector: e.target.value })}
                className={field}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarNuevo(false)}
                className="rounded-control border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-sunken"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={crear}
                disabled={busy}
                className="rounded-control bg-accent px-4 py-1.5 text-sm font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
              >
                Crear y vincular
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMostrarNuevo(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            Crear y vincular un dueño nuevo
          </button>
        )}
      </section>
    </div>
  );
}
