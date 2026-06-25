import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Cierra la sesión y redirige al login. Se invoca vía POST desde un formulario.
export async function POST(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
