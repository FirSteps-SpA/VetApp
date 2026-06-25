import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - _next/static, _next/image (assets de Next)
     * - favicon, manifest, service worker e íconos PWA
     * - archivos estáticos comunes (imágenes, fuentes)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
