import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-page font-semibold text-text">
        Página no encontrada
      </h1>
      <p className="max-w-md text-body text-text-muted">
        La página que buscas no existe o no tienes acceso a ella.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-tap items-center justify-center rounded-control bg-accent px-4 font-medium text-on-accent hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
