import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LoginScreen } from "@/app/login/login-screen";
import { getBrandingPorSlug } from "@/lib/data/clinica";

export const metadata: Metadata = {
  title: "Acceso",
};

export const dynamic = "force-dynamic";

// Destino de los enlaces de invitación: muestra la marca de la clínica que
// invita y un botón que recién entonces consume el token en /auth/confirm.
// Así un escáner de enlaces del correo no gasta el token de un solo uso.
export default async function AccesoClinicaPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { token_hash?: string; type?: string; next?: string };
}) {
  const branding = await getBrandingPorSlug(params.slug);
  if (!branding) notFound();

  const qs = new URLSearchParams({
    token_hash: searchParams.token_hash ?? "",
    type: searchParams.type ?? "magiclink",
    next: searchParams.next ?? "/",
    c: branding.slug,
  });

  return (
    <LoginScreen nombre={branding.nombre_clinica} logoUrl={branding.logo_url}>
      <p className="mb-4 text-body text-text">
        {branding.nombre_clinica} te invitó a VetApp.
      </p>
      <Link
        href={`/auth/confirm?${qs.toString()}`}
        prefetch={false}
        className="flex min-h-tap items-center justify-center rounded-control bg-accent px-4 font-medium text-on-accent hover:opacity-90"
      >
        Entrar
      </Link>
    </LoginScreen>
  );
}
