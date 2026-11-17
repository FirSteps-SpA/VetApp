import Link from "next/link";
import type { Metadata } from "next";

import { getMisMascotas } from "@/lib/data/portal";

import { SolicitarForm } from "./solicitar-form";

export const metadata: Metadata = {
  title: "Solicitar hora",
};

export default async function SolicitarPage() {
  const mascotas = await getMisMascotas();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/portal/citas"
        className="text-sm text-text-muted hover:text-text"
      >
        ← Mis citas
      </Link>
      <h1 className="mb-6 mt-2 text-xl font-semibold text-text">
        Solicitar hora
      </h1>
      <SolicitarForm mascotas={mascotas} />
    </div>
  );
}
