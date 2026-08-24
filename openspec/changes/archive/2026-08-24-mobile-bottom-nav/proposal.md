## Why

La Capa 1 evitó que la navegación móvil se desbordara, pero sigue siendo una barra superior con scroll horizontal: no es alcanzable con el pulgar ni es el patrón que la gente espera en el teléfono. El doc de arquitectura ya pedía una **bottom navigation bar** en móvil. Esta capa mueve la navegación primaria a una barra inferior (staff y portal), con un menú de desbordamiento para lo secundario.

## What Changes

- **Staff (móvil)**: se reemplaza la fila de navegación superior por una **barra inferior fija** con 4 destinos + "Más": 🏠 Inicio, 🐾 Pacientes, 📅 Agenda, 🔔 Reservas (con badge), ☰ **Más**. El menú "Más" contiene 💉 Vacunas y ⚙️ Admin (solo dev). *Salir* permanece en el header superior.
- **Portal (móvil)**: nueva barra inferior con 🏠 Inicio, 🐾 Mascotas, 📅 Citas, 🔔 Notificaciones (con badge de no leídas).
- **Escritorio**: sin cambios (top nav intacta; la barra inferior es `sm:hidden`).
- Íconos con **emoji** (cero assets, consistente con el estilo actual).
- La barra respeta el **safe-area** inferior y el contenido lleva padding para no quedar tapado por la barra fija.
- No es **BREAKING**; no cambia rutas ni datos.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `responsive-ui`: cambia cómo se presenta la navegación primaria en móvil (de barra superior desplazable a barra inferior alcanzable con el pulgar, con desbordamiento) y agrega la navegación del portal en móvil.

## Impact

- **Nuevos componentes**: `BottomNav` del staff (con menú "Más") y `BottomNav` del portal (client components).
- **Layouts**: `(staff)/layout.tsx` (quitar la fila de nav móvil, montar la barra inferior, padding inferior del `main` en móvil) y `portal/layout.tsx` (montar barra inferior + padding).
- **Sin** cambios de base de datos ni de rutas. La `NavLinks` de escritorio se mantiene.
