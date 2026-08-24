## 1. Componente de menú

- [x] 1.1 `ActionMenu` (kebab "⋯") cliente reutilizable: botón con target ≥44px, hoja con acciones `{ label, onClick, danger? }` o link; cierra al elegir o al hacer clic fuera; se posiciona sin salirse de pantalla

## 2. Filas densas → kebab

- [x] 2.1 Dueños (`manage-duenos`): dejar *Editar* visible; mover Marcar principal, Quitar, Invitar/Revocar al `ActionMenu`
- [x] 2.2 Agenda (`cita-actions`): dejar visible la acción positiva (Iniciar consulta); mover Confirmar, No asistió y Cancelar al `ActionMenu`
- [x] 2.3 Admin usuarios y sucursales: *Editar* visible; Eliminar/Desactivar en el `ActionMenu`

## 3. Targets y clusters restantes

- [x] 3.1 Reservas (`solicitud-actions`): apilar en móvil (`flex-col`) la fecha/hora y los botones, con botones ≥44px
- [x] 3.2 Agenda nav (← Hoy →): agrandar los botones a target táctil cómodo (`h-10 min-w-10`)
- [x] 3.3 Exámenes y acciones de receta (Imprimir/Anular, Abrir/Eliminar): padding para target ≥44px

## 4. Verificación

- [x] 4.1 `npm run build` pasa
- [x] 4.2 En viewport móvil (DevTools): filas de dueños/agenda muestran acción primaria + "⋯"; el menú abre/cierra; las acciones se tocan cómodas; reservas apila bien
