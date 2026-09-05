import type { ReactNode } from "react";

import { cx } from "@/lib/utils/cx";

// Clase compartida para inputs/selects/textarea: área táctil >= --tap-min,
// color/borde/radio de los tokens.
export const controlClass =
  "block w-full min-h-tap rounded-control border border-border bg-surface " +
  "px-3 text-body text-text placeholder:text-text-muted " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 " +
  "focus-visible:outline-accent disabled:opacity-50";

// Campo de formulario: etiqueta + control (children) + mensaje de error.
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="text-support font-medium text-text">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-support text-text-muted">{hint}</p>
      )}
      {error && <p className="text-support text-danger">{error}</p>}
    </div>
  );
}
