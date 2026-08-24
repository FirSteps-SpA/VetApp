"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/portal", emoji: "🏠", label: "Inicio", exact: true },
  { href: "/portal/mascotas", emoji: "🐾", label: "Mascotas" },
  { href: "/portal/citas", emoji: "📅", label: "Citas" },
  { href: "/portal/notificaciones", emoji: "🔔", label: "Alertas", badge: true },
];

const celda =
  "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium";

export function BottomNav({ noLeidas = 0 }: { noLeidas?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-3xl items-stretch justify-around">
        {ITEMS.map((it) => {
          const activo = it.exact
            ? pathname === it.href
            : pathname === it.href || pathname.startsWith(`${it.href}/`);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`${celda} ${activo ? "text-teal-700" : "text-slate-500"}`}
            >
              <span className="relative text-lg leading-none">
                {it.emoji}
                {it.badge && noLeidas > 0 && (
                  <span className="absolute -right-2 -top-1 rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {noLeidas}
                  </span>
                )}
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
