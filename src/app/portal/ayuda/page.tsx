import Link from "next/link";
import type { Metadata } from "next";

import { getClinicasDelCliente } from "@/lib/data/clinica";

export const metadata: Metadata = {
  title: "Ayuda",
};

// Ayuda del portal (spec 8). Fuera del grupo bloqueado por el aviso de
// privacidad: se puede leer antes de aceptarlo. El plazo de cancelación y el
// contacto salen de cada clínica, no se escriben a mano.
export default async function AyudaPage() {
  const clinicas = await getClinicasDelCliente();

  const pregunta = (titulo: string, contenido: React.ReactNode, id?: string) => (
    <details id={id} className="rounded-card border border-border bg-surface p-4" open={!!id}>
      <summary className="cursor-pointer font-medium text-text">{titulo}</summary>
      <div className="mt-2 space-y-2 text-sm text-text-muted">{contenido}</div>
    </details>
  );

  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <h1 className="text-section font-semibold text-text">Ayuda</h1>

      {pregunta(
        "¿Cómo solicito una hora?",
        <p>
          En <Link href="/portal/citas" className="text-accent hover:underline">Citas</Link> toca
          “Solicitar hora”, elige la mascota, el día y la hora que prefieres y el motivo. La clínica
          la revisa y te avisa cuando la confirma o si necesita cambiarla.
        </p>,
      )}
      {pregunta(
        "¿Cómo cancelo una hora?",
        <>
          <p>
            En <Link href="/portal/citas" className="text-accent hover:underline">Citas</Link>, las
            horas que aún puedes cancelar tienen el botón “Cancelar”. Pasado el plazo, cancélala
            contactando a la clínica.
          </p>
          <ul className="list-disc pl-5">
            {clinicas.map((c) => (
              <li key={c.id}>
                {c.nombre_clinica}: hasta {c.horas_cancelacion} horas antes.
              </li>
            ))}
          </ul>
        </>,
      )}
      {pregunta(
        "¿Dónde están los documentos de mi mascota?",
        <p>
          En <Link href="/portal/mascotas" className="text-accent hover:underline">Mascotas</Link>,
          al abrir una mascota puedes descargar su historial y sus recetas vigentes en PDF.
        </p>,
      )}
      {pregunta(
        "¿Cómo configuro los recordatorios?",
        <p>
          En <Link href="/portal/notificaciones" className="text-accent hover:underline">Alertas</Link>{" "}
          eliges qué recordatorios recibir (citas y vacunas) y por qué medio: correo o notificaciones
          en el celular.
        </p>,
      )}
      {pregunta(
        "¿Cómo instalo la app para recibir notificaciones en el celular?",
        <>
          <p>
            <strong className="text-text">Android (Chrome):</strong> abre el portal, toca el menú ⋮ y
            elige “Instalar app” o “Agregar a pantalla de inicio”. Luego activa las notificaciones en
            Alertas.
          </p>
          <p>
            <strong className="text-text">iPhone o iPad (Safari, iOS 16.4 o superior):</strong> abre
            el portal, toca Compartir (el cuadrado con la flecha) y elige “Agregar a inicio”. Abre
            VetApp desde el ícono nuevo y activa las notificaciones en Alertas. En Safari sin
            instalar, iOS no permite notificaciones.
          </p>
        </>,
        "instalar",
      )}
      {pregunta(
        "¿Cómo descargo o elimino mis datos?",
        <p>
          En <Link href="/portal/privacidad" className="text-accent hover:underline">Privacidad</Link>{" "}
          puedes leer el aviso de privacidad de cada clínica y descargar tus datos. Para corregirlos
          o eliminarlos, pídelo a la clínica.
        </p>,
      )}
      {pregunta(
        "¿A quién contacto?",
        <ul className="list-disc pl-5">
          {clinicas.map((c) => (
            <li key={c.id}>
              <span className="text-text">{c.nombre_clinica}</span>
              {[c.telefono, c.email, [c.direccion, c.ciudad].filter(Boolean).join(", ")]
                .filter(Boolean)
                .map((x) => ` · ${x}`)
                .join("")}
            </li>
          ))}
        </ul>,
      )}
    </div>
  );
}
