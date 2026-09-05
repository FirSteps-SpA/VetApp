import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "@/lib/utils/cx";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "md" | "sm";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent hover:opacity-90 border border-transparent",
  secondary:
    "bg-surface text-text border border-border hover:bg-surface-sunken",
  danger:
    "bg-surface text-danger border border-border hover:bg-surface-sunken",
  ghost:
    "bg-transparent text-text-muted border border-transparent hover:bg-surface-sunken",
};

const SIZES: Record<ButtonSize, string> = {
  // La altura efectiva nunca baja de --tap-min en ningún tramo; el tamaño
  // `sm` reduce tipografía y padding horizontal, no el objetivo táctil.
  md: "min-h-tap px-4 text-body",
  sm: "min-h-tap px-3 text-support",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-50 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-accent";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonAsButton) {
  return (
    <button
      className={cx(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link
      href={href}
      className={cx(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}
