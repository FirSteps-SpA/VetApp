import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin acceso",
};

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-page font-semibold text-text">Sin acceso</h1>
      <p className="max-w-md text-text-muted">
        Tu cuenta no tiene permisos para ver esta sección.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-tap items-center justify-center rounded-control bg-accent px-4 font-medium text-on-accent transition-colors hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
