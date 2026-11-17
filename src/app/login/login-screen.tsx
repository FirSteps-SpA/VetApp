import { Suspense, type ReactNode } from "react";

import { LoginForm } from "./login-form";

// Pantalla de acceso con la marca de una clínica (`/c/<slug>/login`) o la de
// VetApp (`/login`). Tras iniciar sesión la clínica sale de la cuenta, no de
// esta pantalla.
export function LoginScreen({
  nombre,
  logoUrl,
  children,
}: {
  nombre: string;
  logoUrl: string | null;
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-sunken p-6">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-8 shadow-raised">
        {logoUrl ? (
          // Espacio propio (a diferencia del header/riel): el logo completo
          // se muestra grande, no solo el nombre en texto.
          <img src={logoUrl} alt={nombre} className="mx-auto mb-6 h-24 w-auto object-contain" />
        ) : (
          <h1 className="text-page font-semibold text-text">{nombre}</h1>
        )}
        <p className="mb-6 mt-1 text-body text-text-muted">Gestión clínica veterinaria</p>
        {children ?? (
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        )}
      </div>
    </main>
  );
}
