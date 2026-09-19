import { Suspense } from "react";
import type { Metadata } from "next";

import { getClinicaBrandingPublica } from "@/lib/data/clinica";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default async function LoginPage() {
  const branding = await getClinicaBrandingPublica();
  const nombreClinica = branding?.nombre_clinica || "VetApp";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-sunken p-6">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-8 shadow-raised">
        {branding?.logo_url ? (
          // Espacio propio (a diferencia del header/riel): el logo completo
          // se muestra grande, no solo el nombre en texto.
          <img
            src={branding.logo_url}
            alt={nombreClinica}
            className="mx-auto mb-6 h-24 w-auto object-contain"
          />
        ) : (
          <h1 className="text-page font-semibold text-text">
            {nombreClinica}
          </h1>
        )}
        <p className="mb-6 mt-1 text-body text-text-muted">
          Gestión clínica veterinaria
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
