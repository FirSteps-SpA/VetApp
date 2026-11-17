# Tasks

## 1. Migración: tenants, columnas y consistencia

- [x] 1.1 Crear la migración transaccional:
  - tabla `tenants`;
  - tenant 1 con UUID fijo desde `clinica_config`, slug provisorio `principal`.
- [x] 1.2 Agregar `usuarios.tenant_id`:
  - check: nulo si y solo si `rol = 'cliente'`;
  - relleno al tenant 1 para el staff y dev;
  - sincronizarlo en `app_metadata.tenant_id` con `sync_usuario_metadata`.
- [x] 1.3 Crear `current_tenant_id()` (`security definer`, `stable`), que devuelve `null` si la clínica está inactiva.
- [x] 1.4 Agregar `tenant_id` (`default current_tenant_id()`, relleno al tenant 1, `not null`) a las tablas de la decisión 2, más índices por `tenant_id`.
- [x] 1.5 Agregar `unique (id, tenant_id)` en los padres y FKs compuestas para paciente, dueño, consulta, cita y veterinario responsable.
- [x] 1.6 `audit_trigger`: copiar `tenant_id` de la fila auditada.

## 2. Migración: unicidades, correlativos y funciones

- [x] 2.1 Pasar a `(tenant_id, …)` las unicidades de:
  - `numero_ficha` y `numero_receta`;
  - `duenos.email` y `duenos.usuario_id`;
  - `rut_normalizado` de dueños y de pacientes.
- [x] 2.2 Crear `tenant_correlativos`:
  - inicializar el tenant 1 con el máximo actual;
  - reescribir `set_numero_ficha` y `set_numero_receta` sin secuencias;
  - eliminar las secuencias.
- [x] 2.3 Funciones `portal_*`: devolver `tenant_id` y el nombre de la clínica.
- [x] 2.4 `buscar_pacientes`: filtrar por la clínica de la sesión. `recalcular_alertas_vacunas`: procesar todas las clínicas.
- [x] 2.5 Crear:
  - `branding_por_slug(slug)`, pública, solo nombre y logo de una clínica activa;
  - `crear_clinica(...)`, solo dev: tenant, sucursal, correlativos y esquemas copiados;
  - `cambiar_clinica_activa(id)`, solo dev.
- [x] 2.6 Revocar `execute` de las funciones nuevas donde corresponda, como en las migraciones anteriores.

## 3. Migración: RLS y Storage

- [x] 3.1 Reescribir todas las políticas de `public` con `tenant_id = current_tenant_id()` más la condición de rol actual. `tenants`: el staff lee su clínica; dev la edita, lista todas y las crea.
- [x] 3.2 Políticas de Storage con prefijo `<tenant_id>/` en los buckets privados y escritura de `clinica-assets` en la carpeta de la clínica activa.
- [x] 3.3 Eliminar `clinica_config`. Mover `logo_url` a `tenants.logo_url`.
- [x] 3.4 Script `scripts/migrar-storage-tenant.mjs`, idempotente:
  - mueve los objetos al prefijo del tenant 1;
  - actualiza `foto_url`, `archivo_url`, `pdf_url` y `logo_url`;
  - informa los conteos.

## 4. App: datos, marca y Storage

- [x] 4.1 `src/lib/data/clinica.ts` lee del tenant de la sesión; la marca del login sale de `branding_por_slug`, sin `service_role`.
- [x] 4.2 Actualizar los tipos (`src/lib/types/db.ts`) y adaptar Admin › Clínica a `tenants`.
- [x] 4.3 Helper único de rutas de Storage con el prefijo del tenant, usado en las fotos, los exámenes, los PDFs y el logo.
- [x] 4.4 Revisar cada uso de `service_role` (invitaciones, `portal.ts`, cron y notificaciones) para que filtre o asigne el tenant de forma explícita.
- [x] 4.5 El cron y los envíos usan la marca de la clínica de cada registro.

## 5. App: entrada y plataforma

- [x] 5.1 Ruta `/c/[slug]/login` con la marca de la clínica; 404 para un slug inexistente o inactivo. `/login` con la marca VetApp. El middleware deja pasar `/c/*`.
- [x] 5.2 Invitaciones de staff y de dueños con `redirectTo` hacia la entrada de su clínica. El cierre de sesión vuelve a esa entrada.
- [x] 5.3 `/admin/clinicas` (solo dev): listar, crear con slug validado y desactivar clínicas.
- [x] 5.4 Mostrar la clínica activa en el header. Para dev, selector con `cambiar_clinica_activa` y `refreshSession()`.
- [x] 5.5 Alta de staff: rechazar un email ya usado por cualquier cuenta, con un mensaje claro.

## 6. App: dueños en varias clínicas

- [x] 6.1 Invitación de dueño: enlazar una cuenta de cliente existente a la ficha de otra clínica y rechazar una segunda ficha en la misma clínica.
- [x] 6.2 Revocación: desvincular y desactivar la cuenta solo si no le quedan fichas.
- [x] 6.3 Portal agrupado por clínica, con la marca de cada clínica en los PDFs. Con una sola clínica, el chrome se ve como hoy.

## 7. Pruebas y ensayo

- [x] 7.1 Agregar a `test:rls` un segundo tenant que cubra:
  - lectura y escritura cruzada en cada tabla;
  - búsqueda;
  - Storage en cada bucket;
  - FKs compuestas que rechazan referencias cruzadas;
  - correlativos por clínica;
  - un dueño con fichas en dos clínicas y su revocación parcial;
  - clínica desactivada;
  - funciones solo para dev.
- [x] 7.2 Consulta de verificación: ninguna tabla de `public` con RLS cuya política omita `current_tenant_id()`, salvo las justificadas.
- [x] 7.3 Tests unitarios del helper de rutas de Storage y de la agrupación del portal por clínica.
- [x] 7.4 `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build` y `npm run test:rls`.
- [x] 7.5 Ensayo sobre el respaldo de producción restaurado en local:
  - migración;
  - script de verificación (conteos, tenant 1, numeración y sin nulos);
  - script de Storage;
  - recorrido de la app con Playwright: la clínica actual sin cambios visibles y una segunda clínica aislada.

## 8. Documentación

- [x] 8.1 Procedimiento de alta de una clínica nueva en 1stDocs (`004-operacion/`), medido en una clínica de prueba: menos de 30 minutos.
- [x] 8.2 Procedimiento de despliegue de esta spec:
  - respaldo;
  - `db push`;
  - script de Storage;
  - merge;
  - prueba;
  - rollback restaurando el respaldo.

## Workflow follow-up

- Commit, PR contra `develop`, merge, `/opsx:archive` y marcar la spec 6 en el roadmap y el backlog de 1stDocs.
- El paso a `main` sigue el procedimiento de la tarea 8.2.
