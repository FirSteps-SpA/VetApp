import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin acceso",
};

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Sin acceso</h1>
      <p className="max-w-md text-slate-500">
        Tu cuenta no tiene permisos para ver esta sección.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white transition-colors hover:bg-teal-700"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
