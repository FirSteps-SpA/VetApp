import Link from "next/link";
import type { Metadata } from "next";

import { getSucursales, getUsuariosAdmin } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";

import { UsuariosManager } from "./usuarios-manager";

export const metadata: Metadata = {
  title: "Usuarios",
};

export default async function AdminUsuariosPage() {
  const supabase = createClient();
  const [
    {
      data: { user },
    },
    usuarios,
    sucursales,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getUsuariosAdmin(),
    getSucursales(),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/admin" className="text-sm text-text-muted hover:text-text">
        ← Admin
      </Link>
      <h1 className="text-2xl font-semibold text-text">Usuarios</h1>
      <UsuariosManager
        usuarios={usuarios}
        sucursales={sucursales}
        miId={user?.id ?? null}
      />
    </div>
  );
}
