## Context

Ver `proposal.md - Why`.

Estado actual relevante:

- `src/lib/pdf/documents.tsx` define un componente `Header({ clinica: ClinicaConfig | null })` **privado** (no exportado) que pinta logo + nombre + dirección + teléfono/email + número de registro, más un `StyleSheet` local (`styles`) y las constantes `TEAL`/`SLATE`/`LIGHT`. Ese `Header` lo usan `RecetaPage`, `RecetaClienteDoc`, `HistorialDoc`, `HistorialClienteDoc`, `DerivacionDoc`, `VacunacionDoc`.
- El rótulo "Indicaciones" sale de `<Text style={styles.sectionTitle}>Indicaciones</Text>`. `styles.sectionTitle` incluye `textTransform: "uppercase"`, por eso se ve "INDICACIONES". Aparece en `RecetaPage` y en `RecetaClienteDoc`.
- Las instrucciones generales se renderizan al final de esa misma sección: `receta.instrucciones_generales ? <Text style={{ marginTop: 6 }}>…</Text> : null`, sin rótulo.
- `src/lib/pdf/autorizaciones.tsx` es un módulo aparte con su propio `StyleSheet`. `AutorizacionDoc` sólo pinta `<Text style={styles.clinic}>{c}</Text>` (nombre de la clínica, alineado a la derecha). `AutorizacionData.clinica` es un `string` (sólo el nombre).
- `src/app/(staff)/pacientes/[id]/documentos/documentos-panel.tsx` arma los datos: `initAuth(data)` toma `data.clinica?.nombre_clinica` (el objeto `ClinicaConfig | null` completo ya está disponible en `DocumentosData`), `buildAutorizacionData()` produce el `AutorizacionData`, y `snapshot()` serializa ese mismo objeto para la traza en `documentos_emitidos.datos`.

## Goals / Non-Goals

**Goals:**

- Reutilizar un único componente de encabezado de clínica entre la receta, el historial, la derivación y las autorizaciones, sin divergencia de estilos.
- Cambiar el rótulo y el encabezado de términos de la receta en un solo lugar por versión (staff / portal), sin duplicar strings.

**Non-Goals:**

- No se rediseña el layout de la receta ni de la autorización más allá de lo descrito.
- No se toca el certificado de microchip.
- No se migran las trazas (`documentos_emitidos`) ya registradas.

## Decisions

### 1. Compartir `Header` exportándolo desde `documents.tsx`

`documents.tsx` pasa a exportar `Header` (y, si hace falta para el tipado, nada más). `autorizaciones.tsx` lo importa y lo usa como primer hijo del `<Page>`.

- **Por qué:** es el cambio más chico; `Header` ya es autocontenido (sus estilos viven en el `styles` de `documents.tsx` y sólo dependen de `ClinicaConfig` y de `Image`/`View`/`Text` de `@react-pdf/renderer`). Importar entre módulos de `src/lib/pdf/` no crea ciclo (autorizaciones no es importado por documents).
- **Alternativa considerada:** extraer `Header` + constantes de color a un `src/lib/pdf/_shared.tsx`. Más "correcto" a largo plazo, pero mueve código usado por 6 componentes y agranda el diff sin beneficio inmediato. Se puede hacer después si aparece un tercer módulo de PDF.
- **Nota de estilo:** el `page` de autorizaciones usa `paddingHorizontal: 48` vs. `36` en documents; el `Header` hereda su propio ancho del contenedor, así que queda alineado al margen de la autorización sin ajustes.

### 2. `AutorizacionData` recibe la clínica completa

Cambiar `clinica: string` por `clinica: ClinicaConfig | null` en `AutorizacionData`. Dentro de `AutorizacionDoc`:

- El `Header` recibe ese objeto directamente.
- Donde hoy se usa el nombre como texto (`"Autoriza a Veterinaria <c>"`, párrafos de consentimiento, línea de firma), se deriva `const c = data.clinica?.nombre_clinica || "________"` al inicio, igual que hoy pero leyendo del objeto.
- Se elimina el `<Text style={styles.clinic}>` y, si queda sin uso, el estilo `clinic`.

