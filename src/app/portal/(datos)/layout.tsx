import Link from "next/link";
import { redirect } from "next/navigation";

import { getMisDuenos } from "@/lib/data/portal";

// Todo lo que muestra datos de las mascotas pasa por aquí (spec 7): sin haber
// aceptado el aviso de privacidad de ninguna clínica, el dueño va a aceptarlo.
// Si aceptó el de alguna pero falta otra, ve lo aceptado y un aviso para
// aceptar el resto. La base además no entrega datos de clínicas sin aceptar.
export default async function DatosPortalLayout({ children }: { children: React.ReactNode }) {
  const duenos = await getMisDuenos();
  const pendientes = duenos.filter((d) => d.aviso_pendiente);
  if (duenos.length > 0 && pendientes.length === duenos.length) redirect("/portal/privacidad");

  return (
    <>
      {pendientes.length > 0 && (
        <p className="mb-4 rounded-control bg-warning-subtle px-3 py-2 text-sm text-text">
          Para ver tus datos de {pendientes.map((d) => d.clinica_nombre).join(", ")}, acepta su
          aviso de privacidad en{" "}
          <Link href="/portal/privacidad" className="font-medium text-accent hover:underline">
            Privacidad
          </Link>
          .
        </p>
      )}
      {children}
    </>
  );
}
