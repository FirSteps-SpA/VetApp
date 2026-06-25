import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">VetApp</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">
          Gestión clínica veterinaria
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