- **Por qué:** el `Header` necesita logo/dirección/registro, que no están en un `string`. El objeto ya está disponible aguas arriba (`DocumentosData.clinica`), así que sólo hay que dejar de aplanarlo en `initAuth`.
- **Alternativa considerada:** añadir campos sueltos (`clinicaLogoUrl`, `clinicaDireccion`, …) a `AutorizacionData`. Más verboso y hay que mantenerlo en paralelo a `ClinicaConfig`.

### 3. `initAuth` / `buildAutorizacionData` / `snapshot` en `documentos-panel.tsx`

Ajuste respecto del plan original: el panel ya tiene un campo editable "Veterinaria" (`<Campo value={auth.clinica}>`) que permite corregir el nombre de la clínica para esa emisión. Para no perder esa edición, `auth.clinica` se mantiene como **string** (el nombre) y `initAuth` no cambia; el objeto completo se arma en `buildAutorizacionData`.

- `initAuth` sigue devolviendo `clinica: clinica?.nombre_clinica ?? ""` (string). `AuthState` y el campo del formulario no cambian.
- `buildAutorizacionData` arma el objeto: `data.clinica ? { ...data.clinica, nombre_clinica: auth.clinica || data.clinica.nombre_clinica } : null`. Así el `Header` recibe logo/dirección/registro reales y el nombre refleja lo editado en el panel.
- `snapshot()` sigue serializando el objeto resultante; el campo `clinica` de la traza pasa a ser un objeto (o `null`) en vez de un string.
- **Compatibilidad:** las filas ya escritas en `documentos_emitidos.datos` conservan `clinica` como string. Ningún consumidor actual (la traza sólo se lista por tipo y fecha) lee ese campo, así que no se necesita normalización. Se anota como riesgo.

### 4. Rótulo "Rp" literal

Reemplazar el texto `"Indicaciones"` por `"Rp"` en `RecetaPage` y `RecetaClienteDoc`. Como `styles.sectionTitle` fuerza `textTransform: "uppercase"`, para que se lea "Rp" y no "RP" se usa un estilo propio para ese título: `<Text style={[styles.sectionTitle, styles.rpTitle]}>Rp</Text>` con `rpTitle: { textTransform: "none" }` (y, opcional, un `fontSize` algo mayor, a criterio de implementación mínima: basta con `textTransform: "none"`).

- **Por qué no reutilizar `sectionTitle` sin más:** daría "RP", que el usuario descartó explícitamente.
- **Alcance:** sólo el título de esa sección; los demás `sectionTitle` de la receta ("Paciente", "Mascota") siguen en mayúsculas.

### 5. Encabezado "Términos y Condiciones"

En `RecetaPage` y `RecetaClienteDoc`, envolver el bloque de instrucciones generales de modo que, **sólo cuando `instrucciones_generales` tiene contenido**, se renderice antes un `<Text style={styles.sectionTitle}>Términos y Condiciones</Text>`. Se mantiene el patrón condicional que ya existe (`receta.instrucciones_generales ? (…) : null`), agregando el título dentro de esa rama. Puede ir dentro de la misma sección "Rp" (después de la lista de medicamentos) o en una `<View style={styles.section}>` propia; la implementación mínima lo deja en la misma sección con un `marginTop`.

## Risks / Trade-offs

- **La forma del campo `clinica` en `documentos_emitidos.datos` cambia (string → objeto).** → Ningún consumidor lo lee hoy; la UI de trazas sólo muestra tipo y fecha. Si en el futuro se rinde ese snapshot, habrá que tolerar ambas formas.
- **Exportar `Header` acopla `autorizaciones.tsx` a `documents.tsx`.** → Es acoplamiento dentro de la misma carpeta `src/lib/pdf/` y en un solo sentido; si crece, se extrae a `_shared.tsx` (Decisión 1, alternativa).
- **"Rp" con `textTransform: "none"` diverge del resto de títulos de sección.** → Es lo pedido; se aísla en un estilo con nombre propio para que quede explícito.
- **El logo del `Header` se carga vía `<Image src={clinica.logo_url}>` en el render del PDF de autorización, que hasta ahora no cargaba imágenes remotas.** → Mismo mecanismo que ya usan receta e historial; si la URL falla, `@react-pdf` omite la imagen sin romper el documento.
