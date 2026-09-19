# Proposal

## Why

Se generó un design system nuevo (paleta tierra/musgo, logo y mockups de 4 pantallas) a partir de la descripción actual de VetApp, pensado para Clínica Salud Animal Pradera (CSAP). Se quiere adoptar ese lenguaje visual en la app real, reemplazando el teal/slate genérico actual, sin esperar a construir las funcionalidades que los mockups insinúan pero que hoy no existen en el modelo de datos.

## What Changes

- Los roles de color semánticos de `ui-design-system` (`--color-accent`, etc.) pasan de la paleta teal/slate a la paleta CSAP (musgo oscuro, tierra, musgo claro, neutro cálido). Se agregan dos roles de acento nuevos (`secondary`, `tertiary`) y se formaliza un rol `warning` (ámbar) que hoy solo existe como clase suelta en algunas pantallas.
- Se define un par tipográfico con nombre (headline / body) con fallback real, y se cablea de verdad — hoy se cargan fuentes Geist que ningún estilo llega a aplicar.
- Los íconos de la navegación primaria y acciones dejan de ser emoji nativos y pasan a un set de íconos de línea consistente, coloreado desde los tokens.
- El header/riel de la app y la pantalla de login dejan de mostrar el nombre "VetApp" fijo: leen `nombre_clinica` y `logo_url` desde `clinica_config` (el mismo dato que ya alimenta los documentos PDF), poblado con los datos reales de CSAP Pradera. El login, por tener más espacio, muestra el logo completo (isotipo + wordmark); el header/riel usa solo el nombre de la clínica en texto.
- Se hace un barrido de las pantallas que hoy fijan color a mano con clases Tailwind literales (`slate-*`, `teal-*`, `amber-*`, `red-*` fuera de los tokens) para que consuman los roles semánticos o las primitivas `Button`/`Card`, en vez de recolorear pantalla por pantalla.
- Reflow visual (no funcional) de ficha de paciente, dashboard, agenda y reservas para acercar la composición a los mockups, usando exclusivamente datos que ya existen hoy (p. ej. `peso_kg` y `temperatura_c` de `Consulta` para una evolución de peso/temperatura; conteos reales de citas, vacunas y reservas para el dashboard).
- **Fuera de alcance** (quedan registrados como gaps, no se implementan): asignación de box/turno, signos vitales estructurados completos (FC, FR, mucosas, TLLC, condición corporal), campo de alergias, recordatorios de salud como entidad propia, sala de espera en vivo, motor de sugerencia de horario/box en Reservas, sensor de refrigerador, métricas de ocupación, plantillas de WhatsApp automatizadas, búsqueda tipo Cmd+K, y el estado "reprogramada" en citas.
- **BREAKING**: el campo `emoji` de `NavDestino` (`src/components/primary-nav/destinos.ts`) deja de usarse como está; los destinos de navegación pasan a referenciar un ícono del nuevo set en vez de un string de emoji.

## Capabilities

### New Capabilities

- `clinic-branding-display`: cómo el nombre y el logo de la clínica, ya almacenados en `clinica_config`, se muestran dinámicamente en el chrome de la app (header/riel) y en la pantalla de login, en lugar de un nombre de aplicación fijo.

### Modified Capabilities

- `ui-design-system`: paleta de roles semánticos reemplazada por la de CSAP Pradera; se agregan los roles `secondary`, `tertiary` y `warning`; se agrega un requisito de pareja tipográfica con nombre y fallback; se agrega un requisito de set de íconos como primitiva (reemplaza emoji).

## Impact

- **Tokens y config visual**: `src/app/globals.css` (variables de color), `tailwind.config.ts` (si se agregan nuevos roles a `theme.extend.colors`), `src/app/layout.tsx` (carga de fuentes: se retira Geist sin uso, se agregan las nuevas), `src/app/fonts/` (assets de fuentes).
- **Primitivas**: `src/components/button.tsx`, `src/components/card.tsx` (sin cambios de API, solo quedan pintadas por los tokens nuevos); `src/components/primary-nav/` (`destinos.ts` cambia el campo `emoji` por referencia a ícono; `primary-nav.tsx` renderiza íconos en vez de emoji).
- **Nueva dependencia**: una librería de íconos de línea (p. ej. `lucide-react`).
- **Marca dinámica**: `src/app/(staff)/layout.tsx`, `src/app/portal/layout.tsx` (dejan de pasar `titulo="VetApp"` fijo), `src/app/login/page.tsx` (agrega logo completo), `src/app/layout.tsx` / `manifest.json` / íconos PWA (metadata de nombre de aplicación).
- **Barrido de estilos sueltos**: pantallas listadas en el design.md que hoy usan `slate-*`/`teal-*`/`amber-*`/`red-*` literales (ficha de paciente y sus tabs, export panel, dashboard, vacunas, agenda, reservas, portal) — se migran a clases de token o a las primitivas existentes.
- **Reflow de datos reales**: consultas de datos ya existentes (`peso_kg`, `temperatura_c` de `Consulta`; conteos de `citas`, `vacunas`, `reservas`) reutilizadas en nuevas composiciones visuales, sin nuevas columnas ni tablas.
- **No afecta**: esquema de base de datos, RLS, rutas/API, `responsive-ui` (los tramos, la barra inferior vs. riel y el comportamiento de colapso no cambian, solo su pintura).
