# Design

## Context

Ver `proposal.md`. Estado actual relevante:

- **Identidad:** `current_rol()` y `current_sucursal_id()` leen `auth.jwt() -> app_metadata`. El trigger `sync_usuario_metadata` escribe esos valores en `auth.users` cuando cambia `usuarios`. La RLS (69 políticas) usa `is_staff()`, `is_clinico()`, `current_rol()` y, para los dueños, las funciones `portal_*` y `cliente_owns_paciente()` / `es_mi_dueno()`.
- **Unicidades globales:**
  - `pacientes.numero_ficha` y `recetas.numero_receta`, por trigger con las secuencias `seq_numero_ficha` y `seq_numero_receta`;
  - `duenos.email` y `duenos.usuario_id`;
  - índices únicos sobre `rut_normalizado` en pacientes y dueños;
  - `usuarios.email`.
- **Configuración y marca:** `clinica_config` es una fila única (`id = 1`) con nombre, logo (`logo_url`) y datos legales. La lee `src/lib/data/clinica.ts`, también sin sesión para el login, con `service_role`.
- **Storage:**
  - Buckets privados `fotos-pacientes`, `examenes`, `recetas-pdf` e `historiales-pdf`, con acceso para todo `is_clinico()` sin condición de ruta.
  - Bucket público `clinica-assets` para el logo.
  - Rutas guardadas en `pacientes.foto_url`, `examenes.archivo_url`, `recetas.pdf_url` y `clinica_config.logo_url`.
- **`service_role`** se usa en las invitaciones de staff y dueños, el portal (URLs firmadas), el cron de notificaciones y el branding del login. Salta la RLS.
- **Revocar** el acceso de un dueño desactiva su cuenta (`usuarios.activo = false`) y lo desvincula.
- **DentdeLion** ya hizo este cambio con una migración transaccional, `tenants`, `tenant_actual()` y RLS reescrita, y lo seguimos donde aplica.

## Goals / Non-Goals

**Goals:**
- El aislamiento lo garantiza la base de datos (RLS, FKs compuestas y políticas de Storage), no el código de la app.
- El código actual del staff sigue funcionando casi sin cambios: `tenant_id` se completa solo desde la sesión.
- Toda la migración de esquema y datos en una sola transacción, ensayada sobre una restauración del respaldo de producción.

**Non-Goals:**
- Un rol de administrador por clínica. La administración (usuarios y configuración de cada clínica) la hace la cuenta dev con la clínica activa.
- Subdominios y dominios propios por clínica.
- Staff en varias clínicas y facturación.
- Compartir datos entre clínicas, por ejemplo una mascota derivada.

## Decisions

### 1. El tenant viaja en el JWT, como el rol
`usuarios.tenant_id` (nulo solo para `rol = 'cliente'`, mediante un check) se sincroniza en `app_metadata.tenant_id` con el mismo `sync_usuario_metadata`.

`current_tenant_id()` (`security definer`, `stable`) devuelve el tenant del JWT **solo si la clínica está activa**. Para una clínica desactivada devuelve `null` y toda la RLS niega el acceso.

*Alternativa descartada:* buscar el tenant en `usuarios` dentro de cada política. Agrega un join por fila y DentdeLion ya validó el patrón del JWT. El JWT viejo dura hasta el refresh, lo mismo que hoy con el rol. Al cambiar de clínica, la app fuerza `refreshSession()`.

### 2. `tenant_id` en las tablas, FKs compuestas y valor por defecto
`tenant_id uuid not null default current_tenant_id() references tenants` en:
- sucursales, dueños, pacientes, `paciente_duenos`, consultas, recetas, exámenes, vacunas;
- `esquemas_vacunacion`, citas, `documentos_emitidos`;
- `notificaciones`, `notificaciones_config` y `audit_log`.

`usuarios` lo lleva nulable. `push_subscriptions` no lo lleva, porque es por cuenta.

La consistencia entre clínicas la dan las **FKs compuestas** `(x_id, tenant_id) → padre(id, tenant_id)`, con `unique (id, tenant_id)` en los padres. Cubren paciente, dueño, consulta, cita, sucursal y veterinario responsable.

Las compuestas **reemplazan** a las FKs simples, con el mismo comportamiento al borrar. Las de dueño en `documentos_emitidos` usan `on delete set null (dueno_id)`, que anula solo la referencia y no el tenant. Si convivieran ambas, PostgREST vería dos relaciones entre las mismas tablas y fallarían todos los embeds (`pacientes(nombre)`…). El ensayo lo detectó, y `test:rls` lo controla.

