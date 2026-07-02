import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">
        Página no encontrada
      </h1>
      <p className="max-w-md text-sm text-slate-500">
        La página que buscas no existe o no tienes acceso a ella.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
