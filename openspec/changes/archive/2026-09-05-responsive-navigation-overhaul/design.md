## Context

Ver `proposal.md` — Why. Estado actual relevante:

- **Stack**: Next.js 14.2 App Router, React 18, Tailwind CSS 3.4, PWA (`@ducanh2912/next-pwa`). Sin librería de componentes ni de tokens.
- **Responsive hoy**: un solo corte, el `sm:` de Tailwind (640px). `src/app/(staff)/layout.tsx` y `src/app/portal/layout.tsx` renderizan `<BottomNav>` con `sm:hidden` y una barra superior con `hidden sm:block`. No hay nada entre 640px y el escritorio.
- **Navegación staff**: `nav-links.tsx` (barra superior) y `bottom-nav.tsx` (inferior, con menú "Más" para secundarios y badge de reservas). Los destinos y la lógica de "activo"/badges están duplicados entre ambos.
- **Navegación portal**: `portal/bottom-nav.tsx` (inferior). El header del portal no tiene enlaces de sección en escritorio, solo el 🔔.
- **Tokens ad hoc**: `globals.css` define `--background`/`--foreground` y utilidades de safe-area (`pt-safe`, `px-safe`, `pb-bottomnav`). El resto es Tailwind suelto por pantalla (`teal-700`, `slate-*`, `rounded-lg`, `px-3 py-2`, ...).
- **Contenedor**: `main` con `max-w-5xl` (staff) / `max-w-3xl` (portal) + `pb-bottomnav`.
- **Precedente de persistencia cliente**: `src/lib/recent.ts` usa `localStorage` con guardas try/catch.

## Goals / Non-Goals

**Goals:**

- Formalizar los tres tramos (teléfono/tablet/escritorio) en un solo lugar y consumirlos desde navegación, contenedor y densidad.
- Un único origen de verdad para los destinos de navegación (staff y portal), renderizado como barra inferior en teléfono y como riel lateral en tablet/escritorio.
- Riel lateral colapsable con estado persistido por dispositivo.
- Capa de tokens semánticos (color, tipografía en `rem`, espaciado, radio, elevación, área táctil) sobre la paleta actual, más un set mínimo de primitivas.
- Adopción incremental: la app sigue funcionando en cada paso; ninguna pantalla queda a medio migrar de forma visible.

**Non-Goals:**

- Cambiar la identidad visual (paleta, tipo de letra, "voz" visual). Se mantiene teal/slate.
- Introducir una librería de componentes o de estilos (Radix, shadcn, CVA, etc.) o un runtime CSS-in-JS.
- Migrar todas las pantallas a primitivas en este cambio; se cubren layout, navegación y las vistas de lista/tabla de mayor tráfico, y se deja el resto para adopción continua.
- Cambios de rutas, datos, RLS, PWA/manifest o comportamiento offline.
- Modo oscuro (fuera de alcance; los roles de color se definen de forma que no lo bloqueen a futuro).

## Decisions

### D1: Tramos como breakpoints con nombre en Tailwind, no media queries sueltas

`tailwind.config.ts` define `screens: { tablet: '640px', desktop: '1024px' }` (se conservan los `sm/md/lg` por compatibilidad durante la migración). El tramo teléfono es "sin prefijo". Las clases pasan a `tablet:` / `desktop:` para que el corte sea legible y único.

- **Por qué**: el proyecto ya vive en utilidades Tailwind; nombrar breakpoints da el vocabulario compartido que pide `ui-design-system` sin añadir maquinaria.
- **Alternativas**: (a) hook `useBreakpoint()` con `matchMedia` — hace la navegación dependiente de JS y añade parpadeo en SSR/PWA; se usa solo donde de verdad haga falta lógica JS (estado del riel), no para mostrar/ocultar. (b) Container queries — soporte y modelo mental más nuevos, innecesario para tres tramos globales.

### D2: `<PrimaryNav>` único con dos presentaciones dirigidas por CSS

Un solo componente define la lista de destinos (con `icon`, `label`, `href`, `match`, `badge`) y la lógica de activo/badge una sola vez. Renderiza **ambos** árboles y deja que CSS decida cuál se ve: barra inferior con `tablet:hidden`, riel con `hidden tablet:flex`. El estado de badges (reservas pendientes, no leídas) sigue llegando por props desde el layout server component, como hoy.

