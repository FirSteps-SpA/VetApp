"use client";

import { useEffect } from "react";

import { logError } from "@/lib/log";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { boundary: "root" });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-page font-semibold text-text">Algo salió mal</h1>
      <p className="max-w-md text-body text-text-muted">
        Ocurrió un error inesperado. Puedes reintentar; si persiste, contacta al
        administrador.
      </p>
      <button
        onClick={reset}
        className="min-h-tap rounded-control bg-accent px-4 font-medium text-on-accent hover:opacity-90"
      >
        Reintentar
      </button>
    </div>
  );
}
