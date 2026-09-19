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
      <label className="flex flex-col gap-1 text-body font-medium text-text">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-tap rounded-control border border-border px-3 text-body text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle"
        />
      </label>

      <label className="flex flex-col gap-1 text-body font-medium text-text">
        Contraseña
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-tap rounded-control border border-border px-3 text-body text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle"
        />
      </label>

      {error && (
        <p className="rounded-control border border-danger px-3 py-2 text-body text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 min-h-tap rounded-control bg-accent px-4 font-medium text-on-accent transition-colors hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
