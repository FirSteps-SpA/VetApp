# Tasks

## 1. Formularios de paciente

- [x] 1.1 En `src/app/(staff)/pacientes/nuevo/patient-form.tsx:205-208`, cambiar el label del input `rut` a "N.º de microchip" (el `name="rut"` y el resto del markup no cambian). Verificar abriendo `/pacientes/nuevo` y confirmando visualmente el nuevo label.
- [x] 1.2 En `src/app/(staff)/pacientes/[id]/editar/edit-form.tsx:50-53`, aplicar el mismo cambio de label. Verificar abriendo la edición de un paciente existente y confirmando el nuevo label.

## 2. Mensajes de duplicado

- [x] 2.1 En `src/app/(staff)/pacientes/nuevo/actions.ts:151-152`, cambiar el mensaje de conflicto de paciente de "El RUT ya está registrado en otro paciente." a "El número de microchip ya está registrado en otro paciente.", sin tocar `tipoConflictoUnico()` ni la rama de mensaje del dueño (líneas 112-119 del mismo archivo). Verificar creando dos pacientes con el mismo valor en el campo y confirmando el nuevo texto de error.
- [x] 2.2 Aplicar el mismo cambio de mensaje en `src/app/(staff)/pacientes/[id]/actions.ts:87-88` (ruta real; la propuesta decía `editar/actions.ts`, pero el archivo con la acción de actualizar vive en `[id]/actions.ts`). Verificar editando un paciente para que su valor choque con el de otro paciente existente y confirmando el nuevo texto de error.

## 3. Visualización

- [x] 3.1 En `src/app/(staff)/pacientes/[id]/page.tsx:220`, cambiar `<Dato label="RUT" .../>` del paciente a `label="N.º de microchip"` (el de dueño en la misma página, línea ~254-256, no se toca). Verificar abriendo la ficha de un paciente con y sin el valor cargado.
- [x] 3.2 En `src/lib/pdf/documents.tsx:176-179`, cambiar el label "RUT" de la sección de paciente a "N.º de microchip" (los labels de RUT de dueño y veterinario en el mismo archivo no se tocan). Verificar generando un PDF clínico de un paciente con el valor cargado y confirmando el nuevo label.

## 4. Código

- [x] 4.1 En `src/lib/types/db.ts`, agregar un comentario de una línea junto al campo `rut` de la interfaz `Paciente` indicando que se muestra al staff como "N.º de microchip". Verificar leyendo el archivo.

## 5. Verificación end-to-end

- [x] 5.1 Recorrer manualmente: crear un paciente con número de microchip → verlo en su ficha → exportar su PDF clínico → editar el paciente e intentar duplicar el número de otro paciente. Confirmar que las cuatro superficies muestran la etiqueta/mensaje de microchip y que el flujo de dueño (label y mensaje "RUT") queda intacto en las mismas pantallas.
