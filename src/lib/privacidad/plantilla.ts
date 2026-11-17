// Plantilla del aviso de privacidad (spec 7). Es un punto de partida que cada
// clínica revisa con su asesoría legal y publica desde Admin › Privacidad: el
// texto publicado (no esta plantilla) es lo que el dueño acepta.

export interface DatosClinicaAviso {
  nombre_clinica: string;
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  email: string | null;
}

export function plantillaAviso(c: DatosClinicaAviso): string {
  const domicilio = [c.direccion, c.ciudad].filter(Boolean).join(", ");
  const contacto = [c.email, c.telefono].filter(Boolean).join(" · ");
  const via = c.email ? `escribiendo a ${c.email}` : "en la clínica";

  return `AVISO DE PRIVACIDAD — ${c.nombre_clinica}

1. Responsable
${c.nombre_clinica}${domicilio ? `, con domicilio en ${domicilio}` : ""}, es responsable del tratamiento de tus datos personales.${contacto ? ` Contacto: ${contacto}.` : ""}

2. Datos que tratamos
Tus datos de identificación y contacto (nombre, RUT, teléfono, email, dirección), los datos de tus mascotas y su atención veterinaria (fichas, consultas, recetas, exámenes, vacunas y citas), tus preferencias de notificación y el registro de tu uso del portal.

3. Para qué los usamos
Para atender a tus mascotas y mantener su historial clínico, gestionar tus citas, enviarte recordatorios de citas y vacunas según tus preferencias, y darte acceso a sus documentos en el portal.

4. Base del tratamiento
Tu consentimiento, que otorgas al aceptar este aviso, y la prestación del servicio veterinario que solicitas.

5. Con quién los compartimos
No vendemos ni cedemos tus datos. Los procesan, por encargo de la clínica, los proveedores de la plataforma VetApp (alojamiento de datos y envío de correos y notificaciones), solo para prestar el servicio. Solo los comunicamos a terceros cuando la ley lo exija.

6. Tus derechos
Puedes acceder a tus datos, rectificarlos, pedir su supresión, oponerte a su tratamiento y pedir su portabilidad. Desde el portal puedes descargar tus datos en cualquier momento (sección Privacidad). Para los demás derechos, contáctanos ${via}.

7. Cuánto tiempo los conservamos
Conservamos el historial clínico de tus mascotas como registro médico mientras la clínica preste servicios, aunque pidas eliminar tus datos personales. Si lo pides, eliminamos tus datos de identificación y contacto, y las fichas de tus mascotas quedan sin un dueño identificable.

8. Cambios a este aviso
Si cambiamos este aviso, te pediremos aceptarlo de nuevo al entrar al portal.`;
}