- **Por qué**: elimina la duplicación actual entre `nav-links` y `bottom-nav`; garantiza la paridad que exige la spec por construcción; sin dependencia de JS para elegir presentación (sin flash en PWA).
- **Coste**: se montan ambos árboles; es marcado trivial (una lista de enlaces) y se evita el salto visual. Aceptable.
- **Alternativa**: elegir en runtime con `matchMedia` — rechazada por flash de hidratación y peor comportamiento en arranque standalone.

### D3: El riel es un `<aside>` en el layout; el contenido es su hermano flex

Los layouts pasan de `max-w` centrado a un contenedor flex: `<aside>` (riel) + `<main>` que ocupa el resto. El ancho del riel se controla con una variable CSS (`--rail-w`) que cambia entre expandido (`~15rem`) y colapsado (`~3.5rem`); `main` usa `min-width: 0` para no desbordar. En teléfono el `<aside>` no se muestra y `main` recupera el `pb-bottomnav` para la barra inferior.

- **Por qué**: el riel "empuja" el contenido en vez de flotar sobre él (lo que pide la spec: no tapar permanentemente). Layout puramente CSS, un solo lugar por superficie.
- **Lectura cómoda**: `main` no lleva `max-w`; las **vistas de texto largo** (ficha impresa en pantalla, detalle de consulta, formularios de una columna) envuelven su contenido en un `Prose`/contenedor con `max-w` de medida de lectura (~72ch). Las listas y tablas usan todo el ancho.

### D4: Estado del riel — cookie legible en el servidor, no solo `localStorage`

El toggle colapsar/expandir persiste en una cookie (`rail=collapsed|expanded`, 1 año, `SameSite=Lax`). El layout (server component) la lee con `cookies()` y renderiza el riel ya en el estado correcto (clase inicial + `--rail-w`), evitando el salto. Un pequeño client component hace el toggle: actualiza la cookie (`document.cookie`) y la clase en el contenedor, sin recargar.

- **Por qué**: `localStorage` no es visible en SSR y produciría un frame con el riel en el estado por defecto antes de corregirse — molesto en cada navegación. La cookie es diminuta y ya usamos cookies (Supabase SSR).
- **Alternativa**: `localStorage` + script bloqueante en `<head>` — más frágil y contrario al modelo App Router. Cookie es más simple.
- **Default**: sin cookie → expandido en escritorio, colapsado en tablet (mejor uso del ancho en pantallas medianas).

### D5: Tokens como variables CSS en `:root`, mapeadas en el theme de Tailwind

