## Why

La app resuelve el responsive con un único corte (`sm:` / 640px) que alterna entre barra inferior en teléfono y barra superior en escritorio. En tablet (≈768–1024px), el rango donde más se usa la clínica en el mostrador y en ronda, se cae al layout de escritorio: navegación superior poco alcanzable, contenedor angosto (`max-w-5xl` / `max-w-3xl`) que desperdicia el ancho, y ninguna adaptación de densidad ni de ergonomía táctil. Además, cada pantalla resuelve espaciado, tipografía, colores y controles a mano con clases Tailwind sueltas, sin tokens compartidos, lo que hace inconsistente el resultado y caro cualquier ajuste global.

## What Changes

- **Tres tramos responsivos explícitos** en lugar del corte binario: teléfono (`<640px`), tablet (`640–1024px`) y escritorio (`≥1024px`), con nombres y breakpoints definidos una sola vez y reutilizados por navegación y layout.
- **Riel lateral de navegación colapsable** como navegación primaria en tablet y escritorio (staff y portal): columna de iconos con etiquetas, expandible/colapsable, que recuerda su estado; reemplaza la barra superior de enlaces. El teléfono conserva la barra inferior actual.
- **Contenedor de contenido adaptativo por tramo**: en tablet y escritorio el contenido usa el ancho disponible junto al riel en vez de un `max-w` fijo pensado para móvil; se mantiene una medida de lectura cómoda en vistas de texto.
- **Paridad de navegación entre tramos**: los mismos destinos, badges e indicadores (reservas pendientes, notificaciones no leídas, enlace de administración para `dev`) aparecen en barra inferior y en riel.
- **Sistema de tokens de diseño** (`ui-design-system`): escala de espaciado, escala tipográfica en `rem` que respeta el tamaño de fuente del sistema, roles de color semánticos (superficie, borde, texto, acento, peligro, badge), escala de radios y de elevación, y tokens de área táctil. No cambia la identidad visual (se mantiene teal/slate), la formaliza.
- **Primitivas base** que consumen los tokens: botón, card, campo de formulario, y el menú de desbordamiento de acciones ya existente, para que densidad y tamaño táctil sean consistentes entre tramos.
- **Densidad adaptativa**: en tablet y escritorio las listas y tablas pueden mostrar más por fila y controles algo más compactos que en teléfono, sin bajar del área táctil mínima en ninguno.

Sin cambios de identidad visual, sin cambios de rutas ni de datos. No es un rediseño de marca.

## Capabilities

### New Capabilities

- `ui-design-system`: Tokens de diseño semánticos (color, espaciado, tipografía escalable, radios, elevación, área táctil), la definición compartida de los tres tramos responsivos, y las primitivas base (botón, card, campo, menú de desbordamiento) que los consumen de forma consistente.

### Modified Capabilities

- `responsive-ui`: La navegación primaria deja de ser binaria teléfono/escritorio. Se añade el tramo tablet; en tablet y escritorio la navegación primaria pasa a un riel lateral colapsable con estado recordado (staff y portal), y el contenedor de contenido se adapta por tramo. Se conserva la barra inferior en teléfono, el respeto del área segura, el área táctil mínima y el desbordamiento de acciones densas, extendiendo la paridad de navegación e indicadores a los tres tramos.

## Impact

- **Código UI compartido**: `tailwind.config.ts` (breakpoints con nombre, mapa de tokens), `src/app/globals.css` (variables CSS de tokens, utilidades de safe-area ya presentes), nuevas primitivas bajo `src/components/`.
- **Layouts y navegación**: `src/app/(staff)/layout.tsx`, `src/app/(staff)/nav-links.tsx`, `src/app/(staff)/bottom-nav.tsx`, `src/app/portal/layout.tsx`, `src/app/portal/bottom-nav.tsx`; nuevo componente de riel lateral reutilizado por ambas superficies.
- **Pantallas**: adopción incremental de las primitivas y del contenedor adaptativo en las vistas de `(staff)` y `portal`; sin cambios funcionales.
- **Sin impacto** en API, base de datos, Supabase, rutas, PWA/manifest ni dependencias nuevas (se mantiene Tailwind).
- **Riesgo**: regressiones visuales por el cambio de contenedor y de navegación; se mitiga con verificación por tramo (teléfono / tablet vertical y horizontal / escritorio) y adopción incremental de primitivas.
