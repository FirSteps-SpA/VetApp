import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LoginScreen } from "@/app/login/login-screen";
import { getBrandingPorSlug } from "@/lib/data/clinica";

export const metadata: Metadata = {
  title: "Ingresar",
};

// La marca se lee en cada request: prerenderizada, la página congelaba la
// marca del momento del build hasta el siguiente deploy.
export const dynamic = "force-dynamic";

// Entrada de una clínica: su nombre y logo. Un slug inexistente o de una
// clínica desactivada responde 404, sin revelar qué clínicas existen.
export default async function LoginClinicaPage({ params }: { params: { slug: string } }) {
  const branding = await getBrandingPorSlug(params.slug);
  if (!branding) notFound();
  return <LoginScreen nombre={branding.nombre_clinica} logoUrl={branding.logo_url} />;
}
