import { formatearPeso } from "@/lib/utils/format";

// Campos de una consulta o un control en el PDF del historial del staff, ya
// filtrados, formateados y en el orden del detalle de la consulta (diferencial
// antes que diagnóstico). Sin react-pdf, para testearlo aparte.

interface ConsultaCampos {
  consulta_origen_id: string | null;
  motivo: string;
  anamnesis: string | null;
  examen_fisico: string | null;
  diagnostico: string;
  diagnostico_diferencial: string | null;
  tratamiento: string;
  peso_kg: number | null;
  temperatura_c: number | null;
  notas: string | null;
  evolucion: string | null;
}

export interface OpcionesCampos {
  incluirAnamnesis: boolean;
  incluirSignosVitales: boolean;
  incluirNotasInternas: boolean;
}

export interface CampoHistorial {
  label: string;
  valor: string;
  // Notas internas: se imprimen en un tono más suave.
  tenue?: boolean;
}

const texto = (v: string | null | undefined) => (v ?? "").trim();

// `origen`: la consulta de origen de un control cuando está en el mismo
// documento; motivo y diagnósticos iguales a los suyos no se repiten.
export function camposConsultaHistorial(
  c: ConsultaCampos,
  opciones: OpcionesCampos,
  origen: ConsultaCampos | null = null,
): CampoHistorial[] {
  const campos: CampoHistorial[] = [];
  const agregar = (label: string, v: string | null | undefined, tenue = false) => {
    const valor = texto(v);
    if (valor) campos.push(tenue ? { label, valor, tenue } : { label, valor });
  };
  const siCambio = (label: string, campo: "motivo" | "diagnostico" | "diagnostico_diferencial") => {
    if (origen && texto(c[campo]) === texto(origen[campo])) return;
    agregar(label, c[campo]);
  };

  if (c.consulta_origen_id) agregar("Evolución", c.evolucion);
  siCambio("Motivo", "motivo");
  if (opciones.incluirAnamnesis) {
    agregar("Anamnesis", c.anamnesis);
    agregar("Examen físico", c.examen_fisico);
  }
  if (opciones.incluirSignosVitales) {
    if (c.peso_kg != null) agregar("Peso", formatearPeso(c.peso_kg));
    if (c.temperatura_c != null) agregar("Temperatura", `${c.temperatura_c} °C`);
  }
  siCambio("Diagnóstico diferencial", "diagnostico_diferencial");
  siCambio("Diagnóstico", "diagnostico");
  agregar("Tratamiento", c.tratamiento);
  if (opciones.incluirNotasInternas) agregar("Notas", c.notas, true);
  return campos;
}
