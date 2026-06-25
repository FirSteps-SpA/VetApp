import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// La raíz redirige según el estado de sesión: al dashboard si hay sesión, al login si no.
export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
