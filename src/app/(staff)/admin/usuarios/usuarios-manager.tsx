"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ActionMenu } from "@/components/action-menu";
import { Icon } from "@/components/icon";

import type { Sucursal, UsuarioAdmin } from "@/lib/types/db";

import { actualizarUsuario, crearUsuario, eliminarUsuario } from "./actions";

const field =
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";

const ROLES_STAFF = ["veterinario", "recepcionista", "dev"];
const ROLES_EDIT = ["veterinario", "recepcionista", "dev", "cliente"];

export function UsuariosManager({
  usuarios,
  sucursales,
  miId,
}: {
  usuarios: UsuarioAdmin[];
  sucursales: Sucursal[];
  miId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [enlace, setEnlace] = useState<string | null>(null);

  // Crear.
  const [nuevo, setNuevo] = useState({
    nombre: "",
    email: "",
    rol: "veterinario",
    sucursal_id: "",
  });

  // Editar.
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    nombre: "",
    rol: "",
    sucursal_id: "",
    activo: true,
  });

  const nombreSucursal = (id: string | null) =>
    sucursales.find((s) => s.id === id)?.nombre ?? "—";

  async function crear() {
    setBusy(true);
    setError(null);
    setEnlace(null);
    const res = await crearUsuario({
      nombre: nuevo.nombre,
      email: nuevo.email,
      rol: nuevo.rol,
      sucursal_id: nuevo.sucursal_id || null,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setEnlace(res.link);
    setNuevo({ nombre: "", email: "", rol: "veterinario", sucursal_id: "" });
    router.refresh();
  }

  async function guardar(id: string) {
    setBusy(true);
    setError(null);
    const res = await actualizarUsuario(id, {
      nombre: draft.nombre,
      rol: draft.rol,
      sucursal_id: draft.sucursal_id || null,
      activo: draft.activo,
    });
    setBusy(false);
    if (res.error) return setError(res.error);
    setEditId(null);
    router.refresh();
  }

  async function eliminar(u: UsuarioAdmin) {
    if (!window.confirm(`¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`))
      return;
    setBusy(true);
    setError(null);
    const res = await eliminarUsuario(u.id);
    setBusy(false);
    if (res.error) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">
          {error}
        </p>
      )}

      {/* Crear */}
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-text">Nuevo usuario staff</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            placeholder="Nombre"
            className={field}
          />
          <input
            value={nuevo.email}
            onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
            placeholder="Email"
            type="email"
            className={field}
          />
          <select
            value={nuevo.rol}
            onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
            className={field}
          >
            {ROLES_STAFF.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={nuevo.sucursal_id}
            onChange={(e) => setNuevo({ ...nuevo, sucursal_id: e.target.value })}
            className={field}
          >
            <option value="">Sin sucursal</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={crear}
          disabled={busy}
          className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
        >
          Crear y generar enlace
        </button>
        <p className="text-xs text-text-muted">
          Los clientes se invitan desde la ficha de su dueño, no aquí.
        </p>
        {enlace && (
          <div className="rounded-control bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-800">
              Enlace de acceso (compártelo con el usuario):
            </p>
            <input
              readOnly
              value={enlace}
              onFocus={(e) => e.target.select()}
              className="mt-1 w-full rounded border border-blue-200 bg-surface px-2 py-1 text-xs"
            />
          </div>
        )}
      </section>

      {/* Listado */}
      <section className="space-y-2">
        {usuarios.map((u) => (
          <div key={u.id} className="rounded-card border border-border bg-surface p-3">
            {editId === u.id ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={draft.nombre}
                  onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
                  className={field}
                />
                <select
                  value={draft.rol}
                  onChange={(e) => setDraft({ ...draft, rol: e.target.value })}
                  className={field}
                >
                  {ROLES_EDIT.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  value={draft.sucursal_id}
                  onChange={(e) =>
                    setDraft({ ...draft, sucursal_id: e.target.value })
                  }
                  className={field}
                >
                  <option value="">Sin sucursal</option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={draft.activo}
                    onChange={(e) =>
                      setDraft({ ...draft, activo: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  Activo
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <button
                    onClick={() => guardar(u.id)}
                    disabled={busy}
                    className="rounded-control bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="rounded-control border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-sunken"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-text">
                    {u.nombre}
                    <span className="rounded-pill bg-surface-sunken px-2 py-0.5 text-xs text-text-muted">
                      {u.rol}
                    </span>
                    {!u.activo && (
                      <span className="rounded-pill bg-border px-2 py-0.5 text-xs text-text-muted">
                        Inactivo
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {u.email} · {nombreSucursal(u.sucursal_id)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditId(u.id);
                    setDraft({
                      nombre: u.nombre,
                      rol: u.rol,
                      sucursal_id: u.sucursal_id ?? "",
                      activo: u.activo,
                    });
                  }}
                  className="inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-accent hover:underline"
                >
                  <Icon name="pencil" className="h-3.5 w-3.5" />
                  Editar
                </button>
                {u.id !== miId && (
                  <ActionMenu
                    acciones={[
                      {
                        label: "Eliminar",
                        danger: true,
                        disabled: busy,
                        onClick: () => eliminar(u),
                      },
                    ]}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
