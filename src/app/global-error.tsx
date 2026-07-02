"use client";

import { useEffect } from "react";

import { logError } from "@/lib/log";

// Captura errores del layout raíz. Debe renderizar su propio <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { boundary: "global" });
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          color: "#0f172a",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Error en la aplicación
        </h1>
        <button
          onClick={reset}
          style={{
            borderRadius: "0.5rem",
            background: "#0d9488",
            color: "white",
            padding: "0.5rem 1rem",
            fontWeight: 500,
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
