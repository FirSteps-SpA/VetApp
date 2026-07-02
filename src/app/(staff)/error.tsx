"use client";

import { useEffect } from "react";

import { logError } from "@/lib/log";

export default function StaffError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { boundary: "staff" });
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm text-red-700">
        No se pudo cargar esta sección.
      </p>
      <button
        onClick={reset}
        className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      >
        Reintentar
      </button>
    </div>
  );
}
