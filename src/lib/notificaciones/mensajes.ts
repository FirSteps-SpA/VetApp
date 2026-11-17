// Mensajes a los dueños (spec 8): un solo lugar para el texto de cada aviso.
// Cada uno sirve para la notificación del portal (título y cuerpo), el push y
// el correo (párrafos y botón).

export interface Mensaje {
  tipo: string;
  titulo: string;
  cuerpo: string; // una línea: portal y push
  parrafos: string[]; // correo
  url: string; // ruta del portal
  boton: string;
}

const mascotaO = (m: string | null | undefined) => m || "tu mascota";

export function mensajeInvitacion(d: { nombreDueno: string; clinica: string; enlace: string }): Mensaje {
  return {
    tipo: "invitacion",
    titulo: `Tu acceso al portal de ${d.clinica}`,
    cuerpo: `${d.clinica} te invitó a su portal.`,
    parrafos: [
      `Hola ${d.nombreDueno}:`,
      `${d.clinica} te invitó a su portal en VetApp. Ahí puedes ver a tus mascotas y sus documentos, solicitar y cancelar horas y recibir recordatorios de citas y vacunas.`,
      "El enlace es personal: no lo compartas. Si no esperabas este correo, puedes ignorarlo.",
    ],
    url: d.enlace,
    boton: "Entrar al portal",
  };
}

export function mensajeRecordatorioCita(d: { mascota?: string | null; cuando: string }): Mensaje {
  return {
    tipo: "recordatorio_cita",
    titulo: "Recordatorio de cita",
    cuerpo: `Tienes una cita ${d.cuando} para ${mascotaO(d.mascota)}.`,
    parrafos: [
      `Te recordamos la cita de ${mascotaO(d.mascota)}: ${d.cuando}.`,
      "Si no puedes asistir, cancélala desde el portal o avísanos.",
    ],
    url: "/portal/citas",
    boton: "Ver mis citas",
  };
}

export function mensajeRecordatorioVacuna(d: { mascota?: string | null; vacuna: string; fecha: string }): Mensaje {
  return {
    tipo: "recordatorio_vacuna",
    titulo: "Recordatorio de vacuna",
    cuerpo: `${d.mascota || "Tu mascota"}: ${d.vacuna} vence el ${d.fecha}.`,
    parrafos: [
      `La vacuna ${d.vacuna} de ${mascotaO(d.mascota)} vence el ${d.fecha}.`,
      "Puedes solicitar una hora desde el portal.",
    ],
    url: "/portal",
    boton: "Solicitar hora",
  };
}

export function mensajeHoraConfirmada(d: { mascota?: string | null; cuando: string }): Mensaje {
  return {
    tipo: "cita_confirmada",
    titulo: "Cita confirmada",
    cuerpo: `Tu hora para ${mascotaO(d.mascota)} quedó confirmada: ${d.cuando}.`,
    parrafos: [`Tu hora para ${mascotaO(d.mascota)} quedó confirmada: ${d.cuando}.`],
    url: "/portal/citas",
    boton: "Ver mis citas",
  };
}

export function mensajeHoraRechazada(d: { mascota?: string | null; motivo?: string | null }): Mensaje {
  const base = `Tu solicitud de hora para ${mascotaO(d.mascota)} no pudo agendarse`;
  return {
    tipo: "cita_rechazada",
    titulo: "Solicitud de hora rechazada",
    cuerpo: d.motivo ? `${base}: ${d.motivo}` : `${base}.`,
    parrafos: [d.motivo ? `${base}: ${d.motivo}` : `${base}.`, "Puedes solicitar otra hora desde el portal."],
    url: "/portal/citas",
    boton: "Solicitar otra hora",
  };
}

export function mensajeHoraCancelada(d: { mascota?: string | null; cuando: string }): Mensaje {
  return {
    tipo: "cita_cancelada",
    titulo: "Hora cancelada",
    cuerpo: `Cancelaste la hora de ${mascotaO(d.mascota)} del ${d.cuando}.`,
    parrafos: [
      `Cancelaste la hora de ${mascotaO(d.mascota)} del ${d.cuando}.`,
      "Si fue un error, solicita una hora nueva desde el portal.",
    ],
    url: "/portal/citas",
    boton: "Ver mis citas",
  };
}
