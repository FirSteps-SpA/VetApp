"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciales inválidas. Verifica tu email y contraseña.");
      setLoading(false);
      return;
    }

    const redirectTo = params.get("redirectTo") || "/";
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Contraseña
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
      >
        {loading ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
