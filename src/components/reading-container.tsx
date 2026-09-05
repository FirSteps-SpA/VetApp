import type { ReactNode } from "react";

import { cx } from "@/lib/utils/cx";

// Envoltura para vistas centradas en texto largo: mantiene una longitud de
// línea cómoda (~72ch) aunque haya más ancho disponible junto al riel.
export function ReadingContainer({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("mx-auto w-full max-w-reading", className)}>
      {children}
    </div>
  );
}
