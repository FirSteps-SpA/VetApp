## 1. Bottom nav del staff

- [x] 1.1 Componente cliente `BottomNav` (staff): ítems con emoji + label + estado activo (`usePathname`), badge en Reservas, y menú "Más" (Vacunas + Admin si dev) que se cierra al elegir o al hacer clic fuera
- [x] 1.2 En `(staff)/layout.tsx`: montar `BottomNav` (`sm:hidden`, fija abajo, `z-20`, `safe-area-inset-bottom`), pasarle `reservasPendientes` y `esDev`; quitar la fila de nav superior móvil; agregar padding inferior al `main` en móvil para que la barra no tape el contenido

## 2. Bottom nav del portal

- [x] 2.1 Componente cliente `BottomNav` del portal: Inicio, Mascotas, Citas, Notificaciones (con badge de no leídas), estado activo
- [x] 2.2 En `portal/layout.tsx`: montar la barra (`sm:hidden`, fija abajo, safe-area), pasarle `noLeidas`; padding inferior del `main` en móvil

## 3. Verificación

- [x] 3.1 `npm run build` pasa (y `pb-bottomnav` queda en el CSS compilado)
- [X] 3.2 En viewport móvil (DevTools): barra inferior visible en staff y portal, destino activo resaltado, "Más" abre/cierra con Vacunas y (dev) Admin, badges presentes, y el contenido no queda tapado por la barra
- [X] 3.3 Escritorio (sm+): sin barra inferior; la top nav intacta
