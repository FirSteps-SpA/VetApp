"use server";

import { revalidatePath } from "next/cache";

import { esDev } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = createClient();
  const { error } = await supabase
    .from("clinica_config")
    .update({
      nombre_clinica: nombre,
      direccion: str(formData, "direccion") || null,
      ciudad: str(formData, "ciudad") || null,
      telefono: str(formData, "telefono") || null,
      email: str(formData, "email") || null,
      numero_registro: str(formData, "numero_registro") || null,
    })
    .eq("id", 1);

  if (error) return { error: "No se pudo guardar la configuración." };
  revalidatePath("/admin/clinica");
  return { error: null };
}

export async function setLogoClinica(
  path: string,
): Promise<{ error: string | null }> {
  if (!(await esDev())) return { error: "No autorizado." };
  const supabase = createClient();
  const { error } = await supabase
    .from("clinica_config")
    .update({ logo_url: path })
    .eq("id", 1);
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
