## Why

La receta impresa/exportada rotula su bloque de medicamentos como "Indicaciones", cuando la convención clínica es el símbolo de prescripción "Rp", y el texto de instrucciones generales aparece sin ningún encabezado que lo distinga como los términos bajo los que se entrega la receta. Además, los documentos de autorización (eutanasia, cirugía, hospitalización) salen con solo el nombre de la clínica alineado a la derecha, sin el encabezado con logo y datos de la clínica que sí llevan la receta, el historial y la carta de derivación, lo que los hace ver inconsistentes y menos formales.

## What Changes

- En el documento de receta (versión staff y versión del portal del dueño): reemplazar el rótulo de la sección de medicamentos "Indicaciones" (hoy renderizado en mayúsculas) por "Rp", mostrado de forma literal ("Rp", no "RP").
- En el documento de receta (ambas versiones): agregar un encabezado de sección "Términos y Condiciones" inmediatamente antes del texto de instrucciones generales. Si no hay instrucciones generales, el encabezado no se muestra.
- En los documentos de autorización (eutanasia, cirugía, hospitalización): reemplazar la línea con solo el nombre de la clínica por el mismo encabezado (logo, nombre, dirección, teléfono/email, número de registro) que usan la receta y los demás documentos clínicos.
- Sin cambios en el certificado de microchip (se genera como overlay sobre el formulario oficial).

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `clinical-document-export`: el documento de receta rotula el bloque de medicamentos como "Rp" y antecede las instrucciones generales con un encabezado "Términos y Condiciones"; aplica a la receta del staff y a la receta del portal del dueño.
- `authorization-documents`: el documento de autorización lleva el encabezado estándar de la clínica (logo y datos de identificación) consistente con los demás documentos clínicos.

## Impact

- Código:
  - `src/lib/pdf/documents.tsx`: `RecetaPage` y `RecetaClienteDoc` (rótulo "Rp" + encabezado "Términos y Condiciones"); exponer/compartir el componente `Header` (hoy privado) para reutilizarlo.
  - `src/lib/pdf/autorizaciones.tsx`: `AutorizacionDoc` usa el `Header` compartido; `AutorizacionData` deja de recibir `clinica: string` y pasa a recibir los datos completos de la clínica (`ClinicaConfig | null`) para poder pintar logo y metadatos.
  - `src/app/(staff)/pacientes/[id]/documentos/documentos-panel.tsx`: `initAuth` / `buildAutorizacionData` / `snapshot` ajustan el armado de datos de autorización al nuevo shape de clínica.
- Sin migraciones de base de datos ni cambios de API.
- El snapshot de auditoría de autorizaciones emitidas (`documentos_emitidos.datos`) cambia de forma para el campo de clínica; las emisiones ya registradas conservan su forma antigua.
