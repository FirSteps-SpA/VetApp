import { NextResponse, type NextRequest } from "next/server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { canAccess, getRol, isPublicRoute } from "@/lib/auth/roles";

// Refresca la sesión en cada request y aplica el control de acceso por rol.
// Basado en el patrón oficial de @supabase/ssr para Next.js middleware.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: no ejecutar código entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Sin sesión: solo se permiten rutas públicas.
  if (!user) {
    if (isPublicRoute(pathname)) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Con sesión en una ruta pública (p. ej. /login): no forzamos redirección aquí
  // para no acoplar el middleware a la home de cada rol; lo resuelve la página.
  const rol = getRol(user);
  if (!isPublicRoute(pathname) && !canAccess(pathname, rol)) {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
