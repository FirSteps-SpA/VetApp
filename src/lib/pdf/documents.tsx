import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

import {
  labelEspecie,
  labelTipoConsulta,
  resumenMedicamento,
  type ClinicaConfig,
  type ConsultaConVet,
  type DuenoDePaciente,
  type Dueno,
  type Especie,
  type Examen,
  type Paciente,
  type Receta,
  type Vacuna,
} from "@/lib/types/db";
import type {
  ConsultaPortal,
  ExamenPortal,
  MascotaPortal,
  RecetaPortal,
  VacunaPortal,
} from "@/lib/data/portal";
import { calcularEdad, formatearFecha, formatearPeso } from "@/lib/utils/format";

const TEAL = "#0d9488";
const SLATE = "#475569";
const LIGHT = "#94a3b8";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
    marginBottom: 12,
  },
  logo: { width: 80, height: 40, objectFit: "contain" },
  clinicName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: TEAL },
  clinicMeta: { fontSize: 8, color: SLATE },
  docTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  docMeta: { fontSize: 9, color: LIGHT, marginBottom: 12 },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: LIGHT,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  row: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "33%", marginBottom: 4 },
  cellLabel: { fontSize: 7, color: LIGHT },
  cellValue: { fontSize: 10 },
  bold: { fontFamily: "Helvetica-Bold" },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 8, color: LIGHT },
  med: {
    borderLeftWidth: 2,
    borderLeftColor: "#99f6e4",
    paddingLeft: 6,
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: LIGHT,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 4,
  },
});

function Header({ clinica }: { clinica: ClinicaConfig | null }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.clinicName}>
          {clinica?.nombre_clinica ?? "Clínica Veterinaria"}
        </Text>
        {clinica?.direccion ? (
          <Text style={styles.clinicMeta}>
            {clinica.direccion}
            {clinica.ciudad ? `, ${clinica.ciudad}` : ""}
          </Text>
        ) : null}
        <Text style={styles.clinicMeta}>
          {[clinica?.telefono, clinica?.email].filter(Boolean).join(" · ")}
        </Text>
        {clinica?.numero_registro ? (
          <Text style={styles.clinicMeta}>
            Reg.: {clinica.numero_registro}
          </Text>
        ) : null}
      </View>
      {clinica?.logo_url ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={clinica.logo_url} style={styles.logo} />
      ) : null}
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>Generado el {formatearFecha(new Date().toISOString())}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

