# Proposal

## Why

El portal va a sumar los primeros usuarios externos de VetApp: dueños con datos personales (spec 8). La arquitectura (§9.7) exige que acepten la política de privacidad y que puedan pedir la eliminación de su cuenta, y hoy nada de eso existe.

Además, la Ley 21.719 de protección de datos personales entra en vigencia el 1-12-2026 (hay un proyecto de postergación en trámite). Pide transparencia, derechos de acceso, portabilidad y supresión, y medidas de seguridad.

Es la spec #7 del roadmap de VetApp (`1stDocs/005-roadmap/001-VetApp.md`) y va antes de invitar al primer dueño. Los textos legales los valida cada clínica con su asesoría; VetApp aporta la mecánica.

## What Changes

**Aviso de privacidad por clínica**
- VetApp trae una plantilla con los datos de la clínica: identidad y contacto, finalidades, derechos, cómo ejercerlos y política de retención.
- La clínica la edita y la publica desde Admin. Cada publicación crea una **versión inmutable** nueva.
- Sin un aviso publicado, la clínica no puede invitar dueños al portal.

**Aceptación obligatoria**
- Al entrar al portal, el dueño acepta la versión vigente del aviso de cada clínica donde tiene ficha. Se registra fecha, versión y cuenta.
- Mientras no acepte, no ve datos de esa clínica. Lo exige la base, no solo la pantalla.
- Una versión nueva vuelve a pedir la aceptación.

**Exportación de los datos del dueño (acceso y portabilidad)**
- El dueño los descarga desde el portal en un PDF legible y un JSON: sus datos, sus mascotas y lo que ve en el portal, sin notas internas.
- El staff genera el mismo paquete para dueños sin portal.

**Eliminación por anonimización (supresión)**
- El staff procesa la solicitud de un dueño.
- Se borran sus datos personales (nombre, RUT, contacto, dirección, notas) y sus preferencias, y se revoca su acceso al portal en esa clínica. La cuenta se elimina si no tiene fichas en otras clínicas.
- Las fichas de sus mascotas se conservan sin dueño identificable, por ser registros médicos (§9.7).
- La acción es irreversible y queda registrada.

**Registro de accesos**
- Se registra cada apertura de una ficha, cada documento exportado (staff y portal), cada exportación de datos y cada anonimización: quién, qué y cuándo.
- No se puede modificar ni borrar desde la app.
- La cuenta de plataforma lo consulta por clínica en Admin.

**Procedimiento documentado** en 1stDocs para atender solicitudes de acceso y de eliminación.

## Capabilities

### New Capabilities
- `privacy-notice-consent`: aviso de privacidad versionado por clínica y aceptación obligatoria del dueño antes de acceder al portal.
- `owner-data-rights`: exportación de los datos del dueño (portal y staff) y anonimización a pedido.
- `access-logging`: registro inmutable de aperturas de fichas, exportaciones y anonimizaciones, y su consulta por clínica.

### Modified Capabilities
<!-- Ninguna: las invitaciones y el portal agrupado (owner-multi-clinic-access) mantienen sus requisitos; el bloqueo por aceptación y la condición de aviso publicado para invitar se definen en privacy-notice-consent. -->

## Impact

- **Base de datos:** una migración.
  - Tablas `avisos_privacidad` (versiones), `aceptaciones_privacidad` y `registro_accesos`, con RLS por clínica.
  - `cliente_owns_paciente` y las funciones `portal_*` exigen la aceptación de la versión vigente.
  - Funciones `registrar_acceso(...)`, `publicar_aviso(...)` y `anonimizar_dueno(...)`.
- **App:**
  - Admin › Privacidad (editor y versiones) y Admin › Registro de accesos.
  - Pantalla de aceptación en el portal y "Descargar mis datos".
  - Acciones "Exportar datos" y "Eliminar datos personales" en la ficha del dueño.
  - Registro en la ficha del paciente y en cada exportación de documentos.
  - Bloqueo de la invitación sin aviso publicado.
- **Pruebas:** `test:rls` cubre el bloqueo sin aceptación, que el registro no se pueda alterar y la anonimización. El recorrido de exportación y eliminación se prueba con Playwright.
- **Documentación:** procedimiento de solicitudes de datos en `1stDocs/004-operacion/`.
- **Fuera de alcance:**
  - Notificación de filtraciones a la autoridad.
  - Evaluaciones de impacto.
  - Contratos con encargados (Supabase, Vercel, Resend).
  - Borrado automático por retención.

  Quedan anotados para revisarlos con asesoría legal.
