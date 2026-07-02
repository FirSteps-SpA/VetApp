import { redirect } from "next/navigation";

import { getRol, homeForRol } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

// La raíz redirige según sesión y rol: staff al dashboard, cliente al portal.
export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  redirect(homeForRol(getRol(user)));
}
