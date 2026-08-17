"use server";

import { revalidatePath } from "next/cache";

import { esDev } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/utils/site";

const ROLES_STAFF = ["dev", "veterinario", "recepcionista"] as const;
type RolStaff = (typeof ROLES_STAFF)[number];

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export type CrearUsuarioResult =
  | { ok: true; link: string }
  | { ok: false; error: string };

// Crea un usuario staff (vet/recep/dev) y devuelve un enlace mágico de acceso.
export async function crearUsuario(input: {
  nombre: string;
  email: string;
  rol: string;
  sucursal_id: string | null;
}): Promise<CrearUsuarioResult> {
  if (!(await esDev())) return { ok: false, error: "No autorizado." };
  if (!input.nombre?.trim() || !input.email?.trim()) {
    return { ok: false, error: "Nombre y email son obligatorios." };
  }
  if (!ROLES_STAFF.includes(input.rol as RolStaff)) {
    return { ok: false, error: "Rol inválido (los clientes se invitan desde su ficha de dueño)." };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: input.email.trim(),
      email_confirm: true,
    });
  if (createError || !created.user) {
    return { ok: false, error: "No se pudo crear (¿email ya registrado?)." };
  }

  const { error: usuarioError } = await admin.from("usuarios").insert({
    id: created.user.id,
    nombre: input.nombre.trim(),
    email: input.email.trim(),
    rol: input.rol,
    sucursal_id: input.sucursal_id,
  });
  if (usuarioError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, error: "No se pudo registrar el usuario." };
  }

  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: input.email.trim(),
  });

  revalidatePath("/admin/usuarios");
  const params = new URLSearchParams({
    token_hash: link?.properties?.hashed_token ?? "",
    type: "magiclink",
    next: "/",
  });
  return { ok: true, link: `${getOrigin()}/auth/confirm?${params.toString()}` };
}

export async function actualizarUsuario(
  id: string,
  input: {
    nombre: string;
    rol: string;
    sucursal_id: string | null;
    activo: boolean;
  },
): Promise<{ error: string | null }> {
  if (!(await esDev())) return { error: "No autorizado." };
  if (!ROLES_STAFF.includes(input.rol as RolStaff) && input.rol !== "cliente") {
    return { error: "Rol inválido." };
  }

  const yo = await currentUserId();
  if (id === yo && (input.rol !== "dev" || !input.activo)) {
    return { error: "No puedes quitarte tu propio rol dev ni desactivarte." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("usuarios")
    .update({
      nombre: input.nombre.trim(),
      rol: input.rol,
      sucursal_id: input.sucursal_id,
      activo: input.activo,
    })
    .eq("id", id);
  if (error) return { error: "No se pudo actualizar." };

  revalidatePath("/admin/usuarios");
  return { error: null };
}

export async function eliminarUsuario(
  id: string,
): Promise<{ error: string | null }> {
  if (!(await esDev())) return { error: "No autorizado." };
  if (id === (await currentUserId())) {
    return { error: "No puedes eliminar tu propia cuenta." };
  }

  const admin = createAdminClient();
  // Desvincula dueños que apunten a este usuario para no violar la FK.
  await admin.from("duenos").update({ usuario_id: null }).eq("usuario_id", id);
  // Borra el usuario de Auth; la fila en `usuarios` cae por ON DELETE CASCADE.
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: "No se pudo eliminar." };

  revalidatePath("/admin/usuarios");
  return { error: null };
}
