"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pacientes", label: "Pacientes" },
  { href: "/agenda", label: "Agenda" },
  { href: "/reservas", label: "Reservas" },
  { href: "/vacunas", label: "Vacunas" },
];

export function NavLinks({ reservasPendientes = 0 }: { reservasPendientes?: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        const badge = link.href === "/reservas" ? reservasPendientes : 0;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-teal-50 text-teal-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {link.label}
            {badge > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
