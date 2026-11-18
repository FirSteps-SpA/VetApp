# Tasks

## 1. Migración

- [x] 1.1 Crear las columnas nuevas:
  - `tenants.horas_cancelacion` (0–168, por defecto 24);
  - `citas.cancelada_por_cliente` y `citas.cancelada_en`;
  - `usuarios.bienvenida_vista_en`.
- [x] 1.2 Crear `cancelar_cita_portal(p_cita, p_motivo)`:
  - comprueba propiedad, aviso aceptado, estado y plazo;
  - modifica solo el estado, la marca, la fecha y el motivo;
  - devuelve los datos para el acuse.
- [x] 1.3 Redefinir `portal_citas()` con la columna `cancelable`. Revocar `execute` donde corresponda.

## 2. Correo con la marca de la clínica

- [x] 2.1 `enviarEmail` con remitente "Clínica <RESEND_FROM>" saneado y `reply_to`. Compatible con `RESEND_FROM` en formato `Nombre <dir>`.
- [x] 2.2 `plantilla-email.ts` (HTML con estilos en línea y texto plano, escapado, logo y pie con contacto) y `mensajes.ts` (invitación, recordatorios de cita y vacuna, hora confirmada, rechazada y cancelada), con tests: escapado, URL del botón, saneo del remitente y contenido de cada mensaje.
- [x] 2.3 `enviar.ts`, el cron y Reservas usan los mensajes nuevos. Un correo que no se envía queda registrado y no interrumpe la acción.
- [x] 2.4 `invitarCliente` envía el correo y devuelve `correoEnviado`. La UI muestra el enlace con el estado del envío.

## 3. Cancelación

- [x] 3.1 Portal › Citas: botón Cancelar en las horas cancelables, con motivo opcional y confirmación. En las demás, el texto "Para cancelarla, contacta a la clínica".
- [x] 3.2 Server action `cancelarCita`: llama a la función y envía el acuse con `notificarDueno`.
- [x] 3.3 Agenda y Reservas: etiqueta "Cancelada por el dueño" con el motivo, y pestaña "Canceladas por dueños" (últimos 14 días) en Reservas.
- [x] 3.4 Admin › Clínica: campo "Plazo de cancelación (horas)".

## 4. Bienvenida y ayuda

- [x] 4.1 Bienvenida en el inicio del portal mientras `bienvenida_vista_en` sea nulo. "Entendido" la marca como vista.
- [x] 4.2 `/portal/ayuda` (fuera del bloqueo por aviso):
  - preguntas frecuentes;
  - plazo de cancelación y contacto de cada clínica;
  - instalación en Android e iOS.

  Enlace en la navegación del portal.
- [x] 4.3 `push-toggle`: en iOS sin la app instalada, indicar el paso que falta con enlace a la ayuda.

## 5. Pruebas y verificación

- [x] 5.1 Agregar a `test:rls` la cancelación:
  - a tiempo: se cancela;
  - fuera de plazo y en estados no cancelables: se rechaza;
  - hora ajena y sin aviso aceptado: se rechaza;
  - cambios directos a `citas` por el dueño: se rechazan;
  - `cancelable` en `portal_citas`;
  - plazo distinto por clínica.
- [x] 5.2 `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build` y `npm run test:rls`.
- [x] 5.3 Recorrido con Playwright:
  - invitar: muestra el enlace y el estado del correo;
  - correo capturado en el inbox local (Mailpit/Inbucket) o vía la plantilla;
  - el dueño entra, acepta el aviso y ve la bienvenida, que no vuelve al cerrarla;
  - ayuda con el plazo de su clínica;
  - cancela una hora a tiempo; otra fuera de plazo no se ofrece;
  - el staff la ve en la agenda y en Reservas;
  - el plazo se cambia en Admin.

## 6. Documentación

- [x] 6.1 `1stDocs/004-operacion/piloto-portal-vetapp.md`:
  - dominio en Resend (SPF, DKIM, DMARC) y variables en Vercel;
  - prerrequisitos;
  - selección de los dueños, invitación, seguimiento y opinión;
  - checklist manual de push en Android e iOS.

## Workflow follow-up

- Commit, PR contra `develop`, merge, `/opsx:archive` y marcar la spec 8 en el roadmap y el backlog de 1stDocs.
- Fuera del repo y antes del piloto:
  - registrar o elegir el dominio de VetApp y verificarlo en Resend;
  - pasar las specs 6, 7 y 8 a producción;
  - probar el push en dispositivos reales con el checklist.
