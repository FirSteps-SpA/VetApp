"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pacientes", label: "Pacientes" },
  { href: "/agenda", label: "Agenda", disabled: true },
  { href: "/vacunas", label: "Vacunas", disabled: true },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);

        if (link.disabled) {
          return (
            <span
              key={link.href}
              title="Disponible en una fase posterior"
              className="cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-slate-300"
            >
              {link.label}
            </span>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-teal-50 text-teal-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
