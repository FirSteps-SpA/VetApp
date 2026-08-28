## Why

La clínica necesita imprimir documentos legales/consentimientos y un certificado oficial que hoy se llenan a mano en Word/papel, con datos que la app ya conoce (dueño, mascota, clínica). Automatizar el relleno reduce errores y tiempo, y deja traza de qué se emitió.

Son cuatro documentos con dos naturalezas distintas:

- **Autorizaciones** (eutanasia, cirugía, hospitalización): texto legal con espacios en blanco. Las plantillas viven en `docs/actions/` (`00-auth_eutanasia.md`, `01-auth_cirugia.md`); falta redactar la de hospitalización (`02-auth_hospitalizacion.md` está vacío).
- **Certificado de microchip**: un formulario oficial en PDF (`docs/actions/Comprobante_Existencia_microchip.pdf`) sobre el cual hay que **imprimir** los datos. El PDF es vectorial (612×396 pt), **sin campos rellenables (no AcroForm)**, así que hay que dibujar texto y marcas en coordenadas.

## What Changes

Nueva capacidad para generar e imprimir estos documentos desde la ficha del paciente, con relleno automático y traza de emisión.

- **Acceso propio** (no dentro del panel de exportación clínico): un botón/flujo "Autorizaciones y certificados" en la ficha que abre un formulario de relleno y genera el PDF listo para imprimir.
- **Cuatro documentos**: Autorización de Eutanasia, de Cirugía, de Hospitalización y Certificado de Microchip.
- **Redactar** el texto de hospitalización (`02-auth_hospitalizacion.md`) espejando eutanasia/cirugía, adaptado a la internación.
- **Autollenado** de lo que la app conoce (dueño: nombre/RUT/teléfono/dirección; mascota: nombre/especie/sexo/f. nac./raza/esterilizado; clínica: nombre/ciudad) y **relleno manual** de lo que falta (sector, comuna, color, datos del veterinario a cargo, y los campos propios del acto: antecedentes, riesgo, tipo de procedimiento, etc.).
- **Autorizaciones** se generan desde cero con `@react-pdf/renderer` (mismo motor que los documentos clínicos), como un `AutorizacionDoc` parametrizado por tipo.
- **Certificado de microchip** se genera por **overlay con `pdf-lib`** (nueva dependencia): se carga el PDF oficial y se dibujan textos y marcas de checkbox en coordenadas calibradas sobre el formulario.
- **Traza**: cada emisión se registra (tipo de documento, paciente, dueño, veterinario emisor, fecha y un snapshot de los campos usados) para auditoría legal. No se almacena el PDF (el documento firmado en papel es el artefacto legal).
- **Firma física**: el documento se imprime y el dueño firma en papel; no hay firma electrónica.

## Capabilities

### New Capabilities
- `authorization-documents`: generación, relleno e impresión de documentos legales/consentimientos (eutanasia, cirugía, hospitalización) y del certificado oficial de microchip, con autollenado desde los datos del paciente/dueño/clínica y traza de emisión.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Dependencia nueva**: `pdf-lib` (overlay sobre el PDF oficial del microchip).
- **UI**: nuevo flujo en la ficha del paciente (`src/app/(staff)/pacientes/[id]/…`) — botón + drawer/formulario de relleno; componente cliente con `dynamic import` (ssr:false) para no engrosar el bundle de la ficha (mismo patrón que exportación).
- **Documentos**: nuevo `AutorizacionDoc` (react-pdf) en `src/lib/pdf/`; util de overlay de microchip con `pdf-lib`; el PDF oficial se sirve como asset.
- **Datos**: nueva tabla de traza (p. ej. `documentos_emitidos`) + su acción de servidor; sin cambios en las tablas existentes.
- **Contenido**: se redacta `docs/actions/02-auth_hospitalizacion.md`.
- **Sin impacto** en el panel de exportación clínico ni en la impresión contextual existente.
