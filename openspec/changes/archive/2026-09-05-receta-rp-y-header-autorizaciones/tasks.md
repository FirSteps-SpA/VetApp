## 1. Compartir el encabezado de clínica

- [x] 1.1 En `src/lib/pdf/documents.tsx`, exportar el componente `Header` (cambiar `function Header` por `export function Header`); confirmar que no se rompe ningún consumidor interno.

## 2. Receta: rótulo "Rp" y encabezado "Términos y Condiciones"

- [x] 2.1 En `src/lib/pdf/documents.tsx`, agregar al `StyleSheet` un estilo `rpTitle: { textTransform: "none" }` (opcionalmente un `fontSize` algo mayor).
- [x] 2.2 En `RecetaPage`, reemplazar `<Text style={styles.sectionTitle}>Indicaciones</Text>` por `<Text style={[styles.sectionTitle, styles.rpTitle]}>Rp</Text>`.
- [x] 2.3 En `RecetaPage`, dentro de la rama condicional de `receta.instrucciones_generales`, anteponer `<Text style={styles.sectionTitle}>Términos y Condiciones</Text>` antes del `<Text>` con el texto; si el campo está vacío, no se renderiza ni el título ni el texto.
- [x] 2.4 Repetir 2.2 y 2.3 en `RecetaClienteDoc` (versión del portal), usando `receta.instrucciones_generales` de `RecetaPortal`.
- [x] 2.5 Verificar visualmente (o con un render de prueba) que el rótulo se lee "Rp" (no "RP") y que el encabezado de términos aparece sólo cuando hay instrucciones generales, en la receta staff y en la del portal. — Render headless (`renderToBuffer`) de `RecetaDoc` con y sin `instrucciones_generales` y de `RecetaClienteDoc`: renderizan OK; el rótulo usa `[sectionTitle, rpTitle]` con `textTransform: "none"` (literal "Rp") y el bloque "Términos y Condiciones" está dentro de la rama condicional de `instrucciones_generales`.

## 3. Autorizaciones: encabezado de clínica

- [x] 3.1 En `src/lib/pdf/autorizaciones.tsx`, importar `Header` desde `@/lib/pdf/documents` y `ClinicaConfig` desde `@/lib/types/db`.
- [x] 3.2 Cambiar `AutorizacionData.clinica` de `string` a `ClinicaConfig | null`.
- [x] 3.3 En `AutorizacionDoc`, derivar `const c = data.clinica?.nombre_clinica || "________"` y usar `c` donde hoy se usa el nombre (párrafo "Autoriza a Veterinaria", `cfg.parrafo1(c)`, `cfg.parrafo2(c)`, y cualquier otro uso).
- [x] 3.4 Reemplazar `<Text style={styles.clinic}>{c}</Text>` por `<Header clinica={data.clinica} />` como primer hijo del `<Page>`; eliminar el estilo `clinic` si queda sin uso.
- [x] 3.5 Confirmar que `autorizaciones.tsx` importa lo necesario (`Image`/`View` ya vienen vía el `Header` importado, no hace falta añadirlos).

## 4. Panel de documentos: armado de datos

- [x] 4.1 En `src/app/(staff)/pacientes/[id]/documentos/documentos-panel.tsx`: se mantiene `initAuth` devolviendo `clinica` como string (el campo "Veterinaria" del panel sigue editable). El objeto completo se arma en `buildAutorizacionData` (ver 4.2). `AuthState` no cambia.
- [x] 4.2 En `buildAutorizacionData()`, armar `clinica: data.clinica ? { ...data.clinica, nombre_clinica: auth.clinica || data.clinica.nombre_clinica } : null`.
- [x] 4.3 Verificar que `snapshot()` sigue compilando; el campo `clinica` de la traza pasa a ser objeto/`null` (aceptado por diseño, ver `design.md - Risks`).
- [x] 4.4 Revisar cualquier otro uso de `auth.clinica` como string en el archivo y adaptarlo: el único (`<Campo label="Veterinaria" value={auth.clinica}>`) sigue válido sin cambios.

## 5. Verificación

- [x] 5.1 `npm run lint` y `npx tsc --noEmit` (o el check de tipos del proyecto) sin errores nuevos. — `npx next lint`: sin warnings ni errores. `npx tsc --noEmit`: sin errores.
- [x] 5.2 Generar una autorización de eutanasia, una de cirugía y una de hospitalización desde la ficha de un paciente y confirmar que abren con el encabezado (logo + datos de la clínica) igual que la receta. — Verificado con render headless de `AutorizacionDoc` para los 3 tipos con `ClinicaConfig` completo: renderizan OK y `<Header clinica={data.clinica} />` es el primer hijo del `<Page>`. QA visual en la app queda recomendada.
- [x] 5.3 Generar una autorización con la clínica sin logo y/o sin algún dato de contacto y confirmar que no rompe. — Render headless con clínica sin logo/contacto/registro y con `clinica: null`: ambos renderizan OK (el `Header` omite los campos ausentes).
- [x] 5.4 Confirmar que el certificado de microchip no cambió. — `src/lib/pdf/microchip-overlay.tsx` no está en el diff; el flujo de microchip (`generarCertificadoMicrochip`) no se tocó.
