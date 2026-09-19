import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-text">Administración</h1>
      <p className="mt-1 text-sm text-text-muted">
        Configuración del sistema (solo dev).
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/clinica"
          className="rounded-card border border-border bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="font-medium text-text">Clínica y sucursales</h2>
          <p className="mt-1 text-sm text-text-muted">
            Datos, logo para documentos y sucursales.
          </p>
        </Link>

        <Link
          href="/admin/usuarios"
          className="rounded-card border border-border bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="font-medium text-text">Usuarios</h2>
          <p className="mt-1 text-sm text-text-muted">
            Veterinarios, recepcionistas y clientes.
          </p>
        </Link>
      </div>
    </div>
  );
}
