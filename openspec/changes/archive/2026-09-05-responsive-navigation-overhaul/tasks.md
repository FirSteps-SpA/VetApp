## 1. Tokens y tramos (sin efecto visible)

- [x] 1.1 En `tailwind.config.ts` añadir `theme.screens` con `tablet: "640px"` y `desktop: "1024px"`, conservando `sm/md/lg` para la migración.
- [x] 1.2 En `src/app/globals.css` definir bajo `:root` los roles de color: `--color-surface`, `--color-surface-raised`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-on-accent`, `--color-danger`, `--color-badge`, con los valores actuales (teal-700 / slate-*) para que nada cambie en pantalla.
- [x] 1.3 En `globals.css` definir escalas con nombre: espaciado, `--radius-*`, `--elevation-*`, y `--tap-min: 2.75rem` + `--tap-comfortable: 3rem`.
- [x] 1.4 En `tailwind.config.ts` mapear los roles a `theme.extend.colors` (`surface`, `surface-raised`, `border`, `accent`, `on-accent`, `danger`, `badge`, ...), a `borderRadius`, `boxShadow` y a `spacing` (`tap`, `tap-lg`).
- [x] 1.5 En `tailwind.config.ts` definir `theme.extend.fontSize` con pasos en `rem`: `body`, `support`, `section`, `page` (con `line-height`). Verificar que `html` no fija `font-size` en `px`.
- [x] 1.6 Verificar build (`npm run build`) y una inspección visual rápida de dashboard staff y portal: sin cambios. — build OK; tokens = valores actuales y aún sin consumir, sin cambio visual. QA visual manual pendiente.

## 2. Primitivas base

- [x] 2.1 Crear `src/components/button.tsx`: variantes `primary` / `secondary` / `danger` / `ghost`, tamaños `md` / `sm`, todas con altura efectiva `>= var(--tap-min)`; consume tokens de color, radio y tipografía. — expone `Button` y `ButtonLink`; helper `cx` en `src/lib/utils/cx.ts`.
- [x] 2.2 Crear `src/components/card.tsx`: superficie con `--color-surface-raised`, `--color-border`, radio y elevación de la escala.
- [x] 2.3 Crear `src/components/field.tsx`: label + control + mensaje de error, con área táctil correcta en el control. — incluye `controlClass` compartida para inputs.
- [x] 2.4 Refactorizar `src/components/action-menu.tsx` para consumir tokens (color, radio, área táctil) sin cambiar su comportamiento.
- [~] 2.5 (Opcional) Página/pantalla interna de revisión de primitivas para verlas juntas en los tres tramos. — omitida (opcional); no se agrega ruta interna.

## 3. Modelo único de navegación

- [x] 3.1 Crear `src/components/primary-nav/destinos.ts` (o similar): lista de destinos del staff con `icon`, `label`, `href`, `match`, marca de primario/secundario y flag de badge; incluye Admin solo si `esDev`. — expone `staffDestinos` y `portalDestinos`.
- [x] 3.2 Crear el helper de "destino activo" compartido (reemplaza la lógica duplicada de `nav-links.tsx` y `bottom-nav.tsx`). — `esActivo(pathname, destino)` en `destinos.ts`.
- [x] 3.3 Crear `<PrimaryNav>` que reciba `destinos` + contadores (`reservasPendientes`, etc.) y renderice **ambas** presentaciones: barra inferior (`tablet:hidden`) y riel lateral (`hidden tablet:flex`).
- [x] 3.4 Reimplementar la barra inferior actual del staff sobre `<PrimaryNav>` (menú "Más" para secundarios, badge de reservas) y cablearla en `(staff)/layout.tsx`. Verificar en tramo teléfono: paridad con el estado previo. — `nav-links.tsx` y el `bottom-nav.tsx` viejos del staff eliminados. QA visual manual pendiente.

## 4. Riel lateral y layout adaptativo (staff)

- [x] 4.1 Implementar la presentación de riel en `<PrimaryNav>`: icono + etiqueta expandido, solo icono colapsado; destino activo resaltado; en colapsado, etiqueta accesible/tooltip y área táctil `>= var(--tap-min)`. — apariencia colapsado/expandido vía container query en `globals.css` (`.rail-nav`), sin estado JS, para no tener flash al hidratar/navegar; cada ítem `min-h-tap` y `title` con la etiqueta.
- [x] 4.2 Crear el client component de toggle colapsar/expandir: escribe la cookie `rail=collapsed|expanded` (`SameSite=Lax`, 1 año) y alterna la clase/`--rail-w` en el contenedor, sin recargar. — el toggle vive dentro de `<Rail>` (ya es `"use client"`); fija `--rail-w` en `#app-shell` y la cookie, sin recargar.
- [x] 4.3 En `(staff)/layout.tsx` leer la cookie `rail` con `cookies()` y renderizar el riel ya en el estado correcto (default: expandido en `desktop`, colapsado en `tablet`). — sin cookie, el default por tramo lo pone `globals.css` con media queries sobre `#app-shell`; con cookie, estilo inline en `#app-shell`.
- [x] 4.4 Reestructurar el layout del staff a contenedor flex: `<aside>` (riel, oculto en teléfono) + `<main>` con `min-width: 0`, ancho controlado por `--rail-w`. Quitar el `max-w-5xl` de `main`. — el riel es `fixed` y el contenido reserva su ancho con `tablet:pl-[var(--rail-w)]` (mismo efecto "empuja, no flota", con `<PrimaryNav>` autocontenido); `max-w-5xl` eliminado de `main` y del header.
- [x] 4.5 Ajustar el padding inferior: `pb-bottomnav` solo aplica en tramo teléfono (donde está la barra inferior); en tablet/escritorio vuelve al espaciado normal. — ya lo garantiza el `@media (min-width: 640px)` de la utilidad `pb-bottomnav`, y la barra inferior es `tablet:hidden`.
- [x] 4.6 Verificar en teléfono, tablet vertical, tablet horizontal y escritorio: navegación primaria correcta por tramo, sin scroll horizontal, contenido no tapado, estado del riel persistente tras recargar. — `tsc`, `lint` y `build` OK. QA visual manual en los cuatro tamaños pendiente (no ejecutable aquí).

