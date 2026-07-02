import { redirect } from "next/navigation";
import Link from "next/link";

import { getRol } from "@/lib/auth/roles";
import { countSolicitudesPendientes } from "@/lib/data/citas";
import { createClient } from "@/lib/supabase/server";

import { NavLinks } from "./nav-links";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rol = getRol(user);
  if (rol === "cliente") redirect("/portal");

  const reservasPendientes = await countSolicitudesPendientes();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-semibold text-teal-700">
              VetApp
            </Link>
            <div className="hidden sm:block">
              <NavLinks reservasPendientes={reservasPendientes} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 md:inline">
              {user.email} · {rol ?? "—"}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Salir
              </button>
            </form>
          </div>
        </div>

        {/* Navegación en móvil */}
        <div className="border-t border-slate-100 px-2 py-1 sm:hidden">
          <NavLinks />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
