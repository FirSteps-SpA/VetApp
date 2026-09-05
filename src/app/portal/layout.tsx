import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

import { getRol } from "@/lib/auth/roles";
import { countNotificacionesNoLeidas } from "@/lib/data/portal";
import { createClient } from "@/lib/supabase/server";
import {
  APP_SHELL_ID,
  RAIL_COLLAPSED,
  RAIL_EXPANDED,
  PrimaryNav,
} from "@/components/primary-nav/primary-nav";
import { portalDestinos } from "@/components/primary-nav/destinos";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (getRol(user) !== "cliente") redirect("/");

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre")
    .eq("id", user.id)
    .maybeSingle();

  const noLeidas = await countNotificacionesNoLeidas();

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
          <div className="flex items-center justify-between gap-4 px-4 py-3 tablet:px-6">
            <Link
              href="/portal"
              className="font-semibold text-accent tablet:hidden"
            >
              VetApp · Portal
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden text-support text-text-muted tablet:inline">
                {perfil?.nombre ?? user.email}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="min-h-tap rounded-control border border-border px-3 text-body font-medium text-text hover:bg-surface-sunken"
                >
                  Salir
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[80rem] px-4 pb-bottomnav pt-6 tablet:px-6">
          {children}
        </main>
      </div>

      <PrimaryNav
        destinos={portalDestinos()}
        contadores={{ noLeidas }}
        titulo="Portal"
        homeHref="/portal"
      />
    </div>
  );
}
