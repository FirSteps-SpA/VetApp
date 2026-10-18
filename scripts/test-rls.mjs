// Pruebas de RLS / aislamiento del portal contra Supabase LOCAL (`supabase start`).
// Crea un veterinario y dos dueños (A y B) con datos propios y verifica, vía la
// API real (PostgREST/Storage) con la sesión de A, qué puede ver y modificar.
//
// Uso: `npm run test:rls` (requiere `supabase start`). Nunca apunta a producción:
// aborta si la URL no es 127.0.0.1/localhost. Cada ejecución usa emails nuevos,
// así que puede repetirse sin `supabase db reset`.

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

function localEnv() {
  if (process.env.API_URL && process.env.ANON_KEY && process.env.SERVICE_ROLE_KEY) {
    return process.env;
  }
  const out = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
  const env = {};
  for (const line of out.split("\n")) {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const { API_URL: API, ANON_KEY: ANON, SERVICE_ROLE_KEY: SVC } = localEnv();
if (!API || !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(API)) {
  console.error(`Abortado: API_URL no es local (${API}).`);
  process.exit(2);
}

async function http(method, path, { token, key = ANON, body, prefer } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token ?? key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}
  return { status: res.status, data };
}

// Inserta como service_role (bypassa RLS; los triggers sí corren).
async function insert(table, row) {
  const r = await http("POST", `/rest/v1/${table}`, {
    key: SVC,
    body: row,
    prefer: "return=representation",
  });
  if (r.status !== 201) throw new Error(`insert ${table}: ${r.status} ${JSON.stringify(r.data)}`);
  return r.data[0];
}

const run = randomUUID().slice(0, 8);
const PASSWORD = "Test-1234!";

async function crearUsuario(alias, rol) {
  const email = `${alias}-${run}@test.local`;
  const r = await http("POST", "/auth/v1/admin/users", {
    key: SVC,
    body: { email, password: PASSWORD, email_confirm: true },
  });
  if (r.status !== 200) throw new Error(`crear usuario ${alias}: ${r.status}`);
  await insert("usuarios", { id: r.data.id, nombre: alias, email, rol });
  return { id: r.data.id, email };
}

async function login(email) {
  const r = await http("POST", "/auth/v1/token?grant_type=password", {
    body: { email, password: PASSWORD },
  });
  if (r.status !== 200) throw new Error(`login ${email}: ${r.status}`);
  return r.data.access_token;
}

// --- Datos ---
const vet = await crearUsuario("vet", "veterinario");
const datos = {};
for (const k of ["A", "B"]) {
  const u = await crearUsuario(`dueno${k}`, "cliente");
  const dueno = await insert("duenos", {
    nombre: `Dueño ${k}`,
    telefono: "+56900000000",
    email: u.email,
    usuario_id: u.id,
  });
  const pac = await insert("pacientes", { nombre: `Mascota ${k} ${run}`, especie: "perro" });
  await insert("paciente_duenos", { paciente_id: pac.id, dueno_id: dueno.id, es_principal: true });
  await insert("consultas", {
    paciente_id: pac.id,
    veterinario_id: vet.id,
    motivo: "control",
    anamnesis: `ANAMNESIS-${k}`,
    notas: `NOTA-INTERNA-${k}`,
    diagnostico: "dx",
    tratamiento: "tx",
  });
  const hoy = new Date().toISOString().slice(0, 10);
  await insert("examenes", { paciente_id: pac.id, nombre: `visible ${k}`, tipo: "hemograma", fecha: hoy, interno: false });
  await insert("examenes", { paciente_id: pac.id, nombre: `interno ${k}`, tipo: "hemograma", fecha: hoy, interno: true });
  const cita = await insert("citas", {
    paciente_id: pac.id,
    dueno_id: dueno.id,
    veterinario_id: vet.id,
    fecha_hora: new Date(Date.now() + 2 * 86400_000).toISOString(),
    motivo: "control",
    estado: "pendiente",
  });
  datos[k] = { usuario: u, dueno: dueno.id, paciente: pac.id, cita: cita.id };
}

// --- Controles (sesión del dueño A) ---
const A = datos.A;
const B = datos.B;
const tA = await login(A.usuario.email);
const get = (path) => http("GET", `/rest/v1/${path}`, { token: tA });
const ids = (r) => (Array.isArray(r.data) ? r.data.map((x) => x.id) : r.data);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let fallas = 0;
function check(nombre, ok, detalle = "") {
  if (!ok) fallas++;
  console.log(`${ok ? "OK   " : "FALLA"} ${nombre}${detalle ? `  [${detalle}]` : ""}`);
}

// Lectura directa de tablas con columnas internas: el cliente no tiene acceso
// (auditoría #5); el portal usa las funciones portal_*.
for (const tabla of ["pacientes", "duenos", "consultas", "vacunas", "citas"]) {
  const t = await get(`${tabla}?select=*`);
  check(`A no lee ${tabla} directamente`, same(t.data, []), `${Array.isArray(t.data) ? t.data.length : t.status} filas`);
}

const rpc = (fn, args = {}) => http("POST", `/rest/v1/rpc/${fn}`, { token: tA, body: args });
let r = await rpc("portal_mascotas");
check("portal_mascotas: solo la mascota de A", same(ids(r), [A.paciente]), `${r.data.length} filas`);
check("portal_mascotas: sin notas internas", !("notas" in (r.data[0] ?? {})));
r = await rpc("portal_mi_dueno");
check("portal_mi_dueno: solo A, sin notas", same(ids(r), [A.dueno]) && !("notas" in (r.data[0] ?? {})));
r = await rpc("portal_consultas", { p_paciente: A.paciente });
const cols = Object.keys(r.data[0] ?? {}).sort();
check(
  "portal_consultas: solo columnas permitidas (#5)",
  r.data.length === 1 && same(cols, ["diagnostico", "fecha", "id", "tipo", "tratamiento"]),
  cols.join(","),
);
r = await rpc("portal_consultas", { p_paciente: B.paciente });
check("portal_consultas: nada de la mascota de B", same(r.data, []));
r = await rpc("portal_vacunas", { p_paciente: B.paciente });
check("portal_vacunas: nada de la mascota de B", same(r.data, []));
r = await rpc("portal_citas");
check("portal_citas: solo las citas de A", same(ids(r), [A.cita]), `${r.data.length} filas`);
r = await http("POST", "/rest/v1/rpc/portal_mascotas", { body: {} });
check("portal_* no ejecutable sin sesión", r.status === 401 || r.status === 404 || r.status === 403, `HTTP ${r.status}`);

r = await get("examenes?select=nombre");
check("A ve solo exámenes no internos de su mascota", same(r.data.map((x) => x.nombre), ["visible A"]));
r = await get("usuarios?select=id");
check("A ve solo su usuario", same(ids(r), [A.usuario.id]), `${r.data.length} filas`);
r = await get("audit_log?select=id");
check("A no lee audit_log", same(r.data, []));

r = await http("PATCH", `/rest/v1/usuarios?id=eq.${A.usuario.id}`, { token: tA, body: { rol: "dev" } });
check("A no puede cambiar su rol (auditoría #1)", r.status === 403, `HTTP ${r.status}`);
r = await http("PATCH", `/rest/v1/duenos?id=eq.${B.dueno}`, {
  token: tA,
  body: { email: "x@x.cl" },
  prefer: "return=representation",
});
check("A no edita el dueño de B", same(r.data, []), `HTTP ${r.status}`);
r = await http("POST", "/rest/v1/citas", {
  token: tA,
  body: {
    paciente_id: B.paciente,
    veterinario_id: vet.id,
    fecha_hora: "2030-01-01T13:00:00Z",
    motivo: "x",
    creado_por_cliente: true,
  },
});
check("A no crea citas para la mascota de B", r.status === 403, `HTTP ${r.status}`);
r = await http("PATCH", `/rest/v1/citas?id=eq.${B.cita}`, {
  token: tA,
  body: { estado: "cancelada" },
  prefer: "return=representation",
});
check("A no modifica citas de B", same(r.data, []), `HTTP ${r.status}`);
r = await http("POST", "/storage/v1/object/list/examenes", { token: tA, body: { prefix: "" } });
check("A no lista el bucket examenes", r.status >= 400 || same(r.data, []), `HTTP ${r.status}`);

// --- Escritura de citas por el cliente (auditoría #6) ---
r = await http("PATCH", `/rest/v1/citas?id=eq.${A.cita}`, {
  token: tA,
  body: { estado: "confirmada" },
  prefer: "return=representation",
});
const [citaA] = await http("GET", `/rest/v1/citas?select=estado&id=eq.${A.cita}`, { key: SVC }).then((x) => x.data);
check("A no confirma ni modifica su propia cita (#6)", citaA.estado === "pendiente", citaA.estado);
r = await http("POST", "/rest/v1/citas", {
  token: tA,
  body: {
    paciente_id: A.paciente,
    veterinario_id: vet.id,
    fecha_hora: "2030-01-01T13:00:00Z",
    motivo: "x",
    estado: "confirmada",
    creado_por_cliente: true,
  },
});
check("A no inserta citas directamente, ni de su mascota (#6)", r.status === 403, `HTTP ${r.status}`);

r = await http("POST", "/rest/v1/rpc/recalcular_alertas_vacunas", { token: tA, body: {} });
check("A no ejecuta recalcular_alertas_vacunas (solo el cron)", r.status === 403 || r.status === 404, `HTTP ${r.status}`);

// --- El cliente gestiona sus preferencias (política vía es_mi_dueno) ---
r = await http("POST", "/rest/v1/notificaciones_config?on_conflict=dueno_id", {
  token: tA,
  body: { dueno_id: A.dueno, recordatorio_citas: false },
  prefer: "resolution=merge-duplicates,return=representation",
});
check("A guarda sus preferencias de notificación", r.status === 201, `HTTP ${r.status}`);
r = await http("POST", "/rest/v1/notificaciones_config?on_conflict=dueno_id", {
  token: tA,
  body: { dueno_id: B.dueno, recordatorio_citas: false },
  prefer: "resolution=merge-duplicates,return=representation",
});
check("A no escribe preferencias de B", r.status === 403, `HTTP ${r.status}`);

// --- El staff conserva su acceso ---
const tV = await login(vet.email);
const getV = (path) => http("GET", `/rest/v1/${path}`, { token: tV });
r = await getV(`consultas?select=anamnesis&paciente_id=eq.${A.paciente}`);
check("veterinario lee consultas completas", r.data?.[0]?.anamnesis === "ANAMNESIS-A");
r = await getV(`pacientes?select=id&id=in.(${A.paciente},${B.paciente})`);
check("veterinario lee pacientes", r.data?.length === 2, `${r.data?.length} filas`);
r = await getV(`duenos?select=id&id=in.(${A.dueno},${B.dueno})`);
check("veterinario lee dueños", r.data?.length === 2, `${r.data?.length} filas`);
r = await http("PATCH", `/rest/v1/citas?id=eq.${B.cita}`, {
  token: tV,
  body: { estado: "confirmada" },
  prefer: "return=representation",
});
check("veterinario confirma citas", r.data?.[0]?.estado === "confirmada", `HTTP ${r.status}`);
const recep = await crearUsuario("recep", "recepcionista");
const tR = await login(recep.email);
r = await http("GET", `/rest/v1/citas?select=id&id=in.(${A.cita},${B.cita})`, { token: tR });
check("recepcionista lee citas", r.data?.length === 2, `${r.data?.length} filas`);
r = await http("GET", `/rest/v1/consultas?select=id&paciente_id=eq.${A.paciente}`, { token: tR });
check("recepcionista no lee consultas", same(r.data, []));

console.log(`\n${fallas === 0 ? "Todos los controles OK" : `${fallas} control(es) fallaron`}`);
process.exit(fallas === 0 ? 0 : 1);
