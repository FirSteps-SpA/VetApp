// Spec 6 (multi-tenant): mueve los archivos de Storage existentes a la carpeta
// del tenant 1 (`<tenant_id>/...`). Se corre justo después de la migración
// 20261117000000_multi_tenant.sql, que ya reescribió las rutas guardadas; si
// alguna quedara sin carpeta de clínica, también la corrige (vía API, lo que sí
// actualiza su `updated_at`). Es idempotente: lo que ya está bajo la carpeta
// de un tenant no se toca.
//
// Uso:
//   node scripts/migrar-storage-tenant.mjs              # local, solo muestra el plan
//   node scripts/migrar-storage-tenant.mjs --aplicar    # local, aplica
//   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/migrar-storage-tenant.mjs --aplicar --produccion
//
// Sin `--produccion` aborta si la URL no es local.

import { execFileSync } from "node:child_process";

const TENANT_1 = "00000000-0000-4000-8000-000000000001";
const BUCKETS = ["fotos-pacientes", "examenes", "recetas-pdf", "historiales-pdf", "clinica-assets"];
// Columna con ruta de Storage → bucket y tabla.
const COLUMNAS = [
  { tabla: "pacientes", columna: "foto_url" },
  { tabla: "examenes", columna: "archivo_url" },
  { tabla: "recetas", columna: "pdf_url" },
  { tabla: "tenants", columna: "logo_url" },
];

const aplicar = process.argv.includes("--aplicar");
const produccion = process.argv.includes("--produccion");

function entorno() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
  }
  const out = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
  const env = {};
  for (const line of out.split("\n")) {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    if (m) env[m[1]] = m[2];
  }
  return { url: env.API_URL, key: env.SERVICE_ROLE_KEY };
}

const { url: API, key: SVC } = entorno();
const esLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(API ?? "");
if (!API || !SVC) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (o `supabase start`).");
  process.exit(2);
}
if (!esLocal && !produccion) {
  console.error(`Abortado: ${API} no es local. Usa --produccion si es intencional.`);
  process.exit(2);
}

async function http(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      apikey: SVC,
      Authorization: `Bearer ${SVC}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text}`);
  return data;
}

// Lista recursiva de un bucket (la API lista un nivel por vez; las carpetas
// vienen con id null).
async function listar(bucket, prefijo = "") {
  const archivos = [];
  for (let offset = 0; ; offset += 1000) {
    const items = await http("POST", `/storage/v1/object/list/${bucket}`, {
      prefix: prefijo,
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    for (const it of items) {
      const ruta = prefijo ? `${prefijo}/${it.name}` : it.name;
      if (it.id === null) archivos.push(...(await listar(bucket, ruta)));
      else archivos.push(ruta);
    }
    if (items.length < 1000) break;
  }
  return archivos;
}

// Ya está en la carpeta de una clínica si su primer segmento es el id de un
// tenant. No basta con "parece un UUID": las fotos se guardaban como
// `<paciente_id>/perfil_...`, y ese primer segmento también es un UUID.
const tenants = new Set((await http("GET", "/rest/v1/tenants?select=id")).map((t) => t.id));
if (!tenants.has(TENANT_1)) {
  console.error("No existe el tenant 1: ¿se aplicó la migración multi-tenant?");
  process.exit(2);
}
const conPrefijo = (ruta) => tenants.has(ruta.split("/")[0]);
const esUrl = (v) => /^https?:\/\//.test(v);

console.log(`${aplicar ? "APLICANDO" : "PLAN (sin cambios; usa --aplicar)"} en ${API}\n`);

let movidos = 0;
let pendientes = 0;
for (const bucket of BUCKETS) {
  const rutas = (await listar(bucket)).filter((r) => !r.endsWith(".emptyFolderPlaceholder"));
  const mover = rutas.filter((r) => !conPrefijo(r));
  console.log(`${bucket}: ${rutas.length} archivos, ${mover.length} por mover`);
  for (const ruta of mover) {
    pendientes++;
    if (!aplicar) continue;
    await http("POST", "/storage/v1/object/move", {
      bucketId: bucket,
      sourceKey: ruta,
      destinationKey: `${TENANT_1}/${ruta}`,
    });
    movidos++;
  }
}

let actualizadas = 0;
for (const { tabla, columna } of COLUMNAS) {
  const filas = await http("GET", `/rest/v1/${tabla}?select=id,${columna}&${columna}=not.is.null`);
  const cambiar = filas.filter((f) => !esUrl(f[columna]) && !conPrefijo(f[columna]));
  console.log(`${tabla}.${columna}: ${filas.length} con valor, ${cambiar.length} por actualizar`);
  for (const f of cambiar) {
    pendientes++;
    if (!aplicar) continue;
    await http("PATCH", `/rest/v1/${tabla}?id=eq.${f.id}`, {
      [columna]: `${TENANT_1}/${f[columna]}`,
    });
    actualizadas++;
  }
}

console.log(
  aplicar
    ? `\nListo: ${movidos} archivos movidos, ${actualizadas} rutas actualizadas.`
    : `\n${pendientes} cambios pendientes.`,
);
