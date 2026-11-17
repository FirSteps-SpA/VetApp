import { NextResponse, type NextRequest } from "next/server";

import { getClinicaConfigRaw, getClinicasDelCliente } from "@/lib/data/clinica";
import { createClient } from "@/lib/supabase/server";

// Cierra la sesión y redirige al login. Se invoca vía POST desde un formulario.
// Vuelve a la entrada de la clínica de la sesión (spec 6). Un dueño de una
// sola clínica vuelve a la de ella; con varias, al login genérico.
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const clinica = await getClinicaConfigRaw();
  const clinicas = clinica ? [clinica] : await getClinicasDelCliente();
  await supabase.auth.signOut();

  const destino = clinicas.length === 1 ? `/c/${clinicas[0].slug}/login` : "/login";
  return NextResponse.redirect(new URL(destino, request.url), {
    status: 303,
  });
}
