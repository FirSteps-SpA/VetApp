"use server";

import { revalidatePath } from "next/cache";

import { esDev } from "@/lib/auth/guards";
import { getClinicaConfigRaw } from "@/lib/data/clinica";
import { rutaEsDeTenant } from "@/lib/storage-rutas";
import { createClient } from "@/lib/supabase/server";

const SLUG = /^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/;

function str(fd: FormData, k: string): string {
  return (fd.get(k) as string | null)?.trim() ?? "";
}

export async function guardarClinica(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  if (!(await esDev())) return { error: "No autorizado." };
  const nombre = str(formData, "nombre_clinica");
  if (!nombre) return { error: "El nombre de la clínica es obligatorio." };

  const slug = str(formData, "slug").toLowerCase();
  if (!SLUG.test(slug)) {
    return {
      error: "El slug solo admite minúsculas, números y guiones (sin guion al inicio o al final).",
    };
  }
  const horas = Number(str(formData, "horas_cancelacion"));
  if (!Number.isInteger(horas) || horas < 0 || horas > 168) {
    return { error: "El plazo de cancelación debe ser un número entero de 0 a 168 horas." };
  }
  const clinica = await getClinicaConfigRaw();
  if (!clinica) return { error: "No hay una clínica activa." };

  const supabase = createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      nombre,
      slug,
      horas_cancelacion: horas,
      direccion: str(formData, "direccion") || null,
      ciudad: str(formData, "ciudad") || null,
      telefono: str(formData, "telefono") || null,
      email: str(formData, "email") || null,
      numero_registro: str(formData, "numero_registro") || null,
    })
    .eq("id", clinica.id);

  if (error) {
    if (error.code === "23505") return { error: "Ese slug ya lo usa otra clínica." };
    return { error: "No se pudo guardar la configuración." };
  }
  revalidatePath("/admin/clinica");
  return { error: null };
}

export async function setLogoClinica(
  path: string,
): Promise<{ error: string | null }> {
  if (!(await esDev())) return { error: "No autorizado." };
  const clinica = await getClinicaConfigRaw();
  if (!clinica) return { error: "No hay una clínica activa." };
  // El logo tiene que estar en la carpeta de esta clínica.
  if (!rutaEsDeTenant(path, clinica.id)) return { error: "Ruta de logo inválida." };
  const supabase = createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ logo_url: path })
    .eq("id", clinica.id);
  if (error) return { error: "No se pudo guardar el logo." };
  revalidatePath("/admin/clinica");
  return { error: null };
}

export async function crearSucursal(input: {
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}): Promise<{ error: string | null }> {
  if (!(await esDev())) return { error: "No autorizado." };
  if (!input.nombre?.trim()) return { error: "El nombre es obligatorio." };
  const supabase = createClient();
  const { error } = await supabase.from("sucursales").insert({
    nombre: input.nombre.trim(),
    direccion: input.direccion?.trim() || null,
    telefono: input.telefono?.trim() || null,
    email: input.email?.trim() || null,
  });
  if (error) return { error: "No se pudo crear la sucursal." };
  revalidatePath("/admin/clinica");
  return { error: null };
}

export async function actualizarSucursal(
  id: string,
  input: {
    nombre: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    activo: boolean;
  },
): Promise<{ error: string | null }> {
  if (!(await esDev())) return { error: "No autorizado." };
  if (!input.nombre?.trim()) return { error: "El nombre es obligatorio." };
  const supabase = createClient();
  const { error } = await supabase
    .from("sucursales")
    .update({
      nombre: input.nombre.trim(),
      direccion: input.direccion?.trim() || null,
      telefono: input.telefono?.trim() || null,
      email: input.email?.trim() || null,
      activo: input.activo,
    })
    .eq("id", id);
  if (error) return { error: "No se pudo actualizar la sucursal." };
  revalidatePath("/admin/clinica");
  return { error: null };
}