El relleno de `tenant_id` y de las rutas de Storage corre con los triggers de usuario desactivados. Así no cambia `updated_at` ni se escribe en `audit_log`, y en el ensayo los conteos y los `updated_at` quedaron idénticos.

`audit_log.usuario_id` y `documentos_emitidos.emitido_por` siguen con FK simple: la cuenta dev actúa en varias clínicas. El `audit_trigger` copia `tenant_id` de la fila auditada.

Las escrituras con `service_role` no tienen JWT: el `default` queda nulo y el `not null` las rechaza si olvidan el tenant. Es una red de seguridad a favor.

*Alternativa descartada:* triggers de verificación por tabla. Son más código y más fáciles de olvidar al agregar una tabla.

### 3. RLS reescrita: tenant y rol
Se reemplazan todas las políticas por la forma `tenant_id = current_tenant_id() and <condición de rol actual>`. Los dueños no cambian de mecanismo: `portal_*` y `cliente_owns_paciente` ya filtran por `duenos.usuario_id = auth.uid()`, y una ficha de dueño solo se enlaza con pacientes de su clínica (FK compuesta).

Las funciones `portal_*` agregan `tenant_id` y el nombre de la clínica a sus resultados para que el portal agrupe. `buscar_pacientes` y `recalcular_alertas_vacunas` filtran por tenant: la primera por la sesión, la segunda recorre todas las clínicas.

### 4. Tabla `tenants` en lugar de `clinica_config`
`tenants (id, slug unique, nombre, logo_url, numero_registro, email, telefono, direccion, …, activo, created_at)` toma todas las columnas de `clinica_config`. El tenant 1 se crea con un UUID fijo y slug elegido al aplicar (provisorio `principal`, ver Open Questions).

- **RLS:** el staff lee y, si es dev, edita su clínica; la cuenta dev además lista y crea clínicas.
- **Login:** la marca pública por slug sale de `branding_por_slug(slug)` (`security definer`). Solo devuelve nombre y logo de una clínica activa, así que la marca sin sesión deja de necesitar `service_role`.
- Se elimina `clinica_config`.

### 5. Correlativos por clínica sin saltos
La tabla `tenant_correlativos (tenant_id, tipo, ultimo)` reemplaza las secuencias. `set_numero_ficha` y `set_numero_receta` hacen `update … set ultimo = ultimo + 1 … returning`. El bloqueo de fila serializa por clínica y, si la transacción falla, no queda salto.

El tenant 1 se inicializa con el máximo numérico actual de cada tipo. Las unicidades pasan a `(tenant_id, numero_ficha)` y `(tenant_id, numero_receta)`.

*Alternativa descartada:* una secuencia por clínica. Exige DDL al dar de alta cada clínica y puede dejar saltos.

### 6. Unicidades por clínica
Pasan a `(tenant_id, …)`: `duenos.email`, `duenos.usuario_id` (una ficha por clínica para cada cuenta), `duenos.rut_normalizado` y `pacientes.rut_normalizado`.

`usuarios.email` sigue siendo global: una cuenta por email.

### 7. Storage con prefijo `<tenant_id>/`
Las políticas privadas exigen `(storage.foldername(name))[1] = current_tenant_id()::text` además del rol. En `clinica-assets`, la lectura sigue pública y la escritura queda solo para dev en la carpeta de la clínica activa.

La migración antepone la carpeta del tenant 1 a las rutas guardadas (`foto_url`, `archivo_url`, `pdf_url` y `logo_url`). Los objetos existentes no se pueden mover con SQL, porque renombrar en `storage.objects` no mueve el archivo. Un **script Node idempotente** (`scripts/migrar-storage-tenant.mjs`, con `service_role`):
- mueve cada objeto con la API `move`;
- corrige cualquier ruta guardada que haya quedado sin carpeta;
- informa los conteos.

Una ruta "ya migrada" es la que empieza con el id de un tenant existente. No basta con que empiece con un UUID: las fotos se guardaban como `<paciente_id>/…`.

La app construye las rutas nuevas con el prefijo, mediante un helper único.

### 8. Entrada `/c/[slug]/login` e invitaciones
- **Rutas:** `/c/[slug]/login` reutiliza el formulario de login con la marca de `branding_por_slug`; un slug inexistente o inactivo responde 404. `/login` muestra la marca VetApp. El middleware deja pasar `/c/*` sin sesión.
- **Sesión:** después del login todo sale del JWT.
- **Enlaces:** las invitaciones (`generateLink`) usan `redirectTo` hacia la entrada de la clínica que invita, y un usuario que cierra sesión vuelve a la entrada de su clínica.

