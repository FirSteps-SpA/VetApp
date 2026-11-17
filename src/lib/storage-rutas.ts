// Rutas de Storage por clínica (spec 6): todo archivo vive bajo
// `<tenant_id>/...`, y las políticas de Storage solo permiten al staff leer y
// escribir en la carpeta de su clínica.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Tenant de la sesión, tal como viaja en el JWT (`app_metadata.tenant_id`).
export function tenantDeUsuario(
  user: { app_metadata?: Record<string, unknown> } | null | undefined,
): string | null {
  const id = user?.app_metadata?.tenant_id;
  return typeof id === "string" && UUID.test(id) ? id : null;
}

// Ruta dentro del bucket para un archivo de la clínica `tenantId`.
export function rutaEnTenant(tenantId: string, ...partes: string[]): string {
  if (!UUID.test(tenantId)) throw new Error("tenant inválido");
  return [tenantId, ...partes].join("/");
}

// ¿La ruta guardada pertenece a la clínica `tenantId`? Se usa antes de firmar
// URLs con service_role y antes de guardar una ruta que llega del cliente.
export function rutaEsDeTenant(ruta: string | null | undefined, tenantId: string): boolean {
  if (!ruta) return false;
  const [carpeta, ...resto] = ruta.split("/");
  return carpeta === tenantId && resto.length > 0 && !resto.includes("..");
}
