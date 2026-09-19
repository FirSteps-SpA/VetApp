# Design

## Context

El sistema de tokens ya existe y funciona: `globals.css` define variables de color/radio/elevación/tap, `tailwind.config.ts` las expone como clases (`bg-accent`, `rounded-card`, `min-h-tap`...), y `Button`/`Card`/`PrimaryNav` las consumen. Repintar esas tres piezas alcanza a la navegación y a cualquier pantalla que ya use los tokens.

El problema es que buena parte de las pantallas (ficha de paciente y sus tabs, export panel, dashboard, vacunas, agenda, reservas, portal) no pasa por ahí: fija color con clases Tailwind literales (`slate-700`, `teal-700`, `amber-700`, `red-600`...) directamente en el JSX, incluso en un `Record` de datos (`ESTADOS_CITA` en `src/lib/types/db.ts` guarda clases de color como si fueran datos). Cambiar solo las variables no las toca.

Tampoco hay tipografía real hoy: `layout.tsx` carga fuentes Geist vía `next/font/local`, pero ningún `font-family` las aplica — el body renderiza con la sans-serif por defecto del navegador.

Los mockups de referencia (`ref/design-system/*.png`, `ref/colors.jpeg`, `ref/logo.jpeg`) muestran una composición de pantalla más rica que la actual (paneles laterales, timelines, gráficos), con datos que en su mayoría **sí existen** en el modelo (`Consulta.peso_kg`, `Consulta.temperatura_c`, conteos de `citas`/`vacunas`/`reservas`), salvo el subconjunto ya listado como gap en el proposal.

## Goals / Non-Goals

**Goals:**
- Repintar toda la app (staff + portal) con la paleta, tipografía, radios/sombras e iconografía de CSAP Pradera, a través de los tokens existentes.
- Cerrar la brecha entre pantallas y tokens: eliminar el uso de clases Tailwind literales fuera de la escala.
- Reflowear la composición de ficha de paciente, dashboard, agenda y reservas hacia lo que muestran los mockups, usando solo datos que el modelo ya expone.
- Mostrar la identidad real de la clínica (nombre/logo) en el chrome y en el login, leyendo la config existente.

**Non-Goals:**
- No se agregan campos, tablas ni endpoints nuevos (signos vitales completos, alergias, recordatorios, boxes, etc. quedan fuera — ver proposal).
- No se migra el set de íconos de especie (🐕🐈🦜🦎🐇🐾) que ya usa `ESPECIES` en `db.ts`: son pictogramas de contenido, no navegación/acción, y quedan fuera de esta pasada para no ampliar el radio del sweep.
- No se construye un `app/manifest.ts` dinámico por clínica; el `manifest.json` estático se actualiza a un valor razonable una vez, no se conecta a `clinica_config`.
- No se introduce una librería de gráficos para el sparkline de peso/temperatura (ver Decisión 5).
- No se toca `responsive-ui`: tramos, barra inferior vs. riel y su comportamiento de colapso no cambian.

## Decisions

### 1. Paleta: mapeo de roles a valores concretos

| Token | Valor actual | Valor nuevo | Origen |
|---|---|---|---|
| `--color-accent` | `#0f766e` (teal-700) | `#586345` | Primary (pallette.png) |
| `--color-accent-secondary` *(nuevo)* | — | `#95714F` | Secondary / Earth |
| `--color-accent-tertiary` *(nuevo)* | — | `#8C916C` | Tertiary / Moss |
| `--color-surface-sunken` (fondo de página) | `#f8fafc` | `#FAF9F6` | Neutral |
| `--color-surface` / `-raised` (cards) | `#ffffff` | `#ffffff` (sin cambio) | mockups mantienen cards blancas sobre fondo neutro |
| `--color-warning` *(nuevo)* | ad-hoc `amber-700` en 2 pantallas | `#B45309` | se formaliza el valor ya usado hoy, no se inventa uno nuevo |
| `--color-danger` | `#dc2626` | `#dc2626` (sin cambio) | ya coincide con el rojo del mockup |
| `--color-border`, `--color-text`, `--color-text-muted`, `*-subtle` | slate | derivados de la rampa de tinte de Primary/Neutral en `pallette.png` | a confirmar contraste AA antes de fijar el hex final (tarea de implementación, no decisión de diseño) |

`--color-badge` (contador numérico) se mantiene como rol propio, pero cada destino de navegación elige con qué rol semántico pintar su badge: el mockup muestra "Reservas" en ámbar (pendiente, no urgente) y "Vacunas" en rojo (vencido, urgente) — no un solo color de badge fijo. `destinos.ts` gana un campo `badgeTone?: "danger" | "warning"` (default `"danger"`, que es el comportamiento actual) en vez de fijar un único `--color-badge` para todo.

**Alternativa descartada**: mapear Secondary/Tertiary como simples variantes más claras/oscuras del acento único, sin roles propios. Se descarta porque el mockup los usa con propósito distinto (etiquetas de categoría vs. acento de acción) y la spec de `ui-design-system` ya pide que los roles reflejen intención, no solo tono.

