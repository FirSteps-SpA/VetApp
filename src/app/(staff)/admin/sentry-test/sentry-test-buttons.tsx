"use client";

import { useState } from "react";

const buttonClass =
  "rounded-control bg-danger-subtle px-3 py-2 text-sm text-text text-left";

export function SentryTestButtons() {
  const [renderError, setRenderError] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);

  // Lanzar durante el render activa el error boundary de (staff) → logError.
  if (renderError) throw new Error("Sentry test: error de render (cliente)");

  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-4">
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          // Error no capturado en un handler: lo recoge el handler global de Sentry.
          throw new Error("Sentry test: error en handler (cliente)");
        }}
      >
        1. Error no capturado en el navegador
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => setRenderError(true)}
      >
        2. Error de render (error boundary)
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={async () => {
          const res = await fetch("/admin/sentry-test/api");
          setEstado(`Servidor respondió ${res.status}`);
        }}
      >
        3. Error en el servidor (route handler)
      </button>
      {estado && <p className="text-sm text-text-muted">{estado}</p>}
    </div>
  );
}
