import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { ClinicaConfig } from "@/lib/types/db";
import { Header } from "./documents";

// Tipos de autorización que produce este documento (el microchip va por otro
// pipeline, con overlay sobre el formulario oficial).
export type TipoAutorizacion = "eutanasia" | "cirugia" | "hospitalizacion";

// Datos que llenan la plantilla. Lo que la app conoce se precarga en el
// formulario; el resto (sector, comuna, campos del caso) se ingresa a mano.
export interface AutorizacionData {
  tipo: TipoAutorizacion;
  // Datos completos de la clínica para pintar el encabezado (logo, dirección,
  // registro). El nombre editado en el panel se refleja en `nombre_clinica`.
  clinica: ClinicaConfig | null;
  // Dueño / autorizante
  duenoNombre: string;
  domicilio: string;
  sector: string;
  comuna: string;
  telefono: string;
  duenoRut: string;
  // Mascota
  mascotaNombre: string;
  especie: string;
  sexo: string;
  fechaNacimiento: string;
  raza: string;
  // Caso (común)
  antecedentes: string;
  medicoACargo: string;
  // Campos por tipo
  extra: { label: string; value: string }[];
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#111827",
    lineHeight: 1.5,
  },
  title: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 14,
  },
  p: { marginBottom: 8, textAlign: "justify" },
  bold: { fontFamily: "Helvetica-Bold" },
  field: { marginBottom: 4 },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    marginVertical: 10,
  },
  firmaLabel: { marginTop: 28, marginBottom: 2 },
  firmaLinea: {
    borderTopWidth: 1,
    borderTopColor: "#111827",
    width: 240,
    marginTop: 28,
  },
  firmaTexto: { fontSize: 10, marginTop: 2 },
});

const CONFIG: Record<
  TipoAutorizacion,
  { titulo: string; accion: string; parrafo1: (c: string) => string; parrafo2: (c: string) => string }
> = {
  eutanasia: {
    titulo: "Autorización para la Realización de Eutanasia",
    accion: "realice procedimientos eutanásicos",
    parrafo1: (c) =>
      `El dueño del animal más arriba indicado declara conocer de antemano la idoneidad del/los Médicos Veterinarios de Veterinaria ${c}, para realizar los procedimientos eutanásicos, y esta autorización implica reconocer la necesidad de realizarlos y, por lo tanto, libera a Veterinaria ${c} absteniéndose de realizar acciones de cualquier tipo en contra de ésta o los profesionales que en ella ejercen, entendiéndose que la responsabilidad recae en quien autoriza.`,
    parrafo2: (c) =>
      `Sin perjuicio de lo anterior, Veterinaria ${c} y los profesionales que en ella laboran, mantendrán en todo momento una actitud de colaboración, e intentarán en todos los casos realizar procedimientos con todo el equipamiento y en la mejores condiciones que sea posible, de acuerdo a los costos cubiertos por el dueño, caso contrario se derivará el caso a quién se estime posee mejores medios técnicos, siendo los costos económicos que ello implique de la responsabilidad del dueño del animal.`,
  },
  cirugia: {
    titulo: "Autorización para la Realización de Cirugía",
    accion: "realice procedimientos anestésico-quirúrgicos",
    parrafo1: (c) =>
      `El dueño del animal más arriba indicado declara conocer de antemano la idoneidad del/los Médicos Veterinarios de Veterinaria ${c}, para realizar los procedimientos anestésico-quirúrgicos, y esta autorización implica conocer los riesgos que conllevan estas acciones no importando su calidad de estéticas, correctivas o terapéuticas y, por lo tanto, libera a Veterinaria ${c} en caso que el resultado de éstas sea insatisfactorio o fatal, absteniéndose de realizar acciones de cualquier tipo en contra de Veterinaria ${c} o los profesionales que en ella ejercen, entendiéndose que la responsabilidad recae en quien autoriza.`,
    parrafo2: (c) =>
      `Sin perjuicio de lo anterior, Veterinaria ${c} y los profesionales que en ella laboran, mantendrán en todo momento una actitud de colaboración, e intentarán en todos los casos realizar procedimientos con todo el equipamiento y en la mejores condiciones que sea posible, de acuerdo a los costos cubiertos por el dueño, caso contrario se derivará el caso a quién se estime posee mejores medios anestésico-quirúrgicos, siendo los costos económicos que ello implique de la responsabilidad del dueño del animal.`,
  },
  hospitalizacion: {
    titulo: "Autorización para la Hospitalización",
    accion:
      "mantenga hospitalizado y realice los procedimientos de observación, tratamiento y cuidados que sean necesarios",
    parrafo1: (c) =>
      `El dueño del animal más arriba indicado declara conocer de antemano la idoneidad del/los Médicos Veterinarios de Veterinaria ${c}, para mantener hospitalizado al animal y realizar los procedimientos que su condición requiera, y esta autorización implica conocer los riesgos inherentes a la hospitalización, la evolución de la enfermedad y los tratamientos aplicados, no importando su resultado y, por lo tanto, libera a Veterinaria ${c} en caso que el resultado de éstos sea insatisfactorio o fatal, absteniéndose de realizar acciones de cualquier tipo en contra de Veterinaria ${c} o los profesionales que en ella ejercen, entendiéndose que la responsabilidad recae en quien autoriza.`,
    parrafo2: (c) =>
      `Sin perjuicio de lo anterior, Veterinaria ${c} y los profesionales que en ella laboran, mantendrán en todo momento una actitud de colaboración, e intentarán en todos los casos realizar los cuidados y procedimientos con todo el equipamiento y en la mejores condiciones que sea posible, de acuerdo a los costos cubiertos por el dueño, caso contrario se derivará el caso a quién se estime posee mejores medios técnicos, siendo los costos económicos que ello implique de la responsabilidad del dueño del animal.`,
  },
};

