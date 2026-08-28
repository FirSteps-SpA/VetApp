## Context

Los documentos clínicos actuales se generan con `@react-pdf/renderer` desde componentes en `src/lib/pdf/documents.tsx`, cargados de forma diferida (`dynamic(..., { ssr:false })`) para no engrosar el bundle de la ficha. Los datos ya disponibles: `Dueno` (nombre, rut, telefono, direccion), `Paciente` (nombre, rut, especie, raza, fecha_nacimiento, sexo, castrado), `ClinicaConfig` (nombre_clinica, ciudad, direccion). Las plantillas legales están en `docs/actions/` (eutanasia y cirugía redactadas; hospitalización vacía). El certificado de microchip es un PDF oficial vectorial de 612×396 pt **sin AcroForm** (nada que rellenar por campos).

## Goals / Non-Goals

**Goals:**
- Generar e imprimir los 4 documentos desde la ficha, con autollenado de lo conocido y relleno manual del resto.
- Imprimir el microchip **sobre** el formulario oficial real.
- Dejar traza de cada emisión para auditoría legal.

**Non-Goals:**
- Firma electrónica (la firma es física, en papel).
- Almacenar el PDF generado (el papel firmado es el artefacto legal; solo se guarda metadata).
- Modificar el schema de `Dueno`/`Paciente` para cubrir los campos faltantes (sector, comuna, color, datos del vet): en v1 se piden manualmente.
- Sumar estos documentos al panel de exportación clínico.

## Decisions

### 1. Acceso propio (drawer desde la ficha)
Un botón "Autorizaciones y certificados" en la ficha abre un drawer con: selección de tipo (4) → formulario de relleno (pre-cargado) → generar/imprimir. Componente cliente con `dynamic import` (ssr:false), igual que exportación, para que react-pdf/pdf-lib no entren al bundle de la ficha de quien no los usa.

### 2. Dos pipelines de documento
- **Autorizaciones** (eutanasia/cirugía/hospitalización): un `AutorizacionDoc` de react-pdf parametrizado por tipo. Comparten estructura (encabezado, identificación dueño+mascota, cuerpo específico, párrafos de responsabilidad, bloque "Autoriza"); difieren en título, verbo del procedimiento y campos del caso.
- **Microchip**: **`pdf-lib`** (dependencia nueva), no react-pdf. Se carga el PDF oficial (servido como asset) y se dibujan textos y marcas de checkbox en coordenadas. react-pdf no puede componer sobre un PDF existente; pdf-lib sí, conservando el vector oficial.

### 3. Autollenado + formulario manual (sin tocar schema)
El formulario pre-carga lo conocido y deja editar todo. Faltantes que se piden a mano en v1: **sector, comuna** (solo hay `direccion`), **color** (no existe en `Paciente`), **datos del vet a cargo** (nombres/apellidos/RUT/registro/MV-TV no están desglosados en el usuario), y los campos propios del acto (antecedentes, necesidad, riesgo, tipo de procedimiento, modo de obtención, razón de tenencia). Mapeo dato→campo documentado en la spec.

### 4. Traza de emisión (metadata, sin PDF)
Nueva tabla `documentos_emitidos`: `id`, `paciente_id`, `dueno_id`, `tipo` (`eutanasia|cirugia|hospitalizacion|microchip`), `emitido_por` (usuario), `emitido_en` (timestamp), `datos` (JSONB con el snapshot de los campos usados). RLS: solo staff. Se inserta al generar/imprimir. No se guarda el binario (coherente con haber retirado `recetas.pdf_url`). La ficha puede mostrar el historial de documentos emitidos.

### 5. Calibración del overlay de microchip
El PDF oficial (612×396 pt, origen abajo-izquierda) se guarda como asset del proyecto. Se define un mapa de coordenadas `{ campo: {x, y} }` y de checkboxes `{ opción: {x, y} }`, calibrado iterativamente (generar → comparar → ajustar). Se aísla en un módulo (`microchip-overlay`) para que un cambio del formato oficial se arregle en un solo lugar. Riesgo asumido por el usuario.

### 6. Texto de hospitalización
Se redacta `docs/actions/02-auth_hospitalizacion.md` espejando eutanasia/cirugía, con la responsabilidad adaptada a la internación (riesgos inherentes a la hospitalización, evolución y tratamientos). El contenido legal lo revisa la clínica; la app solo lo instrumenta.

## Risks / Trade-offs

- **Fragilidad de coordenadas**: si el formulario oficial cambia de layout, el overlay se desalinea. Mitigado aislando el mapa de coordenadas en un módulo único y versionando el PDF oficial usado.
- **Exactitud legal del texto**: las plantillas (incluida hospitalización) son responsabilidad de la clínica; la app no valida su suficiencia jurídica.
- **Peso de `pdf-lib`**: se agrega solo al chunk diferido del flujo, no al bundle de la ficha.
- **Campos manuales repetitivos**: sector/comuna/color/datos del vet se re-tipean en cada emisión hasta que (si se decide) se agreguen al schema en un cambio posterior.
