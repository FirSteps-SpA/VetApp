"use server";

import { revalidatePath } from "next/cache";

import { getRol } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/utils/site";

export type InvitarResult =
  | { ok: true; link: string }
  | { ok: false; error: string };

async function esClinico(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const rol = getRol(user);
  return rol === "dev" || rol === "veterinario";
}

function confirmUrl(hashedToken: string): string {
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: "magiclink",
    next: "/portal",
  });
  return `${getOrigin()}/auth/confirm?${params.toString()}`;
}

// Invita a un dueño al portal: crea (o reutiliza) su usuario cliente, lo vincula
// y devuelve un enlace mágico para compartir. Requiere rol dev/veterinario.
export async function invitarCliente(
  duenoId: string,
  pacienteId: string,
): Promise<InvitarResult> {
  if (!(await esClinico())) {
    return { ok: false, error: "No autorizado." };
  }

  const admin = createAdminClient();

  const { data: dueno } = await admin
    .from("duenos")
    .select("id, nombre, email, usuario_id")
    .eq("id", duenoId)
    .maybeSingle();

  if (!dueno) return { ok: false, error: "Dueño no encontrado." };
  if (!dueno.email) {
    return { ok: false, error: "El dueño necesita un email para ser invitado." };
  }

  // Email de la cuenta a la que se emite el enlace. En un reenvío se toma de la
  // cuenta ya vinculada (no de `duenos.email`, que staff y el propio cliente
  // pueden editar) y se exige que sea una cuenta cliente: así el enlace nunca
  // puede abrir la sesión de otra persona.
  let emailCuenta = dueno.email;

  if (dueno.usuario_id) {
    const { data: usuario } = await admin
      .from("usuarios")
      .select("rol")
      .eq("id", dueno.usuario_id)
      .maybeSingle();
    const { data: authUser } = await admin.auth.admin.getUserById(
      dueno.usuario_id,
    );
    if (usuario?.rol !== "cliente" || !authUser.user?.email) {
      return { ok: false, error: "La cuenta vinculada no es una cuenta de cliente." };
    }
    emailCuenta = authUser.user.email;
  } else {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: dueno.email,
        email_confirm: true,
      });

    if (createError || !created.user) {
      return {
        ok: false,
        error:
          "No se pudo crear el acceso (¿el email ya está registrado?).",
      };
    }

    const userId = created.user.id;

    const { error: usuarioError } = await admin.from("usuarios").insert({
      id: userId,
      nombre: dueno.nombre,
      email: dueno.email,
      rol: "cliente",
    });
    if (usuarioError) {
      return { ok: false, error: "No se pudo registrar el usuario cliente." };
    }

    await admin.from("duenos").update({ usuario_id: userId }).eq("id", duenoId);
    // Reactivar por si estaba desactivado en una invitación previa.
    await admin.from("usuarios").update({ activo: true }).eq("id", userId);
  }

  const { data: link, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: emailCuenta,
    });

  if (linkError || !link.properties?.hashed_token) {
    return { ok: false, error: "No se pudo generar el enlace de acceso." };
  }

  revalidatePath(`/pacientes/${pacienteId}/duenos`);
  return { ok: true, link: confirmUrl(link.properties.hashed_token) };
}

// Revoca el acceso al portal: desactiva el usuario y desvincula el dueño.
export async function revocarAcceso(
  duenoId: string,
  pacienteId: string,
): Promise<{ error: string | null }> {
  if (!(await esClinico())) return { error: "No autorizado." };

  const admin = createAdminClient();

  const { data: dueno } = await admin
    .from("duenos")
    .select("usuario_id")
    .eq("id", duenoId)
    .maybeSingle();

  if (dueno?.usuario_id) {
    await admin
      .from("usuarios")
      .update({ activo: false })
      .eq("id", dueno.usuario_id);
  }
  await admin.from("duenos").update({ usuario_id: null }).eq("id", duenoId);

  revalidatePath(`/pacientes/${pacienteId}/duenos`);
  return { error: null };
}
