import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Administración</h1>
      <p className="mt-1 text-sm text-slate-500">
        Configuración del sistema (solo dev).
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/clinica"
          className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300"
        >
          <h2 className="font-medium text-slate-900">Clínica y sucursales</h2>
          <p className="mt-1 text-sm text-slate-500">
            Datos, logo para documentos y sucursales.
          </p>
        </Link>

        <Link
          href="/admin/usuarios"
          className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300"
        >
          <h2 className="font-medium text-slate-900">Usuarios</h2>
          <p className="mt-1 text-sm text-slate-500">
            Veterinarios, recepcionistas y clientes.
          </p>
        </Link>
      </div>
    </div>
  );
}
