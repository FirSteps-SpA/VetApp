# Tasks

## 1. Tokens y paleta base

- [x] 1.1 Actualizar las variables de color en `src/app/globals.css` a los valores de la Decisión 1 del design (`--color-accent`, `--color-accent-secondary`, `--color-accent-tertiary`, `--color-warning`, `--color-surface-sunken`, `--color-border`, `--color-text`, `--color-text-muted`) y verificar que `npm run dev` levanta sin errores, con `Button`/`Card`/`PrimaryNav` ya mostrando el acento nuevo.
- [x] 1.2 Verificar contraste AA (texto sobre superficie, texto sobre acento, borde sobre superficie) con una herramienta de contraste; si algún valor falla, ajustar solo luminosidad sin cambiar el matiz.
- [x] 1.3 Agregar `accent-secondary`, `accent-tertiary` y `warning` a `theme.extend.colors` en `tailwind.config.ts` y verificar que las clases `bg-accent-secondary`, `text-warning`, etc. compilan.
- [x] 1.4 Actualizar `themeColor` en el `viewport` export de `src/app/layout.tsx` al nuevo acento y verificar el color de la barra del navegador/PWA.

## 2. Tipografía

- [x] 2.1 Reemplazar la carga de Geist por `next/font/google` (Manrope para titular, Plus Jakarta Sans para cuerpo) en `src/app/layout.tsx`, exponiendo `--font-display` y `--font-body`.
- [x] 2.2 Registrar `fontFamily.display` / `fontFamily.body` en `tailwind.config.ts` y aplicar `body` (cuerpo) y encabezados (titular) en `globals.css`.
- [x] 2.3 Eliminar `src/app/fonts/GeistVF.woff` y `GeistMonoVF.woff` y cualquier referencia restante; verificar que el build no advierte de archivos faltantes.
- [x] 2.4 Verificar en DevTools (computed styles) que un encabezado y un párrafo de `/dashboard` usan las fuentes nuevas con su fallback declarado.

## 3. Set de íconos

- [x] 3.1 Agregar `lucide-react` a `package.json` y verificar `npm install` sin conflictos de versión.
- [x] 3.2 Cambiar `NavDestino.emoji: string` por `NavDestino.icon: LucideIcon` en `src/components/primary-nav/destinos.ts` (`staffDestinos` y `portalDestinos`), eligiendo el ícono equivalente a cada emoji actual (home, paw-print, calendar-days, bell, syringe, user, settings).
- [x] 3.3 Agregar `badgeTone?: "danger" | "warning"` a `NavDestino` y asignarlo por destino (p. ej. reservas → `warning`, vacunas → `danger`, default `danger` si no se especifica).
- [x] 3.4 Actualizar `src/components/primary-nav/primary-nav.tsx` (`BottomBar`, `Rail`, `Dot`) para renderizar el componente de ícono en vez del emoji, y para que `Dot` use `bg-danger`/`bg-warning` según `badgeTone`.
- [x] 3.5 Verificar visualmente la barra inferior y el riel en `/dashboard` y `/portal`, en los tres tramos responsivos, mostrando íconos de línea coloreados por token y badges con el tono correcto.

## 4. Marca dinámica

- [x] 4.1 Leer `clinica_config` (`nombre_clinica`, `logo_url`) en `src/app/(staff)/layout.tsx` y `src/app/portal/layout.tsx`, y pasar el nombre real a `PrimaryNav` en vez del string fijo `"VetApp"`; verificar que header y riel muestran el nombre real de la clínica.
- [x] 4.2 Aplicar un nombre de repuesto cuando `nombre_clinica` esté vacío y verificar con una config sin nombre configurado que el chrome no queda en blanco.
- [x] 4.3 Actualizar `src/app/login/page.tsx` para mostrar `logo_url` a tamaño grande cuando exista, con fallback al nombre en texto; verificar ambos casos (con y sin logo configurado).
- [x] 4.4 Actualizar `public/manifest.json` (`name`/`short_name`) y la metadata de `src/app/layout.tsx` a la marca de la clínica; verificar que la app sigue siendo instalable como PWA.
- [x] 4.5 Regenerar los íconos PWA (`npm run gen:icons` o reemplazo manual en `public/icons/`) con el logo y color nuevos; verificar que los archivos se actualizan y el manifest los referencia.

## 5. Rol de aviso (warning)