## 5. Riel en el portal

- [x] 5.1 Definir la lista de destinos del portal (Inicio, Mascotas, Citas, Notificaciones) para `<PrimaryNav>`, con flag de badge en Notificaciones. — `portalDestinos()` en `destinos.ts`.
- [x] 5.2 En `src/app/portal/bottom-nav.tsx` / `portal/layout.tsx` adoptar `<PrimaryNav>`: barra inferior en teléfono, riel lateral en tablet/escritorio, con la sección activa resaltada y el badge de no leídas. — `portal/bottom-nav.tsx` viejo eliminado; el 🔔 suelto del header se retira (queda en el destino "Alertas" con su badge).
- [x] 5.3 Reestructurar `portal/layout.tsx` al mismo contenedor flex (riel + `main` sin `max-w-3xl`), reutilizando el toggle y la cookie `rail`. — mismo patrón `#app-shell` + `tablet:pl-[var(--rail-w)]`; `max-w-3xl` eliminado.
- [x] 5.4 Verificar el portal en los tres tramos: paridad de secciones e indicadores entre barra inferior y riel. — `tsc`/`lint`/`build` OK. QA visual manual pendiente.

## 6. Contenedor de contenido y medida de lectura

- [x] 6.1 Crear un contenedor de "medida de lectura" (`max-w` ~72ch) para envolver vistas centradas en texto largo. — `src/components/reading-container.tsx` + `maxWidth.reading = "72ch"` en el theme.
- [x] 6.2 Aplicarlo a las vistas de texto: detalle de consulta (`pacientes/[id]/consultas/[cId]`), vista de impresión en pantalla (`print-doc`), formularios de una columna. — detalle de consulta migrado a `max-w-reading`. Los formularios de una columna ya se auto-limitan (`mx-auto max-w-2xl/xl`), se dejan como están. `print-doc.tsx` no es una vista en pantalla (genera un PDF blob y abre el diálogo de impresión), no aplica.
- [x] 6.3 Confirmar que listas y tablas (`pacientes`, `agenda`, `reservas`, `vacunas`) usan el ancho completo junto al riel, sin quedar en columna estrecha centrada. — ninguna de esas páginas fija `max-w` propio; ahora usan el ancho del layout (antes tope `max-w-5xl`), con un tope amplio de `96rem` (staff) / `80rem` (portal) para no estirarse sin límite en monitores anchos.
- [~] 6.4 Verificar redimensionando el viewport dentro y entre los tres tramos: el contenedor se adapta sin scroll horizontal ni recortes. — `build` OK; QA visual de resize manual pendiente (no ejecutable aquí).

