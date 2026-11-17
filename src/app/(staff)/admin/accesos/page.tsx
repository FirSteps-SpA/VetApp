import Link from "next/link";
import type { Metadata } from "next";

import { getCuentasClinica, getRegistroAccesos } from "@/lib/data/accesos";
import { getClinicaConfigRaw } from "@/lib/data/clinica";
import { formatearFechaHora } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Registro de accesos",
};

const ACCIONES: Record<string, string> = {
  ver_ficha: "Abrió la ficha",
  exportar_documento: "Exportó un documento",
  descargar_portal: "Descargó en el portal",
  exportar_datos: "Exportó datos del dueño",
  anonimizar: "Eliminó datos personales",
};

const field =
  "rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent";

// Registro de accesos de la clínica activa (solo la cuenta de plataforma; la
// RLS no lo entrega a nadie más). Sirve para responder a un dueño quién
// accedió a sus datos.
export default async function AccesosPage({
  searchParams,
}: {
  searchParams: { paciente?: string; dueno?: string; cuenta?: string; desde?: string; hasta?: string; p?: string };
}) {
  const pagina = Number(searchParams.p) || 1;
  const [clinica, cuentas, { filas, hayMas }] = await Promise.all([
    getClinicaConfigRaw(),
    getCuentasClinica(),
    getRegistroAccesos({ ...searchParams, pagina }),
  ]);
  const qs = (p: number) =>
    new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v)), p: String(p) }).toString();

  return (
    <div>
      <Link href="/admin" className="text-sm text-text-muted hover:text-text">
        ← Administración
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold text-text">Registro de accesos</h1>
      <p className="mb-4 text-sm text-text-muted">{clinica?.nombre_clinica}</p>

      <form className="mb-4 grid gap-2 sm:grid-cols-3 desktop:grid-cols-6">
        <input name="paciente" defaultValue={searchParams.paciente} placeholder="Paciente o ficha" aria-label="Paciente" className={field} />
        <input name="dueno" defaultValue={searchParams.dueno} placeholder="Dueño o RUT" aria-label="Dueño" className={field} />
        <select name="cuenta" defaultValue={searchParams.cuenta ?? ""} aria-label="Cuenta" className={field}>
          <option value="">Todas las cuentas</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <input type="date" name="desde" defaultValue={searchParams.desde} aria-label="Desde" className={field} />
        <input type="date" name="hasta" defaultValue={searchParams.hasta} aria-label="Hasta" className={field} />
        <button type="submit" className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent">
          Filtrar
        </button>
      </form>

      {filas.length === 0 ? (
        <p className="text-sm text-text-muted">Sin registros para este filtro.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Cuenta</th>
                <th className="px-3 py-2 font-medium">Acción</th>
                <th className="px-3 py-2 font-medium">Paciente</th>
                <th className="px-3 py-2 font-medium">Dueño</th>
                <th className="px-3 py-2 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map((f) => (
                <tr key={f.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-text-muted">{formatearFechaHora(f.created_at)}</td>
                  <td className="px-3 py-2 text-text">{f.cuenta}</td>
                  <td className="px-3 py-2 text-text">{ACCIONES[f.accion] ?? f.accion}</td>
                  <td className="px-3 py-2 text-text">{f.paciente ?? "—"}</td>
                  <td className="px-3 py-2 text-text">{f.dueno ?? "—"}</td>
                  <td className="px-3 py-2 text-text-muted">
                    {typeof f.detalle.tipo === "string" ? f.detalle.tipo : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex gap-3 text-sm">
        {pagina > 1 && (
          <Link href={`/admin/accesos?${qs(pagina - 1)}`} className="text-accent hover:underline">
            ← Más recientes
          </Link>
        )}
        {hayMas && (
          <Link href={`/admin/accesos?${qs(pagina + 1)}`} className="text-accent hover:underline">
            Más antiguos →
          </Link>
        )}
      </div>
    </div>
  );
}
