import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

import { getRol } from "@/lib/auth/roles";
import { countSolicitudesPendientes } from "@/lib/data/citas";
import { createClient } from "@/lib/supabase/server";
import {
  APP_SHELL_ID,
  RAIL_COLLAPSED,
  RAIL_EXPANDED,
  PrimaryNav,
} from "@/components/primary-nav/primary-nav";
import { staffDestinos } from "@/components/primary-nav/destinos";

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
  const destinos = staffDestinos({ esDev: rol === "dev" });

  // Estado del riel: cookie -> el layout reserva el ancho correcto desde el
  // primer render (sin flash). Sin cookie no fijamos nada y el default por
  // tramo lo pone globals.css (colapsado en tablet, expandido en escritorio).
  const railCookie = cookies().get("rail")?.value;
  const shellStyle: CSSProperties | undefined =
    railCookie === "collapsed"
      ? ({ "--rail-w": RAIL_COLLAPSED } as CSSProperties)
      : railCookie === "expanded"
        ? ({ "--rail-w": RAIL_EXPANDED } as CSSProperties)
        : undefined;

  return (
    <div
      id={APP_SHELL_ID}
      className="min-h-screen bg-surface-sunken px-safe"
      style={shellStyle}
    >
      <div className="transition-[padding] duration-150 tablet:pl-[var(--rail-w)]">
        <header className="sticky top-0 z-10 border-b border-border bg-surface-raised pt-safe">
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 tablet:px-6">
            <Link
              href="/dashboard"
              className="font-semibold text-accent tablet:hidden"
            >
              VetApp
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/perfil"
                className="hidden text-support text-text-muted hover:text-text desktop:inline"
              >
                {user.email} · {rol ?? "—"}
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="min-h-tap rounded-control border border-border px-3 text-body font-medium text-text transition-colors hover:bg-surface-sunken"
                >
                  Salir
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[96rem] px-4 pb-bottomnav pt-6 tablet:px-6">
          {children}
        </main>
      </div>

      <PrimaryNav
        destinos={destinos}
        contadores={{ reservas: reservasPendientes }}
        titulo="VetApp"
        homeHref="/dashboard"
      />
    </div>
  );
}
