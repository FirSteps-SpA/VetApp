import type { User } from "@supabase/supabase-js";

// Roles del sistema. `dev` y `veterinario` están activos en Fase I;
// `recepcionista` y `cliente` se incorporan en Fase II (RLS y rutas ya preparadas).
export type Rol = "dev" | "veterinario" | "recepcionista" | "cliente";

export const ROLES: readonly Rol[] = [
  "dev",
  "veterinario",
  "recepcionista",
  "cliente",
];

// El rol vive en `app_metadata` del JWT (no editable por el usuario).
export function getRol(user: User | null): Rol | null {
  const rol = user?.app_metadata?.rol;
  return typeof rol === "string" && (ROLES as string[]).includes(rol)
    ? (rol as Rol)
    : null;
}

// La sucursal activa también viaja en `app_metadata` (multi-sucursal anticipada).
export function getSucursalId(user: User | null): string | null {
  const id = user?.app_metadata?.sucursal_id;
  return typeof id === "string" ? id : null;
}

// Mapa de prefijos de ruta → roles permitidos. El primer prefijo que coincide manda.
const ROUTE_ROLES: { prefix: string; roles: Rol[] }[] = [
  { prefix: "/admin", roles: ["dev"] },
  { prefix: "/portal", roles: ["cliente"] },
  { prefix: "/dashboard", roles: ["dev", "veterinario", "recepcionista"] },
  { prefix: "/pacientes", roles: ["dev", "veterinario", "recepcionista"] },
  { prefix: "/agenda", roles: ["dev", "veterinario", "recepcionista"] },
  { prefix: "/vacunas", roles: ["dev", "veterinario"] },
];

// Rutas accesibles sin sesión.
export const PUBLIC_PREFIXES = ["/login", "/auth", "/unauthorized"];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// Devuelve true si el rol puede acceder a la ruta. Rutas no listadas requieren
// solo sesión válida (cualquier rol autenticado).
export function canAccess(pathname: string, rol: Rol | null): boolean {
  const match = ROUTE_ROLES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  if (!match) return true;
  return rol !== null && match.roles.includes(rol);
}

// Destino por defecto tras el login según el rol.
export function homeForRol(rol: Rol | null): string {
  return rol === "cliente" ? "/portal" : "/dashboard";
}