### 2. Tipografía: next/font/google, no next/font/local

Se reemplaza la carga de Geist (no aplicada hoy) por `next/font/google` para Manrope (titular, pesos 600/700) y Plus Jakarta Sans (cuerpo, pesos 400/500/600). Next.js las auto-hospeda en build (sin llamada a CDN en runtime, igual de privado que el enfoque local actual). Se registran como `theme.extend.fontFamily.display` / `.body` en `tailwind.config.ts` y se aplican en `globals.css` (`body { font-family: ... }`, encabezados con la clase de titular). Los archivos `GeistVF.woff`/`GeistMonoVF.woff` se eliminan.

### 3. Iconos: `lucide-react`

Se agrega `lucide-react` (MIT, tree-shakeable, incluye `PawPrint`, `Home`, `CalendarDays`, `Bell`, `Syringe`, `User`, `Settings`) como dependencia. `NavDestino.emoji: string` pasa a `NavDestino.icon: LucideIcon` (referencia directa al componente, no un nombre string que haya que resolver). `PrimaryNav` renderiza `<Icon className="..." />` en vez de interpolar el emoji, tomando color de `text-accent` / `text-text-muted` como ya hace hoy con el texto.

**Alternativa descartada**: Heroicons — set más chico, sin ícono de huella/pata equivalente a `PawPrint`, que es central en la identidad de la app.

### 4. Marca dinámica sin nueva tabla

`clinica_config` ya tiene `nombre_clinica` y `logo_url`. `StaffLayout` y `PortalLayout` pasan a leerlo (una consulta más, sin cambio de esquema) y a pasarlo a `PrimaryNav` en vez del string fijo `"VetApp"`. El login (`src/app/login/page.tsx`) hace la misma lectura y muestra `logo_url` a tamaño grande cuando existe; si no, cae al nombre en texto (mismo patrón de fallback que ya usan los documentos PDF cuando no hay logo).

### 5. Evolución de peso/temperatura: SVG a mano, sin librería de charts

El historial de `Consulta.peso_kg` / `Consulta.temperatura_c` de un paciente son unos pocos puntos (típicamente < 20). Se dibuja un sparkline con un `<svg>` simple (polyline + puntos), igual de fácil de mantener y sin sumar una dependencia de charting para un caso tan chico.

### 6. Orden del barrido de pantallas

El barrido de clases literales se hace pantalla por pantalla, no en un solo diff, en este orden (de menor a mayor riesgo de regresión visual): `dashboard/page.tsx` → `vacunas/page.tsx` y `vacunas-tab.tsx` → `pacientes/paciente-card.tsx` y `search-bar.tsx` → `pacientes/[id]/page.tsx` y sus tabs (`consultas`, `examenes`, `duenos`, `documentos`) → `export-panel.tsx` → `agenda/*` → `reservas/*` → `portal/**`. Cada pantalla se verifica corriendo `npm run dev` antes de pasar a la siguiente, no solo con `next build`.

## Risks / Trade-offs

- **[Riesgo]** Tres acentos (primary/secondary/tertiary) sin uso claro pueden usarse de forma inconsistente pantalla por pantalla. → **[Mitigación]** El sweep documenta en cada PR/commit qué rol se usó y por qué; por defecto, toda acción primaria usa `accent`, y `secondary`/`tertiary` quedan reservados a los usos ya identificados en el mockup (tags de categoría, fondos sutiles).
- **[Riesgo]** El cambio de `NavDestino.emoji` a `.icon` es **breaking** para ambas listas de destinos (`staffDestinos`, `portalDestinos`) y para `PrimaryNav` a la vez. → **[Mitigación]** Se cambia en un solo commit atómico (tipo + ambas listas + renderer), no incrementalmente.
- **[Riesgo]** El sweep de ~30-50 archivos es la parte de mayor superficie de cambio y más fácil de introducir una regresión visual silenciosa. → **[Mitigación]** Orden por riesgo creciente (ver Decisión 6) y verificación visual en `npm run dev` por pantalla, no al final.
- **[Riesgo]** Los valores exactos de borde/texto derivados de la rampa de tinte del pallette pueden no pasar AA sobre el nuevo fondo neutro. → **[Mitigación]** Verificar contraste antes de fijarlos en `globals.css`; si falla, ajustar solo luminosidad, no el matiz.

## Migration Plan

Cambio puramente de frontend, sin migración de datos ni flags de feature (bajo riesgo de rollback: revertir commits). Orden de implementación:

1. Tokens (`globals.css`, `tailwind.config.ts`) — la navegación y las primitivas se repintan solas.
2. Tipografía (`layout.tsx`, retiro de Geist).
3. Set de íconos (`lucide-react`, `destinos.ts`, `primary-nav.tsx`) — cambio atómico.
4. Marca dinámica (`StaffLayout`, `PortalLayout`, `login/page.tsx`).
5. Sweep de pantallas, en el orden de la Decisión 6.
6. Reflow de composición (ficha, dashboard, agenda, reservas) sobre las pantallas ya migradas a tokens.