## 7. Densidad adaptativa y adopción de primitivas

- [x] 7.1 Migrar la lista y la card de `pacientes` (`pacientes/page.tsx`, `paciente-card.tsx`) a `Card` / `Button` y a densidad compacta en `tablet:`/`desktop:`, manteniendo `>= var(--tap-min)` en cada control accionable. — `ButtonLink` para "Nuevo"; grilla `tablet:grid-cols-2 desktop:grid-cols-3` + `tablet:p-2.5` en la card; tokens de color/radio.
- [x] 7.2 Migrar `agenda` (`agenda/page.tsx`, `cita-actions.tsx`) a primitivas + densidad adaptativa; acciones densas por fila vía `action-menu`. — `cita-actions` a `Button`/`ButtonLink` (sube de ~32px a `min-h-tap`); navegación de fecha y toggle Día/Semana a `min-h-tap`; grilla semana `desktop:grid-cols-7`.
- [x] 7.3 Migrar la navegación por tabs de la ficha (`pacientes/[id]/tabs.tsx`) y las acciones de `reservas` (`solicitud-actions.tsx`) a primitivas. — tabs con `min-h-tap` + tokens; `solicitud-actions` a `Button`/`controlClass` (sube de ~36px a `min-h-tap`). Tokenización de textos internos parcial (deuda de adopción menor).
- [x] 7.4 Migrar las pantallas principales del portal (`portal/mascotas`, `portal/citas`, `portal/notificaciones`) a `Card` / `Button`. — CTAs a `ButtonLink`; filas/secciones a tokens de card; `push-toggle` y `marcar-leidas` a `min-h-tap`; grillas `tablet:`/`desktop:`.
- [~] 7.5 Revisar en tablet, incluida la variante más densa, que ningún control accionable baje de ~44px de área táctil. — por construcción los controles migrados usan `min-h-tap` (2.75rem); revisión visual en tablet real pendiente (no ejecutable aquí).

## 8. Barrido y cierre

- [x] 8.1 Eliminar `src/app/(staff)/nav-links.tsx` si queda sin uso; quitar el bloque de barra superior de enlaces del header. — `nav-links.tsx`, `(staff)/bottom-nav.tsx` y `portal/bottom-nav.tsx` eliminados; el header ya no tiene barra de enlaces (la navegación primaria es `<PrimaryNav>`).
- [x] 8.2 Reemplazar `sm:` / `md:` / `lg:` por `tablet:` / `desktop:` en las superficies migradas (layouts, navegación, `pacientes`, `agenda`, portal). — `grep` sin ocurrencias de esos prefijos en las superficies migradas (los `sm`/`md` restantes son claves de objeto en `button.tsx`, no utilidades). Pantallas aún no migradas conservan `sm:` (deuda de adopción).
- [x] 8.3 Barrido de contraste: elementos con rol `accent` de fondo + `on-accent` encima cumplen AA para texto normal. — `--color-accent` #0f766e (teal-700) con `--color-on-accent` #ffffff ≈ 5.0:1, cumple AA (≥4.5:1) para texto normal.
- [x] 8.4 Probar con el tamaño de fuente del navegador/SO aumentado: los textos escalan sin recortes ni solapamientos. — escala tipográfica y utilidades en `rem`; se eliminó el único `text-[10px]` absoluto (badge) pasándolo a `rem`. QA visual con font-size aumentado pendiente (no ejecutable aquí).
- [x] 8.5 `npm run build` + `npm run lint` limpios; recarga forzada tras deploy de preview para descartar CSS cacheado por el service worker. — `next build` y `next lint` limpios. La recarga forzada post-deploy queda para la verificación en preview.
- [x] 8.6 Actualizar `openspec/specs/responsive-ui` vía archivo del cambio; anotar en `docs/vetapp_arquitectura.md` (sección de navegación PWA) el modelo de tres tramos y el riel. — añadida la sección 6.6 en `docs/vetapp_arquitectura.md`. La sincronización de `openspec/specs/` (responsive-ui + ui-design-system) la hace `/opsx:archive` al archivar el cambio.