- [x] 5.1 Reemplazar los usos ad-hoc de `amber-700`/`amber-100` (dashboard, `vacunas-tab.tsx`, `ESTADOS_CITA`) por el rol `warning` recién formalizado; verificar que ambos puntos usan el mismo token y se ven idénticos entre sí.

## 6. Sweep de pantallas (clases literales → tokens/primitivas)

- [x] 6.1 `dashboard/page.tsx`: reemplazar clases `slate-*`/`teal-*`/`red-*`/`amber-*` por tokens o `Button`/`Card`; verificar visualmente `/dashboard`.
- [x] 6.2 `vacunas/page.tsx`: ídem; verificar `/vacunas`.
- [x] 6.3 `pacientes/paciente-card.tsx`, `search-bar.tsx`, `recientes.tsx`: ídem; verificar `/pacientes`.
- [x] 6.4 `pacientes/[id]/page.tsx` (encabezado de ficha) y `tabs.tsx`: ídem; verificar la ficha de un paciente existente.
- [x] 6.5 `pacientes/[id]/consultas/**` (`nueva-consulta-drawer.tsx`, `[cId]/page.tsx`, `[cId]/editar/edit-consulta-form.tsx`, `anular-receta-button.tsx`): ídem; verificar crear, ver, editar y anular una consulta/receta.
- [x] 6.6 `pacientes/[id]/examenes/examenes-tab.tsx`, `duenos/**`, `documentos/**`, `vacunas/vacunas-tab.tsx`: ídem; verificar cada tab de la ficha.
- [x] 6.7 `pacientes/[id]/export/export-panel.tsx`, `export-button.tsx`, `print/**`: ídem; verificar el panel de exportación y la vista de impresión.
- [x] 6.8 `agenda/page.tsx`, `agenda/nueva-cita/**`, `cita-actions.tsx`: ídem; verificar `/agenda`.
- [x] 6.9 `reservas/page.tsx`, `solicitud-actions.tsx`: ídem; verificar `/reservas`.
- [x] 6.10 `admin/**` (clínica, usuarios) y `perfil/**`: ídem; verificar `/admin` y `/perfil`.
- [x] 6.11 `ESTADOS_CITA` en `src/lib/types/db.ts`: reemplazar las clases Tailwind hardcodeadas por clases de token; verificar que agenda y reservas siguen mostrando cada estado con un color distinguible entre sí.
- [x] 6.12 `portal/**` (`page.tsx`, `mascotas/**`, `citas/**`, `notificaciones/**`): ídem; verificar cada vista del portal.

## 7. Reflow de composición (solo con datos existentes)

- [x] 7.1 Ficha de paciente: reorganizar a layout de dos columnas (contenido principal + panel lateral) reutilizando los datos ya disponibles; agregar un sparkline SVG de `peso_kg` y otro de `temperatura_c` a partir del historial de `Consulta` del paciente; verificar con un paciente que tenga varias consultas registradas.
- [x] 7.2 Dashboard: reflow a tiles de estadística con los conteos que ya se calculan hoy (citas de hoy, vacunas por vencer, reservas pendientes, recetas emitidas); verificar que los números coinciden con los que mostraba la versión anterior.
- [x] 7.3 Agenda: reflow de la vista actual a una grilla semanal con panel de detalle de la cita seleccionada, usando las citas ya existentes; verificar la navegación entre semanas y que ninguna cita deja de mostrarse.
- [x] 7.4 Reservas: reflow a lista con pestañas por `EstadoCita` real (pendientes/confirmadas/canceladas/no asistió) y panel de detalle; verificar que la pestaña "Reprogramadas" no se construye (gap documentado) y que aceptar/rechazar una solicitud sigue funcionando.

## 8. Verificación final

- [x] 8.1 Recorrer manualmente el flujo staff completo (dashboard → paciente → consulta → receta → PDF) y el flujo portal (login → mis mascotas → citas) en los tres tramos responsivos; correr `grep -rnE "slate-|teal-[0-9]|amber-[0-9]" src` y confirmar que no quedan coincidencias fuera de casos justificados; correr `npm run build` sin errores.
- [x] 8.2 Confirmar que ninguno de los gaps listados en el proposal (boxes, signos vitales completos, alergias, recordatorios de salud, sala de espera, sugerencia de horario/box, sensor de refrigerador, métricas de ocupación, plantillas de WhatsApp, búsqueda Cmd+K, estado "reprogramada") quedó implementado, ni siquiera parcialmente.
