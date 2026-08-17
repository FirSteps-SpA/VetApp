"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Sucursal } from "@/lib/types/db";

import { actualizarSucursal, crearSucursal } from "./actions";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

interface Draft {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

const vacio: Draft = { nombre: "", direccion: "", telefono: "", email: "" };

export function SucursalesManager({ sucursales }: { sucursales: Sucursal[] }) {
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(vacio);
  const [nueva, setNueva] = useState<Draft>(vacio);
  const [creando, setCreando] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrirEdicion(s: Sucursal) {
    setEditId(s.id);
    setDraft({
      nombre: s.nombre,
      direccion: s.direccion ?? "",
      telefono: s.telefono ?? "",
      email: s.email ?? "",
    });
  }

  async function guardarEdicion(s: Sucursal) {
    setBusy(true);
    setError(null);
    const res = await actualizarSucursal(s.id, { ...draft, activo: s.activo });
    setBusy(false);
    if (res.error) return setError(res.error);
    setEditId(null);
    router.refresh();
  }

  async function toggleActivo(s: Sucursal) {
    setBusy(true);
    await actualizarSucursal(s.id, {
      nombre: s.nombre,
      direccion: s.direccion ?? "",
      telefono: s.telefono ?? "",
      email: s.email ?? "",
      activo: !s.activo,
    });
    setBusy(false);
    router.refresh();
  }

  async function crear() {
    setBusy(true);
    setError(null);
    const res = await crearSucursal(nueva);
    setBusy(false);
    if (res.error) return setError(res.error);
    setNueva(vacio);
    setCreando(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {sucursales.map((s) => (
        <div key={s.id} className="rounded-xl border border-slate-200 p-3">
          {editId === s.id ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={draft.nombre}
                onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
                placeholder="Nombre"
                className={field}
              />
              <input
                value={draft.telefono}
                onChange={(e) => setDraft({ ...draft, telefono: e.target.value })}
                placeholder="Teléfono"
                className={field}
              />
              <input
                value={draft.direccion}
                onChange={(e) => setDraft({ ...draft, direccion: e.target.value })}
                placeholder="Dirección"
                className={field}
              />
              <input
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                placeholder="Email"
                className={field}
              />
              <div className="flex gap-2 sm:col-span-2">
                <button
                  onClick={() => guardarEdicion(s)}
                  disabled={busy}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  {s.nombre}
                  {!s.activo && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                      Inactiva
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {[s.direccion, s.telefono, s.email].filter(Boolean).join(" · ") ||
                    "—"}
                </p>
              </div>
              <button
                onClick={() => abrirEdicion(s)}
                className="text-xs font-medium text-teal-700 hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => toggleActivo(s)}
                disabled={busy}
                className="text-xs text-slate-600 hover:underline disabled:opacity-50"
              >
                {s.activo ? "Desactivar" : "Activar"}
              </button>
            </div>
          )}
        </div>
      ))}

      {creando ? (
        <div className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
          <input
            value={nueva.nombre}
            onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })}
            placeholder="Nombre *"
            className={field}
          />
          <input
            value={nueva.telefono}
            onChange={(e) => setNueva({ ...nueva, telefono: e.target.value })}
            placeholder="Teléfono"
            className={field}
          />
          <input
            value={nueva.direccion}
            onChange={(e) => setNueva({ ...nueva, direccion: e.target.value })}
            placeholder="Dirección"
            className={field}
          />
          <input
            value={nueva.email}
            onChange={(e) => setNueva({ ...nueva, email: e.target.value })}
            placeholder="Email"
            className={field}
          />
          <div className="flex gap-2 sm:col-span-2">
            <button
              onClick={crear}
              disabled={busy}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
              Crear
            </button>
            <button
              onClick={() => setCreando(false)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreando(true)}
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          + Agregar sucursal
        </button>
      )}
    </div>
  );
}
