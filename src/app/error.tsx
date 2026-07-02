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
      <h1 className="text-2xl font-semibold text-slate-900">Algo salió mal</h1>
      <p className="max-w-md text-sm text-slate-500">
        Ocurrió un error inesperado. Puedes reintentar; si persiste, contacta al
        administrador.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
      >
        Reintentar
      </button>
    </div>
  );
}
