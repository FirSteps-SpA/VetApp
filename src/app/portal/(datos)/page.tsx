import Link from "next/link";
import type { Metadata } from "next";

import { getMisCitas, getMisMascotas } from "@/lib/data/portal";
import { createClient } from "@/lib/supabase/server";
import { agruparPorClinica } from "@/lib/portal/agrupar-clinica";
import { colorEstadoCita, iconoEspecie, labelEstadoCita } from "@/lib/types/db";
import { formatearFechaHora } from "@/lib/utils/format";

import { Bienvenida } from "./bienvenida";

export const metadata: Metadata = {
  title: "Portal",
};

async function getPerfilPortal(): Promise<{ nombre: string; bienvenida: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { nombre: "", bienvenida: false };
  const { data } = await supabase
    .from("usuarios")
    .select("nombre, bienvenida_vista_en")
    .eq("id", user.id)
    .maybeSingle();
  return {
    nombre: (data?.nombre as string | undefined)?.split(" ")[0] ?? "",
    bienvenida: !data?.bienvenida_vista_en,
  };
}

export default async function PortalHome() {
  const [mascotas, citas, perfil] = await Promise.all([
    getMisMascotas(),
    getMisCitas(),
    getPerfilPortal(),
  ]);

  const grupos = agruparPorClinica(mascotas);
  const variasClinicas = grupos.length > 1;
  const proximas = citas.filter(
    (c) =>
      new Date(c.fecha_hora) >= new Date() &&
      (c.estado === "pendiente" || c.estado === "confirmada"),
  );

  return (
    <div className="flex flex-col gap-6">
      {perfil.bienvenida && <Bienvenida nombre={perfil.nombre} />}
      <section>
        <h1 className="mb-3 text-xl font-semibold text-text">
          Mis mascotas
        </h1>
        {mascotas.length === 0 ? (
          <p className="text-sm text-text-muted">
            Aún no hay mascotas asociadas a tu cuenta.
          </p>
        ) : (
          // Con mascotas en varias clínicas, cada grupo lleva el nombre de la suya.
          grupos.map((g) => (
            <div key={g.tenant_id} className="mb-3">
              {grupos.length > 1 && (
                <h2 className="mb-2 text-sm font-semibold text-text-muted">{g.clinica_nombre}</h2>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {g.items.map((m) => (
                  <Link
                    key={m.id}
                    href={`/portal/mascotas/${m.id}`}
                    className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 hover:border-accent"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-pill bg-surface-sunken text-xl">
                      {iconoEspecie(m.especie)}
                    </span>
                    <div>
                      <p className="font-medium text-text">{m.nombre}</p>
                      <p className="text-xs text-text-muted">
                        {m.raza ?? m.especie} · {m.numero_ficha}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">
            Próximas citas
          </h2>
          <Link href="/portal/citas" className="text-sm text-accent hover:underline">
            Ver todas
          </Link>
        </div>
        {proximas.length === 0 ? (
          <p className="text-sm text-text-muted">No tienes citas próximas.</p>
        ) : (
          <div className="space-y-2">
            {proximas.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-card border border-border bg-surface p-3"
              >
                <span className="text-sm text-text-muted">
                  {formatearFechaHora(c.fecha_hora)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-text">
                  {c.paciente?.nombre} · {c.motivo}
                  {variasClinicas ? ` · ${c.clinica_nombre}` : ""}
                </span>
                <span
                  className={`rounded-pill px-2 py-0.5 text-xs font-medium ${colorEstadoCita(c.estado)}`}
                >
                  {labelEstadoCita(c.estado)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