`globals.css` define los roles bajo `:root`: `--color-surface`, `--color-surface-raised`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-on-accent`, `--color-danger`, `--color-badge`; escala de espaciado/radio/elevación; `--tap-min: 2.75rem` (44px), `--tap-comfortable: 3rem`. `tailwind.config.ts` mapea estos a `theme.extend.colors` (`surface`, `accent`, ...), `borderRadius`, `boxShadow`, `spacing` (`tap`, `tap-lg`). Tipografía: `theme.extend.fontSize` con pasos con nombre (`body`, `support`, `section`, `page`) en `rem`.

- **Por qué**: variables CSS = un solo lugar para la paleta y compatibilidad futura con temas; el mapeo a Tailwind deja que las pantallas sigan escribiendo utilidades (`bg-surface`, `text-accent`, `rounded-card`). Sin runtime nuevo.
- **`rem` y preferencia del sistema**: no fijar `font-size` en el `html` en `px`; los pasos son `rem`, así respetan el ajuste del navegador/SO (requisito de `ui-design-system`).
- **Alternativa**: solo clases Tailwind arbitrarias — es el estado actual, no cumple "un ajuste global en un solo lugar".

### D6: Primitivas mínimas en `src/components/`, sin librería

`Button` (variantes `primary`/`secondary`/`danger`/`ghost`, tamaños que respetan `--tap-min`), `Card`, `Field` (label + control + error, área táctil correcta), y se refactoriza el `action-menu.tsx` existente para consumir tokens. Composición con `clsx`-style helper local o template strings; sin CVA ni dependencias.

- **Por qué**: cubre el 80% de los patrones repetidos; el catálogo chico se mantiene a mano sin coste de dependencia.
- **Adopción**: se migran layout + navegación + `pacientes` y `agenda` (listas de mayor tráfico) y el portal; el resto queda como deuda de adopción, rastreada en tasks.

### D7: Densidad adaptativa por tramo con un tope inferior duro

Listas y filas exponen una variante compacta en `tablet:`/`desktop:` (menos padding vertical, filas más juntas), pero todo control accionable conserva un objetivo de `--tap-min` vía área táctil (padding + `::before` extendido o `min-h`/`min-w`), aunque el elemento visible sea más chico.

- **Por qué**: aprovecha el ancho/resolución de tablet y escritorio sin romper el requisito de área táctil en ningún tramo.

## Risks / Trade-offs

- **Regresión visual por el cambio de contenedor** (de `max-w` centrado a ancho completo junto al riel) → migrar layout + vistas de lista primero; revisar cada superficie en teléfono, tablet vertical, tablet horizontal y escritorio antes de dar por hecha la pantalla; mantener `max-w` de lectura en vistas de texto.
- **App a medio migrar** (pantallas nuevas con tokens conviviendo con pantallas viejas) → los tokens se mapean a los mismos valores actuales (teal-700 = `--color-accent`, etc.), así que lo no migrado se ve igual; la migración no cambia píxeles hasta que se decida.
- **Doble árbol de navegación (D2)** monta marcado que no se ve → es una lista de enlaces, coste despreciable; se prefiere a un flash de hidratación.
- **Cookie del riel (D4)** añade una cookie más a cada request → ~20 bytes, `SameSite=Lax`, sin PII; irrelevante frente a las de Supabase.
- **`tablet:`/`desktop:` conviviendo con `sm:`/`md:`/`lg:` durante la migración** → confuso si se estanca; tasks incluye un paso final de barrido para eliminar los prefijos viejos en las superficies migradas.
- **Tablet en horizontal ≈ escritorio angosto**: el riel expandido puede comer demasiado ancho → default colapsado en tramo tablet (D4) y el usuario decide.
- **PWA en caché**: cambios de CSS/manifest pueden servirse viejos tras el deploy → confiar en el `revalidate` del service worker de `next-pwa` ya configurado; probar con recarga forzada tras publicar.

## Migration Plan

1. **Tokens sin efecto visible**: añadir variables CSS y mapeo en `tailwind.config.ts` con valores idénticos a los actuales. Añadir `screens` con nombre. Nada cambia en pantalla.
2. **Primitivas**: crear `Button`/`Card`/`Field`; refactor de `action-menu` a tokens. Sin adopción todavía.
3. **`<PrimaryNav>` unificado**: extraer la lista de destinos y la lógica activo/badge; reimplementar la barra inferior actual sobre él (paridad con hoy, sin riel aún). Verificar teléfono.
4. **Riel lateral + layout flex** en `(staff)/layout.tsx`: `<aside>` con estados expandido/colapsado, cookie `rail`, toggle client component, contenedor flex, `main` con `min-width:0`. Verificar los tres tramos.
5. **Mismo riel en `portal/layout.tsx`** con los destinos del portal y el badge de no leídas.
6. **Contenedor adaptativo**: quitar `max-w` de `main`; envolver vistas de texto largo en contenedor de medida de lectura.
7. **Adopción**: migrar `pacientes` (lista + card) y `agenda` a primitivas + densidad adaptativa; luego portal.
8. **Barrido**: eliminar `nav-links.tsx` viejo si queda sin uso; reemplazar `sm:`/`md:`/`lg:` por `tablet:`/`desktop:` en las superficies migradas; revisar `pb-bottomnav` (solo aplica en tramo teléfono ahora).

**Rollback**: cada paso es un commit independiente y reversible. Los pasos 1–2 son inertes. Revertir el paso 4/5 restaura los layouts previos sin tocar datos. No hay migración de datos ni de esquema.

## Open Questions

- Iconografía del riel: ¿se mantienen los emojis actuales (🏠🐾📅🔔) o se pasa a un set SVG monocromo? No cambia specs ni tareas; se puede decidir en implementación o en un cambio posterior. Por defecto se mantienen los emojis para no ampliar alcance.
- ¿El riel expandido debe poder "fijarse" abierto sobre el contenido en escritorio ancho (>1440px) como panel permanente sin toggle? Se asume que no; el toggle cubre todos los casos.
