import Link from "next/link";
import type { Metadata } from "next";

import { getSucursales } from "@/lib/data/admin";
import { getClinicaConfigRaw, logoPublicUrl } from "@/lib/data/clinica";

import { ClinicaForm } from "./clinica-form";
import { LogoUploader } from "./logo-uploader";
import { SucursalesManager } from "./sucursales-manager";

export const metadata: Metadata = {
  title: "Clínica",
};

export default async function AdminClinicaPage() {
  const [config, sucursales] = await Promise.all([
    getClinicaConfigRaw(),
    getSucursales(),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
        ← Admin
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">Clínica</h1>

      {config ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Logo</h2>
            <LogoUploader actualUrl={logoPublicUrl(config.logo_url)} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Datos de la clínica
            </h2>
            <ClinicaForm config={config} />
          </section>
        </>
      ) : (
        <p className="text-sm text-slate-500">
          No existe la fila de configuración (id=1). Aplica el seed.
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Sucursales</h2>
        <SucursalesManager sucursales={sucursales} />
      </section>
    </div>
  );
}
