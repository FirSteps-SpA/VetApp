import { cookies } from "next/headers";

import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Cliente de Supabase para Server Components, Server Actions y Route Handlers.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` se llama desde un Server Component: se puede ignorar si el
            // middleware ya se encarga de refrescar la sesión.
          }
        },
      },
    },
  );
}