function dato(v: string): string {
  return v && v.trim() ? v : "________";
}

export function AutorizacionDoc({ data }: { data: AutorizacionData }) {
  const cfg = CONFIG[data.tipo];
  const c = data.clinica?.nombre_clinica || "________";
  return (
    <Document title={cfg.titulo}>
      <Page size="A4" style={styles.page}>
        <Header clinica={data.clinica} />
        <Text style={styles.title}>{cfg.titulo}</Text>

        <Text style={styles.p}>
          El (la) Señor (a)(ita) <Text style={styles.bold}>{dato(data.duenoNombre)}</Text>{" "}
          Domiciliado en: {dato(data.domicilio)} Sector: {dato(data.sector)}{" "}
          Comuna: {dato(data.comuna)} Teléfono: {dato(data.telefono)}
        </Text>
        <Text style={styles.p}>
          Autoriza a Veterinaria <Text style={styles.bold}>{c}</Text>, para que a
          través del personal profesional y técnico a cargo {cfg.accion} en el
          animal de su propiedad identificado como:
        </Text>
        <Text style={styles.p}>
          Nombre: <Text style={styles.bold}>{dato(data.mascotaNombre)}</Text>{" "}
          Especie: {dato(data.especie)} Sexo: {dato(data.sexo)} Fecha de
          Nacimiento: {dato(data.fechaNacimiento)} Raza: {dato(data.raza)}
        </Text>

        <Text style={styles.field}>
          Antecedentes del caso: {dato(data.antecedentes)}
        </Text>
        {data.extra.map((e, i) => (
          <Text key={i} style={styles.field}>
            - {e.label}: {dato(e.value)}
          </Text>
        ))}
        <Text style={styles.field}>
          - Médico Veterinario a Cargo: {dato(data.medicoACargo)}
        </Text>

        <View style={styles.hr} />

        <Text style={styles.p}>{cfg.parrafo1(c)}</Text>
        <Text style={styles.p}>{cfg.parrafo2(c)}</Text>

        <Text style={styles.firmaLabel}>Autoriza:</Text>
        <View style={styles.firmaLinea} />
        <Text style={styles.firmaTexto}>{dato(data.duenoNombre)}</Text>
        <Text style={styles.firmaTexto}>
          N° RUT: {dato(data.duenoRut)}
        </Text>
      </Page>
    </Document>
  );
}

// Campos del caso que aporta cada tipo (los que en la plantilla van como
// viñetas específicas). El formulario los pide; se pasan en `extra`.
export const CAMPOS_EXTRA: Record<TipoAutorizacion, string[]> = {
  eutanasia: [],
  cirugia: [
    "Necesidad de Cirugía y/o Anestesia",
    "Condición Previa del Animal",
    "Calificación de Riesgo Cirugía-Anestesia",
  ],
  hospitalizacion: [
    "Motivo de Hospitalización",
    "Diagnóstico Presuntivo",
    "Tratamiento / Procedimientos Propuestos",
  ],
};
