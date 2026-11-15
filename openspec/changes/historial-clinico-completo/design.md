# Design

## Context

El historial del staff (`HistorialDoc` en `src/lib/pdf/documents.tsx`) dibuja cada consulta o control con `ConsultaHistorial`. Hoy imprime motivo y diagnóstico (o la evolución, si es un control), el tratamiento y, según `OpcionesHistorial.incluirNotasInternas`, las notas. Los controles ya se agrupan bajo su consulta con `agruparControles` (spec 4). Las opciones viven en el estado de `export-panel.tsx`, y cada cambio llama a `tocado()`, que marca la vista previa como desactualizada. El historial del portal (`HistorialClienteDoc`) es otro componente con sus propios datos (`portal_*`).

## Goals / Non-Goals

**Goals:**
- La lista de campos de una consulta o de un control se calcula en una función pura y testeable, separada de la presentación.
- Mismo orden que el detalle de la consulta, con el diagnóstico diferencial antes del diagnóstico.

**Non-Goals:**
- No cambiar `DerivacionDoc` ni la receta. Tienen su propio contenido acotado, y el roadmap solo pide el historial.
- No cambiar el resumen del panel: sigue contando consultas, controles, recetas, exámenes y vacunas, no campos.
- No cambiar el historial del portal.

## Decisions

### 1. Función pura `camposConsultaHistorial`
En `src/lib/consultas/campos-historial.ts`:

```ts
camposConsultaHistorial(c, opciones, origen?: Consulta | null): { label: string; valor: string }[]
```

Devuelve los campos con valor, ya formateados y en orden:
- Evolución, solo en controles enlazados.
- Motivo.
- Anamnesis y Examen físico, si `incluirAnamnesis`.
- Peso y Temperatura, si `incluirSignosVitales`. El peso usa `formatearPeso` y la temperatura se muestra como `38.6 °C`, igual que el detalle.
- Diagnóstico diferencial.
- Diagnóstico.
- Tratamiento.
- Notas, si `incluirNotasInternas`.

`ConsultaHistorial` solo recorre la lista. La función recibe solo las opciones que usa, mediante `Pick<OpcionesHistorial, ...>`, y no importa nada de react-pdf. Así se testea en Vitest sin dibujar el PDF.

*Alternativa descartada:* condicionales en el JSX. Resultan difíciles de testear y repiten la lógica para consultas y controles.

### 2. Evolución primero en los controles
En el detalle de un control, la evolución va después del motivo. En el PDF va primero, porque en un control es lo esencial y el motivo casi siempre se omite por repetido. Es el mismo criterio que la spec 4 ya aplicaba en el PDF, donde la evolución reemplazaba al motivo.

### 3. Omitir los campos repetidos solo si el origen está en el documento
`origen` se pasa únicamente para los controles agrupados dentro del bloque de su consulta (`e.consulta` en `agruparControles`). Los controles sueltos, cuyo origen quedó fuera del rango, lo reciben `null` y muestran todos sus campos. El lector no tiene ahí la consulta de origen para comparar.

La comparación se hace sobre el texto recortado, y `null` equivale a `""`. Un diagnóstico diferencial que el control borró (origen con valor, control vacío) no se imprime, porque los campos vacíos nunca se imprimen.

### 4. Opciones nuevas con nombres explícitos
`OpcionesHistorial` gana `incluirAnamnesis` (rótulo "Incluir anamnesis y examen físico") e `incluirSignosVitales` ("Incluir signos vitales"), ambas `true` por defecto en `export-panel.tsx`. Se agregan a la lista de casillas existente, así que heredan `tocado()` y la vista previa desactualizada sin código nuevo.

### 5. Tarjetas que pueden partirse entre páginas
Con todos los campos, una consulta puede ocupar más que una página. La tarjeta de la consulta pasa a `wrap` siempre, en vez de solo cuando tiene controles. Los textos largos siguen partiéndose por react-pdf. La cabecera (fecha, tipo, veterinario) se mantiene junta con el primer campo mediante `minPresenceAhead`, para que no quede sola al pie de una página.

*Alternativa descartada:* mantener `wrap={false}`. Una tarjeta más alta que la página se desborda y se corta.

## Risks / Trade-offs

- [El historial completo de un paciente con muchas consultas crece bastante] → El staff puede desactivar las dos secciones nuevas o exportar por rango. Las opciones por defecto priorizan el registro completo, que es lo que pidió la clínica.
- [Un control que solo cambia mayúsculas o espacios del diagnóstico se imprime como "distinto"] → Se recortan los espacios de los extremos; las demás diferencias se tratan como un cambio real del veterinario.
- [Romper por error el historial del portal] → No se toca `HistorialClienteDoc`. La verificación descarga el PDF del portal y comprueba que no aparecen anamnesis ni examen físico.
