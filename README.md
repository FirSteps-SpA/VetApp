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

Requisitos: Node.js 18.17+ (recomendado 20+) y un proyecto Supabase.

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Variables de entorno**

   Copia `.env.example` a `.env.local` y completa los valores desde
   *Project Settings → API* en el dashboard de Supabase:

   ```bash
   cp .env.example .env.local
   ```

3. **Aplicar el esquema de base de datos**

   Las migraciones están en [`supabase/migrations/`](supabase/migrations) y el
   seed inicial en [`supabase/seed.sql`](supabase/seed.sql). Aplícalas en orden:

   - **Opción A — SQL Editor del dashboard:** pega y ejecuta, en orden numérico,
     todos los archivos de `supabase/migrations/` y luego `supabase/seed.sql`.
   - **Opción B — Supabase CLI:** `supabase db push` (aplica migraciones) y luego
     ejecuta el seed.

   Esto crea todas las tablas, índices, RLS, triggers, buckets de Storage, los
   esquemas de vacunación por defecto, la configuración placeholder de la clínica
   y la sucursal principal.

4. **Crear el primer usuario (veterinario / dev)**

   No hay registro abierto. Para el usuario inicial:

   1. *Authentication → Users → Add user* en el dashboard (email + contraseña).
   2. En el SQL Editor, inserta su fila en `usuarios` con el `id` de ese auth user:

      ```sql
      insert into usuarios (id, nombre, email, rol)
      values ('<auth-user-id>', 'Nombre Apellido', 'vet@ejemplo.com', 'veterinario');
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
| `npm run gen:icons` | Regenera los íconos PWA placeholder en `public/icons/` |

> Los íconos de `public/icons/` son placeholders generados por script. Reemplázalos
> por el branding real de la clínica cuando esté disponible.

## Documentación

La planificación técnica completa —modelo de datos, RLS, flujos, fases de implementación y escalabilidad— está en [`docs/vetapp_arquitectura.md`](docs/vetapp_arquitectura.md).
