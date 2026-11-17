import "server-only";

import { instanteEnZona, sumarDias } from "@/lib/utils/zona";
import { createClient } from "@/lib/supabase/server";

// Registro de accesos de la clínica activa (spec 7). Solo la cuenta de
// plataforma lo lee (RLS); los filtros por texto se resuelven a ids.

export interface FiltrosAccesos {
  paciente?: string; // nombre o número de ficha
  dueno?: string; // nombre o RUT
  cuenta?: string; // id de usuario
  desde?: string; // AAAA-MM-DD, hora de la clínica
  hasta?: string;
  pagina?: number;
}

export interface FilaAcceso {
  id: number;
  created_at: string;
  accion: string;
  detalle: Record<string, unknown>;
  cuenta: string;
  paciente: string | null;
  dueno: string | null;
}

export const POR_PAGINA = 50;

// El texto va dentro de un filtro `or` de PostgREST: sin los caracteres que
// cambiarían su sintaxis (coma, paréntesis, comodines).
const limpio = (t: string) => t.trim().replace(/[,()*%\\:"]/g, " ").trim();

export async function getRegistroAccesos(
  f: FiltrosAccesos,
): Promise<{ filas: FilaAcceso[]; hayMas: boolean }> {
  const supabase = createClient();
  let q = supabase
    .from("registro_accesos")
    .select("id, created_at, accion, detalle, usuario_id, paciente_id, dueno_id")
    .order("created_at", { ascending: false });

  if (f.paciente && limpio(f.paciente)) {
    const t = limpio(f.paciente);
    const { data } = await supabase
      .from("pacientes")
      .select("id")
      .or(`nombre.ilike.%${t}%,numero_ficha.ilike.%${t}%`)
      .limit(200);
    q = q.in("paciente_id", ((data as { id: string }[]) ?? []).map((p) => p.id));
  }
  if (f.dueno && limpio(f.dueno)) {
    const t = limpio(f.dueno);
    const { data } = await supabase
      .from("duenos")
      .select("id")
      .or(`nombre.ilike.%${t}%,rut.ilike.%${t}%`)
      .limit(200);
    q = q.in("dueno_id", ((data as { id: string }[]) ?? []).map((d) => d.id));
  }
  if (f.cuenta) q = q.eq("usuario_id", f.cuenta);
  if (f.desde) q = q.gte("created_at", instanteEnZona(f.desde, "00:00").toISOString());
  // Hasta el final del día indicado: antes de las 00:00 del día siguiente.
  if (f.hasta) q = q.lt("created_at", instanteEnZona(sumarDias(f.hasta, 1)).toISOString());

  const pagina = Math.max(1, f.pagina ?? 1);
  const desdeFila = (pagina - 1) * POR_PAGINA;
  const { data, error } = await q.range(desdeFila, desdeFila + POR_PAGINA);
  if (error) {
    console.error("getRegistroAccesos:", error.message);
    return { filas: [], hayMas: false };
  }
  type Raw = {
    id: number;
    created_at: string;
    accion: string;
    detalle: Record<string, unknown>;
    usuario_id: string;
    paciente_id: string | null;
    dueno_id: string | null;
  };
  const raw = ((data as Raw[]) ?? []).slice(0, POR_PAGINA);
  const unicos = (xs: (string | null)[]) => Array.from(new Set(xs.filter((x): x is string => !!x)));
  const [pacs, dues, users] = await Promise.all([
    unicos(raw.map((r) => r.paciente_id)).length
      ? supabase.from("pacientes").select("id, nombre, numero_ficha").in("id", unicos(raw.map((r) => r.paciente_id)))
      : { data: [] },
    unicos(raw.map((r) => r.dueno_id)).length
      ? supabase.from("duenos").select("id, nombre").in("id", unicos(raw.map((r) => r.dueno_id)))
      : { data: [] },
    supabase.from("usuarios").select("id, nombre, email").in("id", unicos(raw.map((r) => r.usuario_id))),
  ]);
  const mp = new Map(((pacs.data as { id: string; nombre: string; numero_ficha: string }[]) ?? []).map((p) => [p.id, `${p.nombre} (${p.numero_ficha})`]));
  const md = new Map(((dues.data as { id: string; nombre: string }[]) ?? []).map((d) => [d.id, d.nombre]));
  const mu = new Map(((users.data as { id: string; nombre: string; email: string }[]) ?? []).map((u) => [u.id, u.nombre || u.email]));

  return {
    filas: raw.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      accion: r.accion,
      detalle: r.detalle ?? {},
      // Una cuenta eliminada (p. ej. un dueño anonimizado) ya no tiene nombre.
      cuenta: mu.get(r.usuario_id) ?? "Cuenta eliminada",
      paciente: r.paciente_id ? (mp.get(r.paciente_id) ?? "—") : null,
      dueno: r.dueno_id ? (md.get(r.dueno_id) ?? "—") : null,
    })),
    hayMas: ((data as Raw[]) ?? []).length > POR_PAGINA,
  };
}

// Cuentas para el filtro: staff de la clínica y clientes con ficha en ella.
export async function getCuentasClinica(): Promise<{ id: string; nombre: string }[]> {
  const supabase = createClient();
  const { data } = await supabase.from("usuarios").select("id, nombre, email").order("nombre");
  return ((data as { id: string; nombre: string; email: string }[]) ?? []).map((u) => ({
    id: u.id,
    nombre: u.nombre || u.email,
  }));
}
