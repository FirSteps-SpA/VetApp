# Proposal

## Why

VetApp hoy sirve a una sola clínica: hay una única fila en `clinica_config`, ninguna tabla tiene `clinica_id` y la RLS solo distingue roles. Para venderla a más clínicas, cada una tiene que operar en el mismo proyecto con sus datos totalmente aislados.

Conviene hacerlo **antes** de abrir el portal (spec 8). Migrar después a los dueños, que son usuarios externos con datos y consentimientos, sería mucho más delicado. Además, la privacidad (spec 7) y el portal tienen que nacer por clínica. Es la spec #6 del roadmap de VetApp (`1stDocs/005-roadmap/001-VetApp.md`).

## What Changes

**Clínica (tenant)**
- Tabla nueva **`tenants`**: nombre, `slug` único, logo y datos legales. Reemplaza a `clinica_config`.
- La clínica actual pasa a ser el **tenant 1** sin cambios visibles: mismos datos, números de ficha y receta, logo y PDFs.
- **`tenant_id` en todas las tablas de datos de la clínica**:
  - sucursales, usuarios del staff, dueños, pacientes y sus vínculos;
  - consultas, recetas, exámenes, vacunas, esquemas de vacunación y citas;
  - documentos emitidos, notificaciones y `audit_log`.
- La consistencia entre tablas la garantiza la base: una consulta no puede apuntar a un paciente de otra clínica.

**Aislamiento**
- **RLS por tenant** combinada con los roles actuales. El staff solo ve y escribe datos de su clínica. Los dueños solo ven lo suyo, en cada clínica donde tienen ficha.
- **Unicidades por clínica**:
  - número de ficha (`PAC-`) y de receta (`REC-`), con correlativos propios por clínica;
  - RUT de dueño y de paciente, email de dueño y microchip.
  - **BREAKING (esquema):** las restricciones únicas globales pasan a ser compuestas con `tenant_id`.
- **Storage con prefijo de tenant** (`<tenant_id>/...`) en todos los buckets, con políticas que lo exigen. Los archivos actuales se mueven al prefijo del tenant 1.

**Entrada y marca**
- **Login de la clínica en `/c/<slug>/login`**, con su logo y nombre. `/login` sin slug queda como **login genérico** con la marca VetApp. Después del login las rutas no cambian y la clínica sale de la sesión.
- Los enlaces de invitación (staff y dueños) llevan a la entrada con la marca de su clínica.
- Branding (header, riel, login, PDFs, emails y push) por tenant.

**Dueños en varias clínicas**
- Una sola cuenta de acceso puede enlazarse a una ficha de dueño en cada clínica.
- Invitar desde una segunda clínica un email que ya tiene cuenta de cliente la **enlaza** a la nueva ficha, en vez de rechazarla.
- El portal agrupa las mascotas, citas y documentos por clínica. Cada clínica sigue viendo solo su ficha de dueño.

**Plataforma**
- El staff pertenece a una sola clínica.
- La cuenta **dev** administra la plataforma:
  - da de alta clínicas (nombre, slug, logo, datos legales y sucursal inicial);
  - administra sus usuarios;
  - **cambia de clínica activa** para dar soporte.
- Procedimiento documentado de alta de una clínica nueva, en menos de 30 minutos.

**Pruebas**
- `test:rls` con dos tenants: el staff y los dueños de uno no ven nada del otro, incluido Storage, y un dueño con fichas en ambos ve cada una por separado.
- La migración se prueba sobre una restauración del respaldo de producción antes de aplicarla.

## Capabilities

### New Capabilities
- `clinic-tenancy`: modelo de clínicas (tenants), pertenencia de cada dato a una clínica, aislamiento por RLS y Storage, unicidades y correlativos por clínica, y migración de la clínica actual.
- `clinic-entry-and-onboarding`: entrada por clínica (`/c/<slug>`) y login genérico, alta de clínicas y cambio de clínica activa por la cuenta de plataforma, y procedimiento documentado de alta.
- `owner-multi-clinic-access`: una cuenta de dueño enlazada a fichas en varias clínicas, invitación que reutiliza la cuenta y portal agrupado por clínica.

### Modified Capabilities
- `clinic-branding-display`: la marca sale de la clínica del usuario (o del slug en la entrada), no de una configuración única. El login genérico muestra la marca VetApp.
- `patient-owner-identity`: la unicidad del RUT de dueño pasa a ser por clínica.
- `patient-microchip-identifier`: la unicidad del microchip pasa a ser por clínica.

## Impact

- **Base de datos:** una migración grande y transaccional.
  - Tablas `tenants` y `tenant_correlativos`.
  - Columna `tenant_id`, FKs compuestas y unicidades por tenant.
  - `current_tenant_id()` leído del JWT (`app_metadata.tenant_id`, sincronizado como hoy `rol`).
  - Reescritura de las 69 políticas RLS y de las de Storage.
  - Funciones `portal_*`, `buscar_pacientes`, correlativos y `recalcular_alertas_vacunas` por tenant.
  - Se elimina `clinica_config`.
- **Storage:** un script mueve los objetos existentes al prefijo del tenant 1 y actualiza las rutas guardadas.
- **App:**
  - `src/lib/data/clinica.ts` pasa a leer del tenant.
  - Rutas nuevas `/c/[slug]/login` y `/admin/clinicas`, más el selector de clínica activa para dev.
  - Las subidas a Storage usan el prefijo del tenant.
  - Invitaciones de staff y de dueños.
  - El portal agrupa por clínica.
  - El cron de notificaciones aplica la marca de cada clínica.
  - Las llamadas con `service_role` filtran por tenant de forma explícita.
- **Operación:**
  - Respaldo y prueba de la migración sobre una restauración.
  - `supabase db push` más el script de Storage al pasar a `main`.
  - Documento de alta de clínica en 1stDocs.
- **Fuera de alcance:**
  - Rol de administrador por clínica: por ahora la administración la hace la cuenta dev.
  - Subdominios.
  - Staff en varias clínicas.
  - Facturación.
