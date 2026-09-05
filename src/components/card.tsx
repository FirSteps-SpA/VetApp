import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "@/lib/utils/cx";

// Superficie elevada estándar: color, borde, radio y elevación de la escala.
export function Card({
  as: As = "div",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "li";
  children: ReactNode;
}) {
  return (
    <As
      className={cx(
        "rounded-card border border-border bg-surface-raised shadow-raised",
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  );
}
