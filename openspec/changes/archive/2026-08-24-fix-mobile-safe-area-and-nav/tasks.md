## 1. Safe-area

- [x] 1.1 Agregar `viewport-fit: "cover"` al `viewport` en `src/app/layout.tsx`
- [x] 1.2 Agregar utilidades de safe-area en `globals.css` (`env(safe-area-inset-*)`): padding superior, inferior y lateral, más una utilidad para ocultar scrollbar
- [x] 1.3 Aplicar inset superior al header fijo y lateral al contenedor en `(staff)/layout.tsx`; inset inferior al `main`
- [x] 1.4 Aplicar los mismos insets en `portal/layout.tsx` (header + main)

## 2. Navegación móvil

- [x] 2.1 Hacer scrollable el contenedor del nav móvil (`overflow-x-auto`, `flex-nowrap`, sin barra de scroll) para que no se desborde ni corte la página (ítems con `shrink-0` para que desborden en vez de comprimirse)
- [x] 2.2 Pasar `reservasPendientes` y `esDev` a la instancia móvil de `NavLinks` en `(staff)/layout.tsx`

## 3. Verificación

- [x] 3.1 `npm run build` pasa (y las utilidades safe-area quedan en el CSS compilado, sin purge)
- [X] 3.2 En viewport móvil (DevTools): la nav del staff se desplaza sin cortar la página; el badge de reservas y el enlace Admin (rol dev) aparecen en móvil
- [X] 3.3 Simular standalone con notch (DevTools device / dispositivo real): el header despeja el notch y el contenido despeja el indicador inferior