function PacienteInfo({
  paciente,
  dueno,
}: {
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
}) {
  const edad = calcularEdad(paciente.fecha_nacimiento);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Paciente</Text>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Nombre</Text>
          <Text style={[styles.cellValue, styles.bold]}>{paciente.nombre}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>N° Ficha</Text>
          <Text style={styles.cellValue}>{paciente.numero_ficha}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Especie / Raza</Text>
          <Text style={styles.cellValue}>
            {labelEspecie(paciente.especie)}
            {paciente.raza ? ` · ${paciente.raza}` : ""}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Edad</Text>
          <Text style={styles.cellValue}>{edad ?? "—"}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Sexo</Text>
          <Text style={styles.cellValue}>{paciente.sexo ?? "—"}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Peso</Text>
          <Text style={styles.cellValue}>{formatearPeso(paciente.peso_kg)}</Text>
        </View>
      </View>
      {dueno ? (
        <View style={{ marginTop: 4 }}>
          <Text style={styles.cellLabel}>Dueño</Text>
          <Text style={styles.cellValue}>
            {dueno.nombre} · {dueno.telefono}
            {dueno.email ? ` · ${dueno.email}` : ""}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Firma({ veterinario }: { veterinario?: string | null }) {
  return (
    <View style={{ marginTop: 40, width: 200 }}>
      <View style={{ borderTopWidth: 1, borderTopColor: "#94a3b8" }} />
      <Text style={{ fontSize: 8, color: SLATE, marginTop: 2 }}>
        {veterinario ?? "Médico veterinario"}
      </Text>
    </View>
  );
}

// --------------------------------------------------------------------------
// Receta individual
// --------------------------------------------------------------------------
export function RecetaDoc({
  clinica,
  paciente,
  dueno,
  receta,
  veterinario,
}: {
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
  receta: Receta;
  veterinario?: string | null;
}) {
  return (
    <Document title={`Receta ${receta.numero_receta}`}>
      <Page size="A4" style={styles.page}>
        <Header clinica={clinica} />
        <Text style={styles.docTitle}>Receta médica</Text>
        <Text style={styles.docMeta}>
          {receta.numero_receta} · {formatearFecha(receta.fecha)}
          {!receta.vigente ? " · ANULADA" : ""}
        </Text>

        <PacienteInfo paciente={paciente} dueno={dueno} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicaciones</Text>
          {receta.medicamentos.map((m, i) => (
            <View key={i} style={styles.med}>
              <Text style={styles.bold}>
                {m.nombre}
                {m.presentacion ? ` · ${m.presentacion}` : ""}
              </Text>
              <Text>{resumenMedicamento(m)}</Text>
              {m.duracion ? <Text>Duración: {m.duracion}</Text> : null}
              {m.instrucciones ? <Text>{m.instrucciones}</Text> : null}
            </View>
          ))}
          {receta.instrucciones_generales ? (
            <Text style={{ marginTop: 6 }}>
              {receta.instrucciones_generales}
            </Text>
          ) : null}
        </View>

        <Firma veterinario={veterinario} />
        <Footer />
      </Page>
    </Document>
  );
}

// --------------------------------------------------------------------------
// Historial clínico completo
// --------------------------------------------------------------------------
export interface OpcionesHistorial {
  incluirRecetas: boolean;
  incluirExamenes: boolean;
  incluirVacunas: boolean;
  incluirNotasInternas: boolean;
}

export function HistorialDoc({
  clinica,
  paciente,
  dueno,
  consultas,
  recetas,
  examenes,
  vacunas,
  opciones,
}: {
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
  consultas: ConsultaConVet[];
  recetas: Receta[];
  examenes: Examen[];
  vacunas: Vacuna[];
  opciones: OpcionesHistorial;
}) {
  const recetasPorConsulta = (consultaId: string) =>
    recetas.filter((r) => r.consulta_id === consultaId);

  return (
    <Document title={`Historial ${paciente.nombre}`}>
      <Page size="A4" style={styles.page}>
        <Header clinica={clinica} />
        <Text style={styles.docTitle}>Historial clínico</Text>
        <Text style={styles.docMeta}>{paciente.nombre}</Text>

        <PacienteInfo paciente={paciente} dueno={dueno} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Consultas ({consultas.length})
          </Text>
          {consultas.length === 0 ? (
            <Text style={{ color: LIGHT }}>Sin consultas en el período.</Text>
          ) : (
            consultas.map((c) => (
              <View key={c.id} style={styles.card} wrap={false}>
                <View style={styles.cardHead}>
                  <Text style={styles.bold}>
                    {formatearFecha(c.fecha)} · {labelTipoConsulta(c.tipo)}
                  </Text>
                  <Text style={styles.label}>{c.veterinario?.nombre ?? ""}</Text>
                </View>
                <Text>Motivo: {c.motivo}</Text>
                <Text>Diagnóstico: {c.diagnostico}</Text>
                <Text>Tratamiento: {c.tratamiento}</Text>
                {opciones.incluirNotasInternas && c.notas ? (
                  <Text style={{ color: SLATE }}>Notas: {c.notas}</Text>
                ) : null}
                {opciones.incluirRecetas &&
                  recetasPorConsulta(c.id).map((r) => (
                    <View key={r.id} style={{ marginTop: 3 }}>
                      <Text style={styles.label}>
                        {r.numero_receta}
                        {!r.vigente ? " (anulada)" : ""}
                      </Text>
                      {r.medicamentos.map((m, i) => (
                        <Text key={i}>· {resumenMedicamento(m)}</Text>
                      ))}
                    </View>
                  ))}
              </View>
            ))
          )}
        </View>

        {opciones.incluirExamenes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exámenes ({examenes.length})</Text>
            {examenes.length === 0 ? (
              <Text style={{ color: LIGHT }}>Sin exámenes.</Text>
            ) : (
              examenes.map((e) => (
                <Text key={e.id}>
                  {formatearFecha(e.fecha)} · {e.tipo} · {e.nombre}
                  {e.descripcion ? ` — ${e.descripcion}` : ""}
                </Text>
              ))
            )}
          </View>
        ) : null}

        {opciones.incluirVacunas ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vacunas ({vacunas.length})</Text>
            {vacunas.length === 0 ? (
              <Text style={{ color: LIGHT }}>Sin vacunas registradas.</Text>
            ) : (
              vacunas.map((v) => (
                <Text key={v.id}>
                  {formatearFecha(v.fecha_aplicacion)} · {v.nombre_vacuna}
                  {v.proxima_dosis
                    ? ` · próxima: ${formatearFecha(v.proxima_dosis)}`
                    : ""}
                </Text>
              ))
            )}
          </View>
        ) : null}

        <Footer />
      </Page>
    </Document>
  );
}

// --------------------------------------------------------------------------
// Carta de derivación
// --------------------------------------------------------------------------
export function DerivacionDoc({
  clinica,
  paciente,
  dueno,
  consultas,
  examenes,
  motivo,
  destino,
  veterinario,
}: {
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
  consultas: ConsultaConVet[];
  examenes: Examen[];
  motivo: string;
  destino: string;
  veterinario?: string | null;
}) {
  return (
    <Document title={`Derivación ${paciente.nombre}`}>
      <Page size="A4" style={styles.page}>
        <Header clinica={clinica} />
        <Text style={styles.docTitle}>Carta de derivación</Text>
        <Text style={styles.docMeta}>
          {formatearFecha(new Date().toISOString())}
        </Text>

        {destino ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dirigido a</Text>
            <Text>{destino}</Text>
          </View>
        ) : null}

        <PacienteInfo paciente={paciente} dueno={dueno} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motivo de derivación</Text>
          <Text>{motivo || "—"}</Text>
        </View>

        {consultas.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Antecedentes</Text>
            {consultas.map((c) => (
              <View key={c.id} style={styles.card} wrap={false}>
                <Text style={styles.bold}>
                  {formatearFecha(c.fecha)} · {labelTipoConsulta(c.tipo)}
                </Text>
                <Text>Diagnóstico: {c.diagnostico}</Text>
                <Text>Tratamiento: {c.tratamiento}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {examenes.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exámenes relevantes</Text>
            {examenes.map((e) => (
              <Text key={e.id}>
                {formatearFecha(e.fecha)} · {e.tipo} · {e.nombre}
              </Text>
            ))}
          </View>
        ) : null}

        <Firma veterinario={veterinario} />
        <Footer />
      </Page>
    </Document>
  );
}

// --------------------------------------------------------------------------
// Documentos versión CLIENTE (portal) — sin campos internos
// --------------------------------------------------------------------------
function MascotaInfo({
  mascota,
  dueno,
}: {
  mascota: MascotaPortal;
  dueno: Dueno | null;
}) {
  const edad = calcularEdad(mascota.fecha_nacimiento);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mascota</Text>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Nombre</Text>
          <Text style={[styles.cellValue, styles.bold]}>{mascota.nombre}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>N° Ficha</Text>
          <Text style={styles.cellValue}>{mascota.numero_ficha}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Especie / Raza</Text>
          <Text style={styles.cellValue}>
            {labelEspecie(mascota.especie as Especie)}
            {mascota.raza ? ` · ${mascota.raza}` : ""}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Edad</Text>
          <Text style={styles.cellValue}>{edad ?? "—"}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Peso</Text>
          <Text style={styles.cellValue}>{formatearPeso(mascota.peso_kg)}</Text>
        </View>
      </View>
      {dueno ? (
        <View style={{ marginTop: 4 }}>
          <Text style={styles.cellLabel}>Dueño</Text>
          <Text style={styles.cellValue}>
            {dueno.nombre} · {dueno.telefono}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function RecetaClienteDoc({
  clinica,
  mascota,
  dueno,
  receta,
}: {
  clinica: ClinicaConfig | null;
  mascota: MascotaPortal;
  dueno: Dueno | null;
  receta: RecetaPortal;
}) {
  return (
    <Document title={`Receta ${receta.numero_receta}`}>
      <Page size="A4" style={styles.page}>
        <Header clinica={clinica} />
        <Text style={styles.docTitle}>Receta médica</Text>
        <Text style={styles.docMeta}>
          {receta.numero_receta} · {formatearFecha(receta.fecha)}
        </Text>
        <MascotaInfo mascota={mascota} dueno={dueno} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicaciones</Text>
          {receta.medicamentos.map((m, i) => (
            <View key={i} style={styles.med}>
              <Text style={styles.bold}>
                {m.nombre}
                {m.presentacion ? ` · ${m.presentacion}` : ""}
              </Text>
              <Text>{resumenMedicamento(m)}</Text>
              {m.duracion ? <Text>Duración: {m.duracion}</Text> : null}
              {m.instrucciones ? <Text>{m.instrucciones}</Text> : null}
            </View>
          ))}
          {receta.instrucciones_generales ? (
            <Text style={{ marginTop: 6 }}>{receta.instrucciones_generales}</Text>
          ) : null}
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

export function HistorialClienteDoc({
  clinica,
  mascota,
  dueno,
  consultas,
  recetas,
  examenes,
  vacunas,
}: {
  clinica: ClinicaConfig | null;
  mascota: MascotaPortal;
  dueno: Dueno | null;
  consultas: ConsultaPortal[];
  recetas: RecetaPortal[];
  examenes: ExamenPortal[];
  vacunas: VacunaPortal[];
}) {
  return (
    <Document title={`Historial ${mascota.nombre}`}>
      <Page size="A4" style={styles.page}>
        <Header clinica={clinica} />
        <Text style={styles.docTitle}>Historial de {mascota.nombre}</Text>
        <MascotaInfo mascota={mascota} dueno={dueno} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consultas ({consultas.length})</Text>
          {consultas.length === 0 ? (
            <Text style={{ color: LIGHT }}>Sin consultas.</Text>
          ) : (
            consultas.map((c) => (
              <View key={c.id} style={styles.card} wrap={false}>
                <Text style={styles.bold}>
                  {formatearFecha(c.fecha)} · {labelTipoConsulta(c.tipo)}
                </Text>
                <Text>Diagnóstico: {c.diagnostico}</Text>
                <Text>Tratamiento: {c.tratamiento}</Text>
              </View>
            ))
          )}
        </View>

        {recetas.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recetas vigentes</Text>
            {recetas.map((r) => (
              <View key={r.id} style={{ marginBottom: 4 }}>
                <Text style={styles.bold}>{r.numero_receta}</Text>
                {r.medicamentos.map((m, i) => (
                  <Text key={i}>· {resumenMedicamento(m)}</Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {examenes.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exámenes</Text>
            {examenes.map((e) => (
              <Text key={e.id}>
                {formatearFecha(e.fecha)} · {e.tipo} · {e.nombre}
              </Text>
            ))}
          </View>
        ) : null}

        {vacunas.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vacunas</Text>
            {vacunas.map((v) => (
              <Text key={v.id}>
                {formatearFecha(v.fecha_aplicacion)} · {v.nombre_vacuna}
                {v.proxima_dosis
                  ? ` · próxima: ${formatearFecha(v.proxima_dosis)}`
                  : ""}
              </Text>
            ))}
          </View>
        ) : null}

        <Footer />
      </Page>
    </Document>
  );
}

// --------------------------------------------------------------------------
// Ficha de vacunación
// --------------------------------------------------------------------------
export function VacunacionDoc({
  clinica,
  paciente,
  dueno,
  vacunas,
}: {
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
  vacunas: Vacuna[];
}) {
  return (
    <Document title={`Vacunación ${paciente.nombre}`}>
      <Page size="A4" style={styles.page}>
        <Header clinica={clinica} />
        <Text style={styles.docTitle}>Ficha de vacunación</Text>
        <Text style={styles.docMeta}>{paciente.nombre}</Text>

        <PacienteInfo paciente={paciente} dueno={dueno} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Vacunas aplicadas ({vacunas.length})
          </Text>
          {vacunas.length === 0 ? (
            <Text style={{ color: LIGHT }}>Sin vacunas registradas.</Text>
          ) : (
            vacunas.map((v) => (
              <View key={v.id} style={styles.card} wrap={false}>
                <Text style={styles.bold}>{v.nombre_vacuna}</Text>
                <Text>Aplicación: {formatearFecha(v.fecha_aplicacion)}</Text>
                {v.proxima_dosis ? (
                  <Text>Próxima dosis: {formatearFecha(v.proxima_dosis)}</Text>
                ) : null}
                {[v.laboratorio, v.lote ? `Lote ${v.lote}` : null]
                  .filter(Boolean)
                  .length > 0 ? (
                  <Text style={styles.label}>
                    {[v.laboratorio, v.lote ? `Lote ${v.lote}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
