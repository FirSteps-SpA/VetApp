// Agrupa por clínica lo que ve un dueño en el portal (spec 6): un dueño puede
// tener mascotas en varias clínicas. Conserva el orden de llegada dentro de
// cada grupo y el de la primera aparición de cada clínica.

export interface DeClinica {
  tenant_id: string;
  clinica_nombre: string;
}

export interface GrupoClinica<T> {
  tenant_id: string;
  clinica_nombre: string;
  items: T[];
}

export function agruparPorClinica<T extends DeClinica>(items: T[]): GrupoClinica<T>[] {
  const grupos = new Map<string, GrupoClinica<T>>();
  for (const it of items) {
    let g = grupos.get(it.tenant_id);
    if (!g) {
      g = { tenant_id: it.tenant_id, clinica_nombre: it.clinica_nombre, items: [] };
      grupos.set(it.tenant_id, g);
    }
    g.items.push(it);
  }
  return Array.from(grupos.values());
}
