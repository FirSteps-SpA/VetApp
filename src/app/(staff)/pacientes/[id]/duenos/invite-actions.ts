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
    // ¿Ya existe una cuenta con este email? Ocurre al re-invitar a un dueño
    // revocado: `revocarAcceso` desvincula y desactiva, pero conserva la cuenta.
    // Sin distinguir mayúsculas (Auth guarda los emails en minúsculas); se
    // escapan los comodines de LIKE para que `_` o `%` no coincidan con otro email.
    const emailLike = String(dueno.email).trim().replace(/[\\%_]/g, (c: string) => `\\${c}`);
    const { data: existente } = await admin
      .from("usuarios")
      .select("id, rol")
      .ilike("email", emailLike)
      .maybeSingle();

    let userId: string;
    if (existente) {
      if (existente.rol !== "cliente") {
        return { ok: false, error: "Ese email pertenece a una cuenta del equipo." };
      }
      // Solo se reutiliza una cuenta huérfana: si ya está vinculada a otro
      // dueño, re-vincularla le daría acceso a las mascotas de este.
      const { data: otroDueno } = await admin
        .from("duenos")
        .select("id")
        .eq("usuario_id", existente.id)
        .maybeSingle();
      if (otroDueno) {
        return { ok: false, error: "Ese email ya tiene acceso al portal con otra ficha de dueño." };
      }
      userId = existente.id;
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

      userId = created.user.id;

      const { error: usuarioError } = await admin.from("usuarios").insert({
        id: userId,
        nombre: dueno.nombre,
        email: dueno.email,
        rol: "cliente",
      });
      if (usuarioError) {
        return { ok: false, error: "No se pudo registrar el usuario cliente." };
      }
    }

    await admin.from("duenos").update({ usuario_id: userId }).eq("id", duenoId);
    // Reactiva la cuenta si venía de una revocación (vuelve el rol al JWT).
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
