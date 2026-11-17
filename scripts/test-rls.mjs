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

// Clínica 1 (tenant creado por la migración multi-tenant, spec 6).
const T1 = "00000000-0000-4000-8000-000000000001";

// Inserta como service_role (bypassa RLS; los triggers sí corren). Sin JWT no
// hay tenant de sesión: salvo que la fila diga otro, va a la clínica 1.
async function insert(table, row) {
  const conTenant = table === "usuarios" || "tenant_id" in row ? row : { ...row, tenant_id: T1 };
  const r = await http("POST", `/rest/v1/${table}`, {
    key: SVC,
    body: conTenant,
    prefer: "return=representation",
  });
  if (r.status !== 201) throw new Error(`insert ${table}: ${r.status} ${JSON.stringify(r.data)}`);
  return r.data[0];
}

const run = randomUUID().slice(0, 8);
const PASSWORD = "Test-1234!";

// El staff pertenece a una clínica; los clientes no tienen (spec 6).
async function crearUsuario(alias, rol, tenant = T1) {
  const email = `${alias}-${run}@test.local`;
  const r = await http("POST", "/auth/v1/admin/users", {
    key: SVC,
    body: { email, password: PASSWORD, email_confirm: true },
  });
  if (r.status !== 200) throw new Error(`crear usuario ${alias}: ${r.status}`);
  await insert("usuarios", {
    id: r.data.id,
    nombre: alias,
    email,
    rol,
    tenant_id: rol === "cliente" ? null : tenant,
  });
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

// Spec 7: sin aceptar el aviso de privacidad vigente, el portal no entrega
// datos. La clínica 1 publica uno y A lo acepta antes de los controles.
async function publicarAvisoSvc(tenant, texto) {
  const r = await http("POST", "/rest/v1/avisos_privacidad", {
    key: SVC,
    body: {
      tenant_id: tenant,
      version: (await http("GET", `/rest/v1/avisos_privacidad?select=version&tenant_id=eq.${tenant}&order=version.desc&limit=1`, { key: SVC })).data[0]?.version + 1 || 1,
      texto,
    },
    prefer: "return=representation",
  });
  if (r.status !== 201) throw new Error(`aviso: ${r.status} ${JSON.stringify(r.data)}`);
  return r.data[0].id;
}
const aceptar = (token, aviso) => http("POST", "/rest/v1/rpc/aceptar_aviso", { token, body: { p_aviso: aviso } });
let avisoT1 = await publicarAvisoSvc(T1, `Aviso de prueba ${run}`);
await aceptar(tA, avisoT1);
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

// --- Veterinario responsable (spec 3): solo veterinarios activos ---
const vet2 = await crearUsuario("vet2", "veterinario");
const dev = await crearUsuario("dev", "dev");
const vetInactivo = await crearUsuario("vetinactivo", "veterinario");
const base = { paciente_id: A.paciente, motivo: "control", diagnostico: "dx", tratamiento: "tx" };
// Consulta histórica a nombre de un veterinario que luego se desactiva.
const historica = await insert("consultas", { ...base, veterinario_id: vetInactivo.id });
await http("PATCH", `/rest/v1/usuarios?id=eq.${vetInactivo.id}`, { key: SVC, body: { activo: false } });

const postV = (tabla, body) =>
  http("POST", `/rest/v1/${tabla}`, { token: tV, body, prefer: "return=representation" });
const patchV = (path, body) =>
  http("PATCH", `/rest/v1/${path}`, { token: tV, body, prefer: "return=representation" });
const rechazado = (r) => r.status === 400 && r.data?.code === "23514";

r = await postV("consultas", { ...base, veterinario_id: vet2.id });
const consultaVet2 = r.data?.[0]?.id;
check("veterinario registra una consulta a nombre de otro veterinario", r.status === 201 && r.data?.[0]?.veterinario_id === vet2.id, `HTTP ${r.status}`);
r = await postV("recetas", { consulta_id: consultaVet2, paciente_id: A.paciente, veterinario_id: vet2.id, medicamentos: [] });
const recetaVet2 = r.data?.[0]?.id;
check("receta a nombre de otro veterinario", r.status === 201, `HTTP ${r.status}`);

const hoyIso = new Date().toISOString().slice(0, 10);
for (const [alias, u] of [["dev", dev], ["recepcionista", recep], ["veterinario inactivo", vetInactivo]]) {
  r = await postV("consultas", { ...base, veterinario_id: u.id });
  check(`consulta a nombre de ${alias} rechazada`, rechazado(r), `HTTP ${r.status}`);
  r = await postV("recetas", { consulta_id: consultaVet2, paciente_id: A.paciente, veterinario_id: u.id, medicamentos: [] });
  check(`receta a nombre de ${alias} rechazada`, rechazado(r), `HTTP ${r.status}`);
  r = await postV("vacunas", { paciente_id: A.paciente, veterinario_id: u.id, nombre_vacuna: "Óctuple", fecha_aplicacion: hoyIso });
  check(`vacuna a nombre de ${alias} rechazada`, rechazado(r), `HTTP ${r.status}`);
}

r = await patchV(`consultas?id=eq.${consultaVet2}`, { veterinario_id: vet.id });
check("cambiar el veterinario de la consulta", r.data?.[0]?.veterinario_id === vet.id, `HTTP ${r.status}`);
r = await getV(`recetas?select=veterinario_id&id=eq.${recetaVet2}`);
check("el cambio se propaga a su receta", r.data?.[0]?.veterinario_id === vet.id);
r = await patchV(`consultas?id=eq.${consultaVet2}`, { veterinario_id: dev.id });
check("no se cambia el veterinario a un dev", rechazado(r), `HTTP ${r.status}`);

r = await patchV(`consultas?id=eq.${historica.id}`, { motivo: "control editado" });
check("consulta histórica con veterinario inactivo sigue editable", r.data?.[0]?.motivo === "control editado", `HTTP ${r.status}`);

r = await http("GET", `/rest/v1/audit_log?select=usuario_id&tabla=eq.consultas&operacion=eq.INSERT&registro_id=eq.${consultaVet2}`, { key: SVC });
check("audit_log registra como autor a quien creó, no al responsable", r.data?.[0]?.usuario_id === vet.id);

// --- Controles enlazados a su consulta de origen (spec 4) ---
const control = { ...base, tipo: "control", veterinario_id: vet.id, evolucion: "mejor" };
r = await postV("consultas", { ...control, consulta_origen_id: consultaVet2 });
const controlId = r.data?.[0]?.id;
check("veterinario registra un control enlazado a su consulta", r.status === 201 && r.data?.[0]?.consulta_origen_id === consultaVet2, `HTTP ${r.status}`);
const consultaB = await insert("consultas", { ...base, paciente_id: B.paciente, veterinario_id: vet.id });
r = await postV("consultas", { ...control, consulta_origen_id: consultaB.id });
check("control enlazado a una consulta de otro paciente rechazado", rechazado(r), `HTTP ${r.status}`);
r = await postV("consultas", { ...control, consulta_origen_id: controlId });
check("control enlazado a otro control rechazado", rechazado(r), `HTTP ${r.status}`);
r = await postV("consultas", { ...base, veterinario_id: vet.id, consulta_origen_id: consultaVet2 });
check("consulta que no es control con origen rechazada", rechazado(r), `HTTP ${r.status}`);
r = await patchV(`consultas?id=eq.${controlId}`, { consulta_origen_id: historica.id });
check("el origen de un control no se cambia", rechazado(r), `HTTP ${r.status}`);


// --- Multi-tenant (spec 6): dos clínicas en el mismo proyecto ---
const svc = (method, path, body, prefer = "return=representation") =>
  http(method, path, { key: SVC, body, prefer });
const t2 = await svc("POST", "/rest/v1/tenants", { slug: `t2-${run}`, nombre: `Clínica Dos ${run}` });
const T2 = t2.data[0].id;
const vetT2 = await crearUsuario("vet-t2", "veterinario", T2);
const tV2 = await login(vetT2.email);
const asV2 = (method, path, body) =>
  http(method, `/rest/v1/${path}`, { token: tV2, body, prefer: "return=representation" });

// Dueña con ficha en ambas clínicas (misma cuenta) y datos completos en la 2.
const multi = await crearUsuario("multi", "cliente");
const fichaM1 = await insert("duenos", { nombre: "Multi", telefono: "+56911111111", email: multi.email, usuario_id: multi.id, rut: `9${run.replace(/\D/g, "").slice(0, 6)}-1` });
const fichaM2 = await insert("duenos", { tenant_id: T2, nombre: "Multi", telefono: "+56911111111", email: multi.email, usuario_id: multi.id, rut: `9${run.replace(/\D/g, "").slice(0, 6)}-1` });
check("mismo email y RUT de dueño en otra clínica: se acepta", !!fichaM2.id);
r = await svc("POST", "/rest/v1/duenos", { tenant_id: T1, nombre: "Dup", telefono: "1", email: multi.email });
check("mismo email de dueño en la misma clínica: se rechaza", r.status === 409, `HTTP ${r.status}`);

const pacM1 = await insert("pacientes", { nombre: `Compartido ${run}`, especie: "gato" });
const pacM2 = await insert("pacientes", { tenant_id: T2, nombre: `Compartido ${run}`, especie: "gato" });
check("la primera ficha de una clínica nueva es PAC-00001", pacM2.numero_ficha === "PAC-00001", pacM2.numero_ficha);
check("la clínica 1 sigue su propia numeración", pacM1.numero_ficha !== "PAC-00001", pacM1.numero_ficha);
await insert("paciente_duenos", { paciente_id: pacM1.id, dueno_id: fichaM1.id, es_principal: true });
await insert("paciente_duenos", { tenant_id: T2, paciente_id: pacM2.id, dueno_id: fichaM2.id, es_principal: true });
const consultaT2 = await insert("consultas", { tenant_id: T2, paciente_id: pacM2.id, veterinario_id: vetT2.id, motivo: "m", diagnostico: "d", tratamiento: "t" });
const recetaT2 = await insert("recetas", { tenant_id: T2, consulta_id: consultaT2.id, paciente_id: pacM2.id, veterinario_id: vetT2.id, medicamentos: [] });
check("la primera receta de una clínica nueva es REC-00001", recetaT2.numero_receta === "REC-00001", recetaT2.numero_receta);
await insert("vacunas", { tenant_id: T2, paciente_id: pacM2.id, veterinario_id: vetT2.id, nombre_vacuna: "Triple", fecha_aplicacion: hoyIso });
await insert("examenes", { tenant_id: T2, paciente_id: pacM2.id, nombre: "rx", tipo: "hemograma", fecha: hoyIso });
await insert("citas", { tenant_id: T2, paciente_id: pacM2.id, dueno_id: fichaM2.id, veterinario_id: vetT2.id, fecha_hora: "2030-01-02T13:00:00Z", motivo: "x" });

// El staff de la clínica 2 no ve nada de la 1 (ni la 1 de la 2).
const enT1 = {
  pacientes: [A.paciente, B.paciente, pacM1.id],
  duenos: [A.dueno, B.dueno, fichaM1.id],
  consultas: [consultaVet2, historica.id],
  recetas: [recetaVet2],
  citas: [A.cita, B.cita],
  usuarios: [vet.id, vet2.id],
};
for (const [tabla, idsT1] of Object.entries(enT1)) {
  r = await asV2("GET", `${tabla}?select=id&id=in.(${idsT1.join(",")})`);
  check(`clínica 2 no lee ${tabla} de la clínica 1`, same(r.data, []), `${r.data?.length ?? r.status} filas`);
}
for (const tabla of ["examenes", "vacunas", "paciente_duenos", "documentos_emitidos", "audit_log"]) {
  r = await asV2("GET", `${tabla}?select=tenant_id&tenant_id=eq.${T1}`);
  check(`clínica 2 no lee ${tabla} de la clínica 1`, same(r.data, []), `${r.data?.length ?? r.status} filas`);
}
const sucT2 = await insert("sucursales", { tenant_id: T2, nombre: "Sede dos" });
r = await asV2("GET", `sucursales?select=id`);
check("clínica 2 solo ve sus sucursales", same(ids(r), [sucT2.id]), `${r.data?.length} filas`);
r = await asV2("GET", `esquemas_vacunacion?select=tenant_id&tenant_id=eq.${T1}`);
check("clínica 2 no lee esquemas de la clínica 1", same(r.data, []));
r = await asV2("GET", `tenants?select=id`);
check("clínica 2 solo ve su propia clínica", same(ids(r), [T2]), `${r.data?.length} filas`);
r = await getV(`pacientes?select=id&id=eq.${pacM2.id}`);
check("clínica 1 no lee pacientes de la clínica 2", same(r.data, []));
r = await getV(`consultas?select=id&id=eq.${consultaT2.id}`);
check("clínica 1 no lee consultas de la clínica 2 por id", same(r.data, []));
r = await http("POST", "/rest/v1/rpc/buscar_pacientes", { token: tV, body: { q: `Compartido ${run}` } });
check("búsqueda: solo pacientes de la propia clínica", same(ids(r), [pacM1.id]), `${r.data?.length} filas`);
r = await http("GET", "/rest/v1/usuarios?select=id&rol=eq.veterinario", { token: tV2 });
check("selector de veterinarios: solo los de la propia clínica", same(ids(r), [vetT2.id]), `${r.data?.length} filas`);

// Los embeds de PostgREST siguen siendo unívocos con las FKs compuestas (una
// relación por par de tablas): la app los usa en fichas, agenda y cron.
for (const q of [
  "consultas?select=id,pacientes(nombre),usuarios(nombre)&limit=1",
  "citas?select=id,pacientes(nombre),duenos(nombre),usuarios(nombre)&limit=1",
  "vacunas?select=id,pacientes(nombre),usuarios(nombre)&limit=1",
  "recetas?select=id,consultas(fecha),pacientes(nombre)&limit=1",
  "paciente_duenos?select=es_principal,duenos(nombre),pacientes(nombre)&limit=1",
]) {
  r = await getV(q);
  check(`embed unívoco: ${q.split("?")[0]}`, r.status === 200, r.status === 200 ? "" : r.data?.message);
}

// Escrituras cruzadas.
r = await asV2("POST", "consultas", { paciente_id: A.paciente, veterinario_id: vetT2.id, motivo: "m", diagnostico: "d", tratamiento: "t" });
check("clínica 2 no registra consultas de pacientes de la 1", r.status >= 400, `HTTP ${r.status}`);
r = await asV2("PATCH", `pacientes?id=eq.${A.paciente}`, { nombre: "hackeado" });
check("clínica 2 no modifica pacientes de la 1", same(r.data, []), `HTTP ${r.status}`);
r = await asV2("POST", "pacientes", { tenant_id: T1, nombre: "intruso", especie: "perro" });
check("clínica 2 no crea pacientes en la 1", r.status === 403, `HTTP ${r.status}`);
r = await svc("POST", "/rest/v1/consultas", { tenant_id: T2, paciente_id: A.paciente, veterinario_id: vetT2.id, motivo: "m", diagnostico: "d", tratamiento: "t" });
check("la base rechaza una consulta que cruza clínicas aun con service_role", r.status === 409 && r.data?.code === "23503", `HTTP ${r.status}`);
r = await svc("POST", "/rest/v1/pacientes", { nombre: "sin clínica", especie: "perro", tenant_id: null });
check("una fila sin clínica se rechaza", r.status === 400 && r.data?.code === "23502", `HTTP ${r.status}`);
r = await asV2("POST", "pacientes", { nombre: `Nuevo T2 ${run}`, especie: "perro" });
check("un paciente creado sin indicar clínica queda en la de la sesión", r.data?.[0]?.tenant_id === T2, `HTTP ${r.status}`);

// Storage por carpeta de clínica.
const subir = (token, ruta) =>
  fetch(`${API}/storage/v1/object/examenes/${ruta}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
    body: "contenido",
  }).then((x) => x.status);
const rutaT1 = `${T1}/${A.paciente}/${run}.txt`;
check("staff sube un archivo en la carpeta de su clínica", (await subir(tV, rutaT1)) === 200);
check("staff no sube archivos en la carpeta de otra clínica", (await subir(tV, `${T2}/${pacM2.id}/${run}.txt`)) >= 400);
check("staff no sube archivos fuera de una carpeta de clínica", (await subir(tV, `${A.paciente}/${run}-suelto.txt`)) >= 400);
const bajar = await fetch(`${API}/storage/v1/object/authenticated/examenes/${rutaT1}`, {
  headers: { apikey: ANON, Authorization: `Bearer ${tV2}` },
});
check("clínica 2 no descarga archivos de la clínica 1", bajar.status >= 400, `HTTP ${bajar.status}`);
const bajarT1 = await fetch(`${API}/storage/v1/object/authenticated/examenes/${rutaT1}`, {
  headers: { apikey: ANON, Authorization: `Bearer ${tV}` },
});
check("clínica 1 descarga sus archivos", bajarT1.status === 200, `HTTP ${bajarT1.status}`);
r = await http("POST", "/storage/v1/object/list/examenes", { token: tV2, body: { prefix: T1 } });
check("clínica 2 no lista la carpeta de la clínica 1", r.status >= 400 || same(r.data, []), `HTTP ${r.status}`);

// Dueña con fichas en dos clínicas.
const tM = await login(multi.email);
const avisoT2 = await publicarAvisoSvc(T2, `Aviso T2 ${run}`);
await aceptar(tM, avisoT1);
await aceptar(tM, avisoT2);
const rpcM = (fn, args = {}) => http("POST", `/rest/v1/rpc/${fn}`, { token: tM, body: args });
r = await rpcM("portal_mascotas");
check(
  "portal: la dueña ve sus mascotas de ambas clínicas, cada una con su clínica",
  r.data?.length === 2 && new Set(r.data.map((x) => x.tenant_id)).size === 2 && r.data.every((x) => x.clinica_nombre),
  `${r.data?.length} filas`,
);
r = await rpcM("portal_mi_dueno");
check("portal: una ficha de dueño por clínica", r.data?.length === 2, `${r.data?.length} filas`);
r = await rpcM("portal_consultas", { p_paciente: pacM2.id });
check("portal: consultas de la mascota de la clínica 2", r.data?.length === 1);
r = await http("GET", "/rest/v1/tenants?select=id", { token: tM });
check("portal: la dueña lee las dos clínicas donde tiene ficha", r.data?.length === 2, `${r.data?.length} filas`);
r = await http("GET", `/rest/v1/tenants?select=id&id=eq.${T1}`, { token: tA });
check("un dueño no lee clínicas donde no tiene ficha", r.data?.length === 1 && (await http("GET", `/rest/v1/tenants?select=id&id=eq.${T2}`, { token: tA })).data.length === 0);
// Revocación en la clínica 1: deja de ver esa clínica y conserva la 2.
await svc("PATCH", `/rest/v1/duenos?id=eq.${fichaM1.id}`, { usuario_id: null });
r = await rpcM("portal_mascotas");
check("revocada en la clínica 1, sigue viendo la mascota de la 2", same(ids(r), [pacM2.id]), `${r.data?.length} filas`);

// Clínica desactivada: su staff y sus dueños pierden el acceso de inmediato.
await svc("PATCH", `/rest/v1/tenants?id=eq.${T2}`, { activo: false });
r = await asV2("GET", `pacientes?select=id`);
check("clínica desactivada: su staff no lee nada", same(r.data, []), `${r.data?.length} filas`);
r = await rpcM("portal_mascotas");
check("clínica desactivada: el portal no la muestra", same(r.data, []), `${r.data?.length} filas`);
r = await http("POST", "/rest/v1/rpc/branding_por_slug", { body: { p_slug: `t2-${run}` } });
check("clínica desactivada: su entrada no existe", same(r.data, []));
await svc("PATCH", `/rest/v1/tenants?id=eq.${T2}`, { activo: true });
r = await http("POST", "/rest/v1/rpc/branding_por_slug", { body: { p_slug: `t2-${run}` } });
check("entrada pública: nombre y logo sin sesión, nada más", r.data?.length === 1 && same(Object.keys(r.data[0]).sort(), ["logo_url", "nombre", "slug"]));
r = await http("POST", "/rest/v1/rpc/branding_por_slug", { body: { p_slug: `no-existe-${run}` } });
check("entrada pública: slug inexistente sin datos", same(r.data, []));

// Plataforma: solo dev da de alta clínicas y cambia de clínica activa.
r = await http("POST", "/rest/v1/rpc/crear_clinica", { token: tV, body: { p_slug: `x-${run}`, p_nombre: "X", p_sucursal: "S" } });
check("un veterinario no da de alta clínicas", r.status >= 400, `HTTP ${r.status}`);
r = await http("POST", "/rest/v1/rpc/cambiar_clinica_activa", { token: tV, body: { p_tenant: T2 } });
check("un veterinario no cambia de clínica", r.status >= 400, `HTTP ${r.status}`);
r = await http("PATCH", `/rest/v1/usuarios?id=eq.${vet.id}`, { token: tV, body: { tenant_id: T2 } });
check("un veterinario no se cambia de clínica editando su usuario", r.status === 403, `HTTP ${r.status}`);
const tD = await login(dev.email);
r = await http("POST", "/rest/v1/rpc/crear_clinica", { token: tD, body: { p_slug: `t3-${run}`, p_nombre: "Tres", p_sucursal: "Centro" } });
const T3 = r.data;
check("dev da de alta una clínica", r.status === 200 && typeof T3 === "string", `HTTP ${r.status}`);
r = await http("GET", `/rest/v1/sucursales?select=nombre&tenant_id=eq.${T3}`, { key: SVC });
check("la clínica nueva nace con su sucursal", r.data?.[0]?.nombre === "Centro");
r = await http("GET", `/rest/v1/esquemas_vacunacion?select=id&tenant_id=eq.${T3}`, { key: SVC });
check("la clínica nueva nace con los esquemas de vacunación", r.data?.length > 0, `${r.data?.length} esquemas`);
r = await http("POST", "/rest/v1/rpc/crear_clinica", { token: tD, body: { p_slug: `t3-${run}`, p_nombre: "Otra", p_sucursal: "S" } });
check("slug repetido rechazado", r.status === 409, `HTTP ${r.status}`);
r = await http("POST", "/rest/v1/rpc/cambiar_clinica_activa", { token: tD, body: { p_tenant: T2 } });
check("dev cambia de clínica activa", r.status === 204 || r.status === 200, `HTTP ${r.status}`);
const tD2 = await login(dev.email);
r = await http("GET", `/rest/v1/pacientes?select=id&id=in.(${pacM2.id},${A.paciente})`, { token: tD2 });
check("dev con la clínica 2 activa ve solo sus pacientes", same(ids(r), [pacM2.id]), `${r.data?.length} filas`);


// --- Privacidad y consentimiento (spec 7) ---
// Dueña nueva en la clínica 1, con una mascota con receta y examen.
const pu = await crearUsuario("priv", "cliente");
const fichaP = await insert("duenos", { nombre: "Priv Dueña", telefono: "+56944444444", email: pu.email, usuario_id: pu.id, rut: `8${run.replace(/\D/g, "").slice(0, 6)}-2`, direccion: "Calle 1", notas: "nota" });
const pacP = await insert("pacientes", { nombre: `Priv ${run}`, especie: "perro" });
await insert("paciente_duenos", { paciente_id: pacP.id, dueno_id: fichaP.id, es_principal: true });
const consP = await insert("consultas", { paciente_id: pacP.id, veterinario_id: vet.id, motivo: "m", diagnostico: "d", tratamiento: "t" });
await insert("recetas", { consulta_id: consP.id, paciente_id: pacP.id, veterinario_id: vet.id, medicamentos: [] });
await insert("examenes", { paciente_id: pacP.id, nombre: "visible P", tipo: "hemograma", fecha: hoyIso, interno: false });
await insert("citas", { paciente_id: pacP.id, dueno_id: fichaP.id, veterinario_id: vet.id, fecha_hora: "2030-02-01T13:00:00Z", motivo: "x", notas_cliente: "texto del dueño" });
const tP = await login(pu.email);
const rpcP = (fn, args = {}) => http("POST", `/rest/v1/rpc/${fn}`, { token: tP, body: args });

r = await rpcP("portal_mi_dueno");
check("sin aceptar: el portal sabe qué aviso falta", r.data?.[0]?.aviso_pendiente === true && r.data?.[0]?.aviso_vigente_id === avisoT1);
r = await rpcP("portal_mascotas");
check("sin aceptar: portal_mascotas no entrega la mascota", same(r.data, []), `${r.data?.length} filas`);
r = await rpcP("portal_consultas", { p_paciente: pacP.id });
check("sin aceptar: portal_consultas vacío", same(r.data, []));
r = await http("GET", `/rest/v1/recetas?select=id&paciente_id=eq.${pacP.id}`, { token: tP });
check("sin aceptar: no lee sus recetas", same(r.data, []));
r = await http("GET", `/rest/v1/examenes?select=id&paciente_id=eq.${pacP.id}`, { token: tP });
check("sin aceptar: no lee sus exámenes", same(r.data, []));
r = await http("GET", `/rest/v1/avisos_privacidad?select=id,texto&id=eq.${avisoT1}`, { token: tP });
check("sin aceptar: sí lee el aviso que debe aceptar", r.data?.length === 1);
r = await aceptar(tP, avisoT2);
check("no acepta el aviso de una clínica donde no tiene ficha", r.status >= 400, `HTTP ${r.status}`);
r = await aceptar(tP, avisoT1);
check("acepta el aviso vigente", r.status === 204 || r.status === 200, `HTTP ${r.status}`);
r = await rpcP("portal_mascotas");
check("aceptado: ve su mascota", same(ids(r), [pacP.id]));
r = await http("GET", `/rest/v1/aceptaciones_privacidad?select=aviso_id,usuario_id&dueno_id=eq.${fichaP.id}`, { token: tP });
check("la aceptación registra versión y cuenta", r.data?.length === 1 && r.data[0].aviso_id === avisoT1 && r.data[0].usuario_id === pu.id);

// Versión nueva: vuelve a pedir la aceptación; la anterior se conserva.
const avisoAnterior = avisoT1;
avisoT1 = await publicarAvisoSvc(T1, `Aviso de prueba ${run} v2`);
r = await aceptar(tP, avisoAnterior);
check("no acepta una versión que ya no es la vigente", r.status >= 400, `HTTP ${r.status}`);
r = await rpcP("portal_mascotas");
check("versión nueva: vuelve a bloquear hasta aceptar", same(r.data, []));
r = await http("GET", `/rest/v1/aceptaciones_privacidad?select=id&dueno_id=eq.${fichaP.id}`, { token: tP });
check("versión nueva: la aceptación anterior se conserva", r.data?.length === 1);
await aceptar(tP, avisoT1);
r = await rpcP("portal_mascotas");
check("aceptada la versión nueva: vuelve a ver su mascota", same(ids(r), [pacP.id]));
await aceptar(tA, avisoT1);

// Publicar: solo dev, y nunca editar ni borrar versiones.
r = await http("POST", "/rest/v1/rpc/publicar_aviso", { token: tV, body: { p_texto: "x" } });
check("un veterinario no publica avisos", r.status >= 400, `HTTP ${r.status}`);
r = await http("POST", "/rest/v1/avisos_privacidad", { token: tV, body: { version: 99, texto: "x" } });
check("nadie inserta avisos directamente", r.status >= 400, `HTTP ${r.status}`);
r = await http("PATCH", `/rest/v1/avisos_privacidad?id=eq.${avisoT1}`, { key: SVC, body: { texto: "cambiado" } });
check("un aviso publicado no se modifica (ni con service_role)", r.status >= 400, `HTTP ${r.status}`);
r = await http("DELETE", `/rest/v1/avisos_privacidad?id=eq.${avisoT1}`, { key: SVC });
check("un aviso publicado no se borra (ni con service_role)", r.status >= 400, `HTTP ${r.status}`);
r = await http("PATCH", `/rest/v1/aceptaciones_privacidad?dueno_id=eq.${fichaP.id}`, { key: SVC, body: { aceptado_en: "2000-01-01T00:00:00Z" } });
check("una aceptación no se modifica", r.status >= 400, `HTTP ${r.status}`);
r = await http("DELETE", `/rest/v1/aceptaciones_privacidad?dueno_id=eq.${fichaP.id}`, { token: tP, prefer: "return=representation" });
const quedan = (await http("GET", `/rest/v1/aceptaciones_privacidad?select=id&dueno_id=eq.${fichaP.id}`, { key: SVC })).data.length;
check("el dueño no borra sus aceptaciones", quedan === 2, `${quedan} filas`);

// Registro de accesos.
const reg = (token, accion, args = {}) =>
  http("POST", "/rest/v1/rpc/registrar_acceso", { token, body: { p_accion: accion, ...args } });
r = await reg(tV, "ver_ficha", { p_paciente: pacP.id });
const idRegistro = r.data;
check("staff registra la apertura de una ficha de su clínica", r.status === 200 && typeof idRegistro === "number", `HTTP ${r.status}`);
r = await http("GET", `/rest/v1/registro_accesos?select=usuario_id,tenant_id,accion&id=eq.${idRegistro}`, { key: SVC });
check("la entrada queda a nombre de la sesión y en su clínica", r.data?.[0]?.usuario_id === vet.id && r.data?.[0]?.tenant_id === T1);
r = await reg(tV, "ver_ficha", { p_paciente: pacM2.id });
check("staff no registra accesos a pacientes de otra clínica", r.status >= 400, `HTTP ${r.status}`);
r = await reg(tV, "anonimizar", { p_dueno: fichaP.id });
check("la anonimización no se registra a mano", r.status >= 400, `HTTP ${r.status}`);
r = await reg(tP, "descargar_portal", { p_paciente: pacP.id, p_detalle: { tipo: "historial" } });
check("el dueño registra la descarga de su mascota", r.status === 200, `HTTP ${r.status}`);
r = await reg(tP, "descargar_portal", { p_paciente: A.paciente });
check("el dueño no registra accesos a mascotas ajenas", r.status >= 400, `HTTP ${r.status}`);
r = await reg(tP, "ver_ficha", { p_paciente: pacP.id });
check("el dueño no registra acciones de staff", r.status >= 400, `HTTP ${r.status}`);
r = await http("POST", "/rest/v1/registro_accesos", { token: tV, body: { accion: "ver_ficha", usuario_id: dev.id, tenant_id: T1 } });
check("nadie inserta en el registro directamente", r.status >= 400, `HTTP ${r.status}`);
r = await http("PATCH", `/rest/v1/registro_accesos?id=eq.${idRegistro}`, { key: SVC, body: { accion: "exportar_datos" } });
check("el registro no se modifica (ni con service_role)", r.status >= 400, `HTTP ${r.status}`);
r = await http("DELETE", `/rest/v1/registro_accesos?id=eq.${idRegistro}`, { key: SVC });
check("el registro no se borra (ni con service_role)", r.status >= 400, `HTTP ${r.status}`);
r = await http("GET", `/rest/v1/registro_accesos?select=id&id=eq.${idRegistro}`, { token: tV });
check("un veterinario no lee el registro", same(r.data, []));
r = await http("GET", `/rest/v1/registro_accesos?select=id&id=eq.${idRegistro}`, { token: tP });
check("un dueño no lee el registro", same(r.data, []));
const devP = await crearUsuario("dev-priv", "dev");
const tDP = await login(devP.email);
r = await http("GET", `/rest/v1/registro_accesos?select=id&id=eq.${idRegistro}`, { token: tDP });
check("dev de la clínica lee el registro", r.data?.length === 1);
r = await http("GET", `/rest/v1/registro_accesos?select=id&id=eq.${idRegistro}`, { token: tD2 });
check("dev con otra clínica activa no lo lee", same(r.data, []));

// Anonimización.
const anon = (token, dueno) => http("POST", "/rest/v1/rpc/anonimizar_dueno", { token, body: { p_dueno: dueno } });
r = await anon(tR, fichaP.id);
check("una recepcionista no anonimiza", r.status >= 400, `HTTP ${r.status}`);
r = await anon(tV2, fichaP.id);
check("otra clínica no anonimiza a sus dueños", r.status >= 400, `HTTP ${r.status}`);
r = await anon(tV, fichaP.id);
check("un veterinario anonimiza y obtiene la cuenta que tenía", r.status === 200 && r.data === pu.id, `HTTP ${r.status}`);
const [anonimo] = (await http("GET", `/rest/v1/duenos?select=*&id=eq.${fichaP.id}`, { key: SVC })).data;
check(
  "sin datos personales",
  anonimo.nombre === "Dueño eliminado" && anonimo.telefono === "—" && !anonimo.rut && !anonimo.email && !anonimo.direccion && !anonimo.notas && !anonimo.usuario_id,
);
r = await http("GET", `/rest/v1/consultas?select=id&paciente_id=eq.${pacP.id}`, { key: SVC });
check("la ficha clínica de la mascota se conserva", r.data?.length === 1);
r = await http("GET", `/rest/v1/citas?select=notas_cliente&dueno_id=eq.${fichaP.id}`, { key: SVC });
check("las notas del dueño en sus citas se borran", r.data?.[0]?.notas_cliente === null);
r = await rpcP("portal_mi_dueno");
check("el dueño anonimizado ya no tiene ficha en el portal", same(r.data, []));
r = await http("GET", `/rest/v1/registro_accesos?select=accion&dueno_id=eq.${fichaP.id}&accion=eq.anonimizar`, { key: SVC });
check("la anonimización queda en el registro", r.data?.length === 1);

console.log(`\n${fallas === 0 ? "Todos los controles OK" : `${fallas} control(es) fallaron`}`);
process.exit(fallas === 0 ? 0 : 1);
