## 1. Contenido y datos

- [x] 1.1 Redactar `docs/actions/02-auth_hospitalizacion.md` espejando eutanasia/cirugía, con la responsabilidad adaptada a la internación (usar el borrador ya revisado)
- [x] 1.2 Migración SQL: tabla `documentos_emitidos` (`id`, `paciente_id`, `dueno_id`, `tipo`, `emitido_por`, `emitido_en`, `datos` jsonb) + RLS solo-staff + índices
- [x] 1.3 Servir el PDF oficial del microchip como asset del proyecto (accesible por el generador cliente)

## 2. Motor de autorizaciones (react-pdf)

- [x] 2.1 `AutorizacionDoc` en `src/lib/pdf/` parametrizado por tipo (eutanasia | cirugia | hospitalizacion): estructura compartida (encabezado, identificación dueño+mascota, responsabilidad, bloque "Autoriza") y campos por tipo
- [x] 2.2 Mapeo de autollenado: dueño (nombre/RUT/teléfono/dirección), mascota (nombre/especie/sexo/f. nac./raza/esterilizado), clínica (nombre/ciudad) → campos del documento

## 3. Motor del certificado de microchip (pdf-lib)

- [x] 3.1 Agregar dependencia `pdf-lib`
- [x] 3.2 Módulo `microchip-overlay`: cargar el PDF oficial, dibujar textos y marcas de checkbox en coordenadas; API `(datos) => Blob`
- [x] 3.3 Calibrar el mapa de coordenadas (612×396 pt, origen abajo-izquierda) para todos los campos y checkboxes (implantación/verificación, especie, sexo, esterilizado, modo de obtención, razón de tenencia, MV/TV), iterando hasta alinear — calibrado contra la grilla; textos y marcas caen en su lugar

## 4. Flujo de emisión en la ficha

- [x] 4.1 Botón "Autorizaciones y certificados" en la ficha + drawer cliente con `dynamic import` (ssr:false), para no cargar los motores en la ficha de quien no emite
- [x] 4.2 Selección de tipo (4) + formulario de relleno: precarga de lo conocido, edición manual de todo, campos manuales para lo faltante (sector, comuna, color, datos del vet), y validación de requeridos
- [x] 4.3 Generar → imprimir/descargar: autorizaciones vía `AutorizacionDoc`; microchip vía `microchip-overlay`
- [x] 4.4 Server action que registra la emisión en `documentos_emitidos` (tipo, paciente, dueño, emisor, fecha, snapshot de datos) al generar
- [x] 4.5 Historial de documentos emitidos del paciente (tipo + fecha), solo-staff

## 5. Verificación

- [x] 5.1 `npm run build` pasa; la ficha (`/pacientes/[id]`) no engorda (react-pdf y pdf-lib quedan en chunks diferidos)
- [x] 5.2 Navegador: generar cada autorización (eutanasia/cirugía/hospitalización) con datos precargados + manuales e imprimir
- [x] 5.3 Navegador: el certificado de microchip queda alineado sobre el formulario oficial (textos y marcas en su lugar)
- [x] 5.4 Cada emisión queda registrada y aparece en el historial de documentos emitidos del paciente (migración `documentos_emitidos` aplicada)
