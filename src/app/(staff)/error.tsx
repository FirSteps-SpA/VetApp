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
    <div className="rounded-card border border-danger bg-danger-subtle p-6 text-center">
      <p className="text-body text-danger">
        No se pudo cargar esta sección.
      </p>
      <button
        onClick={reset}
        className="mt-3 min-h-tap rounded-control bg-accent px-4 text-body font-medium text-on-accent hover:opacity-90"
      >
        Reintentar
      </button>
    </div>
  );
}
