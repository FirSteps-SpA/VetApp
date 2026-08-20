// Interpreta un error de Postgres para distinguir qué restricción única falló.
// El mensaje de un 23505 nombra el índice, p. ej.:
//   'duplicate key value violates unique constraint "duenos_rut_normalizado_key"'
export function tipoConflictoUnico(
  error: { code?: string; message?: string } | null,
): "rut" | "email" | "otro" | null {
  if (!error) return null;
  if (error.code !== "23505") return "otro";
  const msg = error.message ?? "";
  if (msg.includes("rut_normalizado")) return "rut";
  if (msg.includes("email")) return "email";
  return "otro";
}
