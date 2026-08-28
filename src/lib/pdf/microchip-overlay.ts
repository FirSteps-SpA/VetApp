import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Certificado oficial servido como asset (612 x 396 pt, origen abajo-izquierda).
const TEMPLATE_URL = "/certs/microchip.pdf";

export interface MicrochipData {
  // Animal
  nombre: string;
  especie: "perro" | "gato" | "";
  sexo: "macho" | "hembra" | "";
  raza: string;
  esterilizado: "si" | "no" | "";
  color: string;
  fechaNacimiento: string; // DD/MM/AAAA
  tipoProcedimiento: "implantacion" | "verificacion" | "";
  modoObtencion:
    | "recogido"
    | "reubicacion"
    | "regalo"
    | "nacido"
    | "compra"
    | "";
  razonTenencia:
    | "compania"
    | "asistencia"
    | "terapia"
    | "trabajo"
    | "seguridad"
    | "deporte"
    | "exposicion"
    | "reproduccion"
    | "caza"
    | "";
  // Veterinario
  vetNombres: string;
  vetApellidos: string;
  vetRut: string;
  tipoProfesional: "medico" | "tecnico" | "";
  comuna: string;
  fechaProcedimiento: string;
}

type XY = { x: number; y: number };

// -------------------------------------------------------------------------
// Mapa de coordenadas sobre el formulario oficial (612 x 396 pt, origen abajo-
// izquierda). Calibrado visualmente sobre el PDF real. Si el formato oficial
// cambia, reajustar estos valores es el único punto a tocar.
// -------------------------------------------------------------------------
const TEXTOS: Record<string, XY> = {
  nombre: { x: 105, y: 264 },
  raza: { x: 300, y: 250 },
  color: { x: 300, y: 235 },
  fechaNacimiento: { x: 200, y: 223 },
  vetNombres: { x: 110, y: 133 },
  vetApellidos: { x: 320, y: 133 },
  vetRut: { x: 110, y: 119 },
  comuna: { x: 110, y: 105 },
  fechaProcedimiento: { x: 310, y: 105 },
};

// Ajuste fino común a TODAS las marcas: desplaza la X para centrarla en el
// círculo ○. Tocar solo esto para reencuadrar todas las casillas de una.
const CHECK_OFFSET: XY = { x: 3, y: 2 };

// Cada grupo mapea el valor seleccionado a la coordenada de su casilla (la X
// se dibuja sobre el círculo ○ del formulario).
const CHECKS: Record<string, Record<string, XY>> = {
  especie: { perro: { x: 307, y: 260 }, gato: { x: 350, y: 260 } },
  sexo: { macho: { x: 84, y: 246 }, hembra: { x: 132, y: 246 } },
  esterilizado: { si: { x: 114, y: 233 }, no: { x: 141, y: 233 } },
  tipoProcedimiento: {
    implantacion: { x: 408, y: 219 },
    verificacion: { x: 485, y: 219 },
  },
  modoObtencion: {
    recogido: { x: 144, y: 205 },
    reubicacion: { x: 200, y: 205 },
    regalo: { x: 264, y: 205 },
    nacido: { x: 310, y: 205 },
    compra: { x: 386, y: 205 },
  },
  razonTenencia: {
    compania: { x: 128, y: 181 },
    asistencia: { x: 180, y: 181 },
    terapia: { x: 243, y: 181 },
    trabajo: { x: 288, y: 181 },
    seguridad: { x: 336, y: 181 },
    deporte: { x: 395, y: 181 },
    exposicion: { x: 449, y: 181 },
    reproduccion: { x: 128, y: 168 },
    caza: { x: 199, y: 168 },
  },
  tipoProfesional: {
    medico: { x: 207, y: 116 },
    tecnico: { x: 307, y: 116 },
  },
};

export async function generarCertificadoMicrochip(
  data: MicrochipData,
): Promise<Blob> {
  const bytes = await fetch(TEMPLATE_URL).then((r) => {
    if (!r.ok) throw new Error("No se pudo cargar el certificado oficial.");
    return r.arrayBuffer();
  });

  const doc = await PDFDocument.load(bytes);
  const page = doc.getPages()[0];
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const size = 9;
  const black = rgb(0.05, 0.05, 0.05);

  const text = (t: string, at: XY) =>
    page.drawText(t, { x: at.x, y: at.y, size, font, color: black });
  const mark = (at: XY) =>
    page.drawText("X", {
      x: at.x + CHECK_OFFSET.x,
      y: at.y + CHECK_OFFSET.y,
      size: 10,
      font,
      color: black,
    });

  // Textos.
  const textMap: [keyof MicrochipData, XY][] = [
    ["nombre", TEXTOS.nombre],
    ["raza", TEXTOS.raza],
    ["color", TEXTOS.color],
    ["fechaNacimiento", TEXTOS.fechaNacimiento],
    ["vetNombres", TEXTOS.vetNombres],
    ["vetApellidos", TEXTOS.vetApellidos],
    ["vetRut", TEXTOS.vetRut],
    ["comuna", TEXTOS.comuna],
    ["fechaProcedimiento", TEXTOS.fechaProcedimiento],
  ];
  for (const [key, at] of textMap) {
    const val = data[key];
    if (typeof val === "string" && val.trim()) text(val, at);
  }

  // Casillas.
  const checkMap: [keyof MicrochipData, string][] = [
    ["especie", "especie"],
    ["sexo", "sexo"],
    ["esterilizado", "esterilizado"],
    ["tipoProcedimiento", "tipoProcedimiento"],
    ["modoObtencion", "modoObtencion"],
    ["razonTenencia", "razonTenencia"],
    ["tipoProfesional", "tipoProfesional"],
  ];
  for (const [key, grupo] of checkMap) {
    const val = data[key] as string;
    const at = val ? CHECKS[grupo]?.[val] : undefined;
    if (at) mark(at);
  }

  const out = await doc.save();
  return new Blob([out as BlobPart], { type: "application/pdf" });
}