### 9. Cuenta de plataforma: alta y clínica activa
`/admin/clinicas` (solo dev) lista, crea y desactiva clínicas. El alta crea en una sola función `crear_clinica(...)` (`security definer`, que verifica `current_rol() = 'dev'`):
- el tenant;
- la sucursal inicial;
- el correlativo;
- una copia de los esquemas de vacunación del tenant 1.

El header del staff muestra la clínica activa. Para la cuenta dev es un selector que actualiza `usuarios.tenant_id` mediante `cambiar_clinica_activa(id)` (solo dev) y luego hace `refreshSession()`.

La cuenta dev no es elegible como veterinario responsable (spec 3), así que nunca queda como responsable de registros de una clínica.

### 10. Dueños en varias clínicas
- **Invitación:** si el email ya tiene una cuenta de cliente, se enlaza a la ficha de esta clínica, salvo que la cuenta ya tenga una ficha en esta misma clínica (unicidad `(tenant_id, usuario_id)`).
- **Revocación:** desvincula la ficha y solo desactiva la cuenta cuando no le queda ninguna ficha enlazada.
- **Portal:** agrupa por `tenant_id` y muestra la marca de cada clínica en sus PDFs. Con una sola clínica, el chrome muestra esa marca como hoy; con varias, la marca VetApp.

### 11. Código con `service_role`
Cada uso pasa a filtrar o asignar el tenant de forma explícita: invitaciones de staff y de dueños, `portal.ts` (URLs firmadas solo de rutas de mascotas del dueño), cron de notificaciones y envío. Se agrega un control a `test:rls` para cada uno donde sea posible probarlo.

### 12. Ensayo sobre producción restaurada y despliegue
1. **Ensayo:**
   - restaurar el respaldo más reciente en el Supabase local, como indica el README de `respaldo.sh`;
   - aplicar la migración;
   - correr un script de verificación: conteos por tabla iguales, todo en el tenant 1, numeración que continúa y ninguna fila con `tenant_id` nulo;
   - correr el script de Storage y `test:rls`;
   - usar la app sobre esa base.
2. **Despliegue:** en una ventana corta y anunciada, porque entre el `db push` y el merge el código anterior no conoce el prefijo de Storage:
   - respaldo;
   - `supabase db push`;
   - script de Storage;
   - merge a `main`;
   - prueba en producción.

## Risks / Trade-offs

- [Una política olvidada deja datos visibles entre clínicas] → `test:rls` con dos tenants que recorre cada tabla y bucket, más una consulta en la verificación que lista las tablas de `public` con RLS cuyo predicado no menciona `current_tenant_id()`.
- [La migración es grande y difícil de revertir con datos nuevos encima] → Transaccional, ensayada sobre la restauración y con respaldo previo. El rollback es restaurar el respaldo, y por eso se aplica en una ventana con poca actividad.
- [JWT con un tenant viejo tras cambiar de clínica o desactivarla] → Refresh forzado al cambiar. `current_tenant_id()` revisa `tenants.activo` en cada llamada, así que desactivar corta el acceso de inmediato.
- [Escrituras con `service_role` sin tenant] → `not null` sin default efectivo. Las rechaza en vez de guardarlas en una clínica equivocada.
- [Ventana entre `db push` y el merge con el código anterior] → Las subidas a Storage fallarían durante esa ventana, de minutos. Se anuncia y se ejecuta todo en una sola sesión.
- [Costo de `current_tenant_id()` en cada fila] → Es `stable` y se evalúa una vez por consulta en las políticas `tenant_id = current_tenant_id()`. Se agregan índices por `tenant_id` donde la consulta no empiece por otra clave indexada.

## Migration Plan

Ver la decisión 12. La migración SQL va en un solo archivo transaccional:
1. `tenants` y tenant 1 desde `clinica_config`.
2. Columnas `tenant_id` con relleno al tenant 1, `not null` y FKs compuestas.
3. Unicidades y correlativos.
4. Funciones.
5. RLS y Storage.
6. Eliminación de `clinica_config` y de las secuencias.

El script de Storage se ejecuta después y es idempotente.

## Open Questions

- El slug definitivo de la clínica actual, que aparece en `/c/<slug>/login` y en los enlaces de invitación. Se puede cambiar después desde Admin sin afectar el diseño.
