"use server";

import { revalidatePath } from "next/cache";

import { getRol } from "@/lib/auth/roles";
import { getClinicaConfigRaw } from "@/lib/data/clinica";
import { clinicaTieneAviso } from "@/lib/data/privacidad";
import { clinicaCorreo, enviarMensajePorCorreo } from "@/lib/notificaciones/enviar";
import { mensajeInvitacion } from "@/lib/notificaciones/mensajes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/utils/site";

export type InvitarResult =
  // `correo`: a qué email se envió la invitación, o null si no salió (spec 8).
  | { ok: true; link: string; correo: string | null }
  | { ok: false; error: string };

async function esClinico(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const rol = getRol(user);
  return rol === "dev" || rol === "veterinario";
}

// El enlace lleva a la entrada con la marca de la clínica que invita, que
// recién al hacer clic consume el token en /auth/confirm.
function confirmUrl(hashedToken: string, slug: string): string {
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: "magiclink",
    next: "/portal",
  });
  return `${getOrigin()}/c/${slug}/acceso?${params.toString()}`;
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
  // Ningún dueño entra al portal sin aceptar un aviso de privacidad: sin aviso
  // publicado no hay qué aceptar (spec 7).
  if (!(await clinicaTieneAviso())) {
    return {
      ok: false,
      error: "Primero hay que publicar el aviso de privacidad de la clínica (Admin › Privacidad).",
    };
  }

  // La ficha se lee con la sesión del staff: la RLS solo devuelve dueños de
  // su clínica. Recién después se usa service_role.
  const supabase = createClient();
  const [{ data: dueno }, clinica] = await Promise.all([
    supabase
      .from("duenos")
      .select("id, nombre, email, usuario_id, tenant_id")
      .eq("id", duenoId)
      .maybeSingle(),
    getClinicaConfigRaw(),
  ]);

  if (!dueno || !clinica) return { ok: false, error: "Dueño no encontrado." };
  const admin = createAdminClient();
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
      // Una cuenta puede tener una ficha de dueño en cada clínica (spec 6),
      // pero no dos en la misma: re-vincularla le daría acceso a las mascotas
      // de otra ficha de esta clínica.
      const { data: otroDueno } = await admin
        .from("duenos")
        .select("id")
        .eq("usuario_id", existente.id)
        .eq("tenant_id", dueno.tenant_id)
        .maybeSingle();
      if (otroDueno) {
        return {
          ok: false,
          error: "Ese email ya tiene acceso al portal con otra ficha de dueño de esta clínica.",
        };
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
  const url = confirmUrl(link.properties.hashed_token, clinica.slug);
  // Invitación por correo con la marca de la clínica. Si no sale, el staff
  // igual tiene el enlace para compartirlo por otro medio.
  const marca = await clinicaCorreo(clinica.id);
  const enviado =
    !!marca &&
    (await enviarMensajePorCorreo(
      emailCuenta,
      marca,
      mensajeInvitacion({ nombreDueno: dueno.nombre, clinica: marca.nombre_clinica, enlace: url }),
    ));
  return { ok: true, link: url, correo: enviado ? emailCuenta : null };
}

// Revoca el acceso al portal de esta ficha: la desvincula y, si la cuenta no
// tiene fichas en otras clínicas, la desactiva.
export async function revocarAcceso(
  duenoId: string,
  pacienteId: string,
): Promise<{ error: string | null }> {
  if (!(await esClinico())) return { error: "No autorizado." };

  // Ficha leída con la sesión del staff (solo dueños de su clínica).
  const supabase = createClient();
  const { data: dueno } = await supabase
    .from("duenos")
    .select("id, usuario_id")
    .eq("id", duenoId)
    .maybeSingle();
  if (!dueno) return { error: "Dueño no encontrado." };

  const admin = createAdminClient();
  await admin.from("duenos").update({ usuario_id: null }).eq("id", dueno.id);

  // La cuenta solo se desactiva si no le queda ficha en ninguna clínica: en
  // las demás sigue teniendo acceso.
  if (dueno.usuario_id) {
    const { count } = await admin
      .from("duenos")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", dueno.usuario_id);
    if (!count) {
      await admin.from("usuarios").update({ activo: false }).eq("id", dueno.usuario_id);
    }
  }

  revalidatePath(`/pacientes/${pacienteId}/duenos`);
  return { error: null };
}
