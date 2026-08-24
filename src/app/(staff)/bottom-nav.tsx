"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Item {
  href: string;
  emoji: string;
  label: string;
}

const PRIMARIOS: Item[] = [
  { href: "/dashboard", emoji: "🏠", label: "Inicio" },
  { href: "/pacientes", emoji: "🐾", label: "Pacientes" },
  { href: "/agenda", emoji: "📅", label: "Agenda" },
  { href: "/reservas", emoji: "🔔", label: "Reservas" },
];

function esActivo(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const celda =
  "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium";

export function BottomNav({
  reservasPendientes = 0,
  esDev = false,
}: {
  reservasPendientes?: number;
  esDev?: boolean;
}) {
  const pathname = usePathname();
  const [masOpen, setMasOpen] = useState(false);

  const secundarios: Item[] = [
    { href: "/vacunas", emoji: "💉", label: "Vacunas" },
    ...(esDev ? [{ href: "/admin", emoji: "⚙️", label: "Admin" }] : []),
  ];
  const masActivo = secundarios.some((s) => esActivo(pathname, s.href));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-5xl items-stretch justify-around">
        {PRIMARIOS.map((it) => {
          const activo = esActivo(pathname, it.href);
          const badge = it.href === "/reservas" ? reservasPendientes : 0;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`${celda} ${activo ? "text-teal-700" : "text-slate-500"}`}
            >
              <span className="relative text-lg leading-none">
                {it.emoji}
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1 rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {badge}
                  </span>
                )}
              </span>
              {it.label}
            </Link>
          );
        })}

        {/* Más */}
        <div className="relative flex flex-1">
          <button
            type="button"
            onClick={() => setMasOpen((v) => !v)}
            className={`${celda} w-full ${masActivo || masOpen ? "text-teal-700" : "text-slate-500"}`}
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
              <div className="absolute bottom-full right-2 z-30 mb-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {secundarios.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    onClick={() => setMasOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span className="text-base">{s.emoji}</span>
                    {s.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
