# VetApp

PWA para la gestión clínica de una veterinaria. Centraliza el historial de pacientes, consultas, recetas, exámenes, vacunas y agenda en un solo lugar, reemplazando los registros manuales y la documentación dispersa por WhatsApp.

La aplicación nace como herramienta de uso interno para el veterinario y está diseñada desde el inicio para evolucionar hacia un portal de acceso para los dueños de mascotas, con un modelo de roles y seguridad preparado para crecer (recepcionista, segundo veterinario y múltiples sucursales) sin refactorizar el esquema de datos.

## Características

- **Ficha clínica como eje central:** acceso inmediato a los datos críticos del paciente (última consulta, medicamentos activos, estado vacunal) en los primeros segundos de la consulta.
- **Consultas y recetas:** registro estructurado del trabajo clínico y emisión de recetas desde la propia ficha.
- **Archivos adjuntos de primera clase:** exámenes, fotos y radiografías vinculados al paciente y a la consulta.
- **Exportación a PDF:** historial completo, recetas, cartas de derivación y fichas de vacunación con el logo de la clínica.
- **Agenda y vacunas:** gestión de citas y alertas de vacunas vencidas o próximas a vencer.
- **Portal de clientes (Fase II):** acceso de los dueños al historial de sus mascotas, descarga de documentos, solicitud de horas y recordatorios automáticos.

## Stack

- **Framework:** Next.js (App Router) + TypeScript estricto
- **Tipo de app:** Progressive Web App (PWA) — instalable en móvil y desktop, sin app store
- **Backend:** Supabase (Auth, PostgreSQL con Row Level Security, Storage)
- **Generación de PDF:** `@react-pdf/renderer` (client-side)

## Puesta en marcha (desarrollo)

Requisitos: Node.js 20+ (recomendado 24), Docker y la
[Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
El desarrollo se hace contra un **Supabase local** (Docker), nunca contra producción.

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Levantar Supabase local**

   ```bash
   supabase start
   ```

   Aplica todas las migraciones de [`supabase/migrations/`](supabase/migrations) y el
   seed [`supabase/seed.sql`](supabase/seed.sql) sobre una base vacía: tablas, RLS,
   triggers, buckets de Storage, esquemas de vacunación, configuración placeholder
   de la clínica y sucursal principal. Studio queda en `http://127.0.0.1:54323`.

   - `supabase db reset` vuelve a crear la base desde cero (borra los datos locales).
   - `supabase stop` la detiene conservando los datos. Solo puede haber un stack
     local corriendo a la vez (DentdeLion usa los mismos puertos).

3. **Variables de entorno**

   Crea `.env.local` (ignorado por git; Next.js lo prioriza sobre `.env`) con los
   valores que imprime `supabase status`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY de supabase status>
   SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY de supabase status>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   Son claves de demostración del stack local, no secretos de producción.

4. **Crear el primer usuario (veterinario / dev)**

   No hay registro abierto. Para el usuario inicial:

   1. En Studio local: *Authentication → Users → Add user* (email + contraseña).
   2. En *SQL Editor*, inserta su fila en `usuarios` con el `id` de ese auth user:

      ```sql
      insert into usuarios (id, nombre, email, rol)
      values ('<auth-user-id>', 'Nombre Apellido', 'vet@ejemplo.com', 'dev');
      ```

   El trigger `sync_usuario_metadata` propaga el `rol` (y `sucursal_id`) al JWT.
   Si la sesión ya estaba abierta, cierra y vuelve a iniciar para refrescar el token.

5. **Levantar el servidor de desarrollo**

   ```bash
   npm run dev
   ```

   La app queda en `http://localhost:3000` (el service worker PWA está desactivado
   en desarrollo; se activa en el build de producción).

### Scripts

| Script | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (genera el service worker PWA) |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run test:rls` | Pruebas de RLS y aislamiento del portal contra Supabase local (requiere `supabase start`) |
| `npm run gen:icons` | Regenera los íconos PWA placeholder en `public/icons/` |

### Cambios de esquema

1. `supabase migration new <nombre>` crea el archivo en `supabase/migrations/`.
2. Escribe el SQL y pruébalo con `supabase db reset` + `npm run test:rls`.
3. El CI (`.github/workflows/ci.yml`) repite esas pruebas en cada PR a `main`.
4. Tras el merge, aplícalo a producción con `supabase db push` (proyecto vinculado
   con `supabase link`). Haz un respaldo antes.

> Los íconos de `public/icons/` son placeholders generados por script. Reemplázalos
> por el branding real de la clínica cuando esté disponible.

## Despliegue a producción

Recomendado: **Vercel** (Next.js) + un **proyecto Supabase separado** para producción.

1. **Supabase producción**
   - Crea un proyecto nuevo (distinto del de desarrollo).
   - `supabase link --project-ref <ref>` y `supabase db push` (migraciones); luego ejecuta `supabase/seed.sql` en el SQL Editor.
   - Habilita **Point-in-Time Recovery** (backups) en *Database → Backups*.
   - Crea el primer usuario staff (ver "Puesta en marcha", paso 4).
   - (Opcional) Habilita `pg_cron` si quieres el recálculo nocturno de vacunas.

2. **Vercel**
   - Importa el repositorio. Framework: Next.js (autodetectado).
   - Configura las **variables de entorno** (ver matriz abajo) apuntando al proyecto Supabase de producción.
   - El cron de recordatorios ya está declarado en [`vercel.json`](vercel.json) (`/api/cron/notificaciones`, diario 08:00). Vercel inyecta `CRON_SECRET` como `Authorization: Bearer` automáticamente, así que basta definir esa variable.

3. **Verificación post-deploy**
   - Lighthouse (móvil): PWA instalable y Performance aceptable.
   - Instalabilidad real: Android Chrome (banner/menu) e iOS Safari (*Compartir → Agregar a inicio*).
   - Prueba el flujo staff completo (búsqueda → consulta → receta → PDF) y el portal (invitación → login → descarga).

### Matriz de variables de entorno

| Variable | Dónde | Necesaria para |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | dev + prod | Todo |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dev + prod | Todo |
| `SUPABASE_SERVICE_ROLE_KEY` | server (secreta) | Invitaciones, portal (signed URLs), envíos, cron |
| `NEXT_PUBLIC_SITE_URL` | prod | Enlaces absolutos en emails/notificaciones |
| `RESEND_API_KEY` / `RESEND_FROM` | server | Email transaccional |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | cliente | Suscripción push |
| `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | server | Envío push |
| `CRON_SECRET` | server | Proteger el cron de recordatorios |

> Genera las claves VAPID con `npx web-push generate-vapid-keys`. El push real requiere HTTPS (producción), no funciona en `npm run dev` (el service worker está desactivado en desarrollo).

## Documentación

La planificación técnica completa —modelo de datos, RLS, flujos, fases de implementación y escalabilidad— está en [`docs/vetapp_arquitectura.md`](docs/vetapp_arquitectura.md).
