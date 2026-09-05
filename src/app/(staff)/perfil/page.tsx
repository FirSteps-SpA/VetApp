import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getMiPerfil } from "@/lib/data/usuarios";

import { PerfilForm } from "./perfil-form";

export const metadata: Metadata = {
  title: "Mi perfil",
};

export default async function PerfilPage() {
  const perfil = await getMiPerfil();
  if (!perfil) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← Dashboard
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold text-slate-900">
        Mi perfil
      </h1>
      <PerfilForm perfil={perfil} />
    </div>
  );
}
