"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cx } from "@/lib/utils/cx";
import { type Contadores, type NavDestino, esActivo } from "./destinos";

const APP_SHELL_ID = "app-shell";
const RAIL_EXPANDED = "15rem";
const RAIL_COLLAPSED = "3.5rem";

function contadorDe(d: NavDestino, c: Contadores): number {
  return d.badge ? (c[d.badge] ?? 0) : 0;
}

/**
 * Navegación primaria con dos presentaciones alimentadas por la MISMA lista de
 * destinos: barra inferior en teléfono (`tablet:hidden`) y riel lateral en
 * tablet / escritorio (`hidden tablet:flex`). Ambas exponen los mismos
 * destinos, badges e indicador de activo, por lo que la paridad entre tramos
 * queda garantizada por construcción.
 *
 * El riel colapsa/expande siguiendo la variable CSS `--rail-w` del contenedor
 * `#app-shell` (que el layout fija desde la cookie `rail`, sin flash). Su
 * apariencia la resuelve una container query en `globals.css`, no estado JS.
 */
export function PrimaryNav({
  destinos,
  contadores,
  titulo,
  homeHref,
}: {
  destinos: NavDestino[];
  contadores: Contadores;
  titulo: string;
  homeHref: string;
}) {
  return (
    <>
      <BottomBar destinos={destinos} contadores={contadores} />
      <Rail
        destinos={destinos}
        contadores={contadores}
        titulo={titulo}
        homeHref={homeHref}
      />
    </>
  );
}

/* ------------------------------- Barra inferior ------------------------------ */

const celda =
  "flex flex-1 flex-col items-center justify-center gap-0.5 min-h-tap py-1.5 text-support font-medium";

function BottomBar({
  destinos,
  contadores,
}: {
  destinos: NavDestino[];
  contadores: Contadores;
}) {
  const pathname = usePathname();
  const [masOpen, setMasOpen] = useState(false);

  const primarios = destinos.filter((d) => d.grupo === "primario");
  const secundarios = destinos.filter((d) => d.grupo === "secundario");
  const masActivo = secundarios.some((d) => esActivo(pathname, d));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface-raised tablet:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-5xl items-stretch justify-around">
        {primarios.map((d) => {
          const activo = esActivo(pathname, d);
          const n = contadorDe(d, contadores);
          return (
            <Link
              key={d.href}
              href={d.href}
              className={cx(celda, activo ? "text-accent" : "text-text-muted")}
            >
              <span className="relative text-lg leading-none">
                {d.emoji}
                {n > 0 && <Dot>{n}</Dot>}
              </span>
              {d.label}
            </Link>
          );
        })}

        {secundarios.length > 0 && (
          <div className="relative flex flex-1">
            <button
              type="button"
              onClick={() => setMasOpen((v) => !v)}
              className={cx(
                celda,
                "w-full",
                masActivo || masOpen ? "text-accent" : "text-text-muted",
              )}
            >
              <span className="text-lg leading-none">☰</span>
              Más
            </button>

            {masOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMasOpen(false)}
                  aria-hidden
                />
                <div className="absolute bottom-full right-2 z-30 mb-1 w-44 overflow-hidden rounded-card border border-border bg-surface-raised shadow-overlay">
                  {secundarios.map((d) => {
                    const n = contadorDe(d, contadores);
                    return (
                      <Link
                        key={d.href}
                        href={d.href}
                        onClick={() => setMasOpen(false)}
                        className="flex min-h-tap items-center gap-2 px-4 py-2.5 text-body text-text hover:bg-surface-sunken"
                      >
                        <span className="relative text-base">
                          {d.emoji}
                          {n > 0 && <Dot>{n}</Dot>}
                        </span>
                        {d.label}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

/* ---------------------------------- Riel ----------------------------------- */

function Rail({
  destinos,
  contadores,
  titulo,
  homeHref,
}: {
  destinos: NavDestino[];
  contadores: Contadores;
  titulo: string;
  homeHref: string;
}) {
  const pathname = usePathname();

  function toggle() {
    const shell = document.getElementById(APP_SHELL_ID);
    if (!shell) return;
    const actual = getComputedStyle(shell).getPropertyValue("--rail-w").trim();
    // < ~7rem => está colapsado, así que expandir; si no, colapsar.
    const px = parseFloat(actual);
    const colapsadoAhora =
      actual.endsWith("rem") ? px <= 7 : px <= 112; /* 7rem ≈ 112px */
    const next = colapsadoAhora ? RAIL_EXPANDED : RAIL_COLLAPSED;
    shell.style.setProperty("--rail-w", next);
    document.cookie = `rail=${colapsadoAhora ? "expanded" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <nav
      aria-label="Navegación primaria"
      className={cx(
        "rail-nav fixed inset-y-0 left-0 z-20 hidden w-[var(--rail-w)] flex-col",
        "overflow-hidden border-r border-border bg-surface-raised",
        "transition-[width] duration-150 tablet:flex",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="rail-item flex min-h-tap items-center gap-2 border-b border-border px-3">
        <Link
          href={homeHref}
          className="truncate font-semibold text-accent"
          title={titulo}
        >
          <span className="rail-label">{titulo}</span>
          <span className="rail-icon" aria-hidden>
            🐾
          </span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {destinos.map((d) => {
          const activo = esActivo(pathname, d);
          const n = contadorDe(d, contadores);
          return (
            <Link
              key={d.href}
              href={d.href}
              title={d.label}
              className={cx(
                "rail-item flex min-h-tap items-center gap-3 rounded-control px-3 text-body",
                activo
                  ? "bg-accent-subtle font-medium text-accent"
                  : "text-text-muted hover:bg-surface-sunken",
              )}
            >
              <span className="relative shrink-0 text-lg leading-none">
                {d.emoji}
                {n > 0 && <Dot>{n}</Dot>}
              </span>
              <span className="rail-label truncate">{d.label}</span>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label="Colapsar o expandir la navegación"
        className="rail-item flex min-h-tap items-center gap-3 border-t border-border px-3 text-body text-text-muted hover:bg-surface-sunken"
      >
        <span className="shrink-0 text-lg leading-none" aria-hidden>
          <span className="rail-label">«</span>
          <span className="rail-icon">»</span>
        </span>
        <span className="rail-label truncate">Colapsar</span>
      </button>
    </nav>
  );
}

/* --------------------------------- Badge ---------------------------------- */

function Dot({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-2 -top-1 rounded-pill bg-badge px-1 text-[0.625rem] font-semibold leading-none text-on-badge">
      {children}
    </span>
  );
}

export { APP_SHELL_ID, RAIL_EXPANDED, RAIL_COLLAPSED };
