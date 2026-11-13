"use client";

// Selector del veterinario responsable (consulta, vacuna) o a cargo (documentos).
// `veterinarios` son los elegibles (getVeterinarios: rol 'veterinario' y activos).
// Cada formulario lo envuelve en su propio <label> para conservar su estilo.

export interface VeterinarioOpcion {
  id: string;
  nombre: string;
}

// Valor inicial: el usuario actual si es elegible; si no (p. ej. 'dev'), vacío
// para obligar a elegir.
export function veterinarioPorDefecto(
  veterinarios: VeterinarioOpcion[],
  usuarioId: string | null | undefined,
): string {
  return usuarioId && veterinarios.some((v) => v.id === usuarioId)
    ? usuarioId
    : "";
}

export function SelectorVeterinario({
  veterinarios,
  value,
  onChange,
  usuarioId,
  actual,
  required,
  className,
}: {
  veterinarios: VeterinarioOpcion[];
  value: string;
  onChange: (id: string) => void;
  // Usuario autenticado: se marca con "(tú)".
  usuarioId?: string | null;
  // Veterinario ya guardado que dejó de ser elegible (registros históricos):
  // se muestra para poder conservarlo.
  actual?: VeterinarioOpcion | null;
  required?: boolean;
  className?: string;
}) {
  const mostrarActual = actual && !veterinarios.some((v) => v.id === actual.id);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={className}
    >
      <option value="">Elegir veterinario…</option>
      {mostrarActual && (
        <option value={actual.id}>{actual.nombre} (no disponible)</option>
      )}
      {veterinarios.map((v) => (
        <option key={v.id} value={v.id}>
          {v.nombre}
          {v.id === usuarioId ? " (tú)" : ""}
        </option>
      ))}
    </select>
  );
}
