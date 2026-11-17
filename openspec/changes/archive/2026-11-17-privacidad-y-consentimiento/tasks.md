# Tasks

## 1. Migración

- [x] 1.1 Crear `avisos_privacidad`:
  - versión única por clínica;
  - `publicar_aviso(p_texto)`, solo dev;
  - trigger que impide `update` y `delete`;
  - RLS: staff de la clínica, y dueños de sus clínicas.
- [x] 1.2 Crear `aceptaciones_privacidad`, `aceptar_aviso(p_aviso)` y `aviso_aceptado(p_dueno)`, con trigger de inmutabilidad y RLS.
- [x] 1.3 Redefinir `cliente_owns_paciente()` para que exija la aceptación de la versión vigente. Agregar a `portal_mi_dueno` las columnas `aviso_vigente_id` y `aviso_pendiente`.
- [x] 1.4 Crear `registro_accesos`:
  - `registrar_acceso(...)` con las reglas de staff y de cliente;
  - trigger de inmutabilidad;
  - RLS de lectura solo para dev por clínica;
  - índices.
- [x] 1.5 Crear `anonimizar_dueno(p_dueno)`. Un dueño lee sus aceptaciones por RLS (`usuario_id = auth.uid()`) y sus preferencias con la política existente. Revocar `execute` donde corresponda.

## 2. Aviso y aceptación

- [x] 2.1 `src/lib/privacidad/plantilla.ts` (plantilla a partir de `ClinicaConfig`) con tests.
- [x] 2.2 Admin › Privacidad:
  - editor precargado con la plantilla o la versión vigente;
  - vista previa;
  - publicar, con la advertencia de que una versión nueva obliga a aceptarla otra vez;
  - lista de versiones;
  - recordatorio de validar el texto con asesoría legal.
- [x] 2.3 Portal:
  - redirigir a `/portal/privacidad` con avisos pendientes;
  - aceptar cada aviso;
  - sección de privacidad con los avisos vigentes y la fecha de aceptación.
- [x] 2.4 `invitarCliente`: rechazar la invitación si la clínica no tiene aviso publicado.

## 3. Datos del dueño

- [x] 3.1 `src/lib/privacidad/paquete.ts` (`armarPaqueteDatos`), con tests: contenido, sin notas internas ni exámenes internos.
- [x] 3.2 `DatosDuenoDoc` (PDF del paquete).
- [x] 3.3 Portal: "Descargar mis datos" por clínica (PDF y JSON), con registro de la exportación.
- [x] 3.4 Ficha del dueño (staff clínico): "Exportar datos" (PDF y JSON), con registro.
- [x] 3.5 Ficha del dueño (staff clínico):
  - "Eliminar datos personales", con confirmación escribiendo `ELIMINAR`;
  - llama a `anonimizar_dueno` y elimina la cuenta si no le quedan fichas;
  - las acciones no se muestran a recepcionistas.

## 4. Registro de accesos

- [x] 4.1 Registrar `ver_ficha` al abrir la ficha del paciente. Si falla, la ficha se muestra igual y el error va a Sentry.
- [x] 4.2 Registrar `exportar_documento` antes de cada descarga o impresión del staff: historial, recetas, vacunación, derivación y autorizaciones.
- [x] 4.3 Registrar `descargar_portal` en las descargas del portal.
- [x] 4.4 Admin › Registro de accesos (solo dev): lista paginada por clínica, con filtros por paciente, dueño, cuenta y fechas.

## 5. Pruebas y verificación

- [x] 5.1 Agregar a `test:rls`:
  - dueño sin aceptación: sin datos en `portal_*`, recetas ni exámenes;
  - con aceptación: los ve;
  - una versión nueva lo vuelve a bloquear;
  - aceptar un aviso que no es el vigente o de otra clínica: se rechaza;
  - avisos, aceptaciones y registro: no se pueden modificar ni borrar;
  - `registrar_acceso` a nombre propio, y rechazo de pacientes ajenos;
  - registro legible solo por dev de la clínica;
  - anonimización: solo staff clínico de la clínica, sin datos personales y con la ficha clínica conservada.
- [x] 5.2 `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build` y `npm run test:rls`.
- [x] 5.3 Recorrido con Playwright:
  - publicar un aviso;
  - invitar a un dueño;
  - el dueño acepta y ve sus mascotas;
  - una versión nueva pide aceptar de nuevo;
  - el dueño descarga sus datos (PDF y JSON);
  - el staff exporta los datos de un dueño sin portal;
  - anonimización: ficha sin datos, historial conservado, sin acceso al portal;
  - el registro muestra las aperturas y exportaciones.

## 6. Documentación

- [x] 6.1 Procedimiento de solicitudes de datos en `1stDocs/004-operacion/`:
  - acceso o portabilidad;
  - eliminación;
  - consulta del registro;
  - qué se conserva y por qué;
  - plazos de respuesta según la Ley 21.719, a validar con asesoría.

## Workflow follow-up

- Commit, PR contra `develop`, merge, `/opsx:archive` y marcar la spec 7 en el roadmap y el backlog de 1stDocs.
- Antes de invitar al primer dueño (spec 8), cada clínica publica su aviso de privacidad.
