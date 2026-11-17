# Design

## Context

Ver `proposal.md`. Estado relevante después de la spec 6:

- **Clínicas:** cada una es un tenant. El staff opera en la clínica de su JWT, y la administración (Admin) es solo de la cuenta de plataforma (`dev`).
- **Dueños:** un dueño es una ficha `duenos` por clínica, enlazada a una cuenta `usuarios` con rol `cliente` (sin tenant).
- **Portal:** lee con las funciones `portal_*` y con `cliente_owns_paciente()`, que también usan las políticas de `recetas` y `examenes`.
- **Documentos:**
  - Se generan en el navegador con `@react-pdf/renderer`: historial, recetas, vacunación, derivación, autorizaciones y descargas del portal.
  - `documentos_emitidos` guarda las autorizaciones emitidas, con los datos usados en `datos` (jsonb), que pueden incluir nombre y RUT del dueño.
- **Auditoría:** `audit_log` registra escrituras en consultas, recetas y vacunas, no lecturas.
- **Portal en producción:** todavía no tiene usuarios, así que el bloqueo por aceptación no afecta a nadie al desplegar.

## Goals / Non-Goals

**Goals:**
- La aceptación y la inmutabilidad del aviso y del registro las exige la base, no solo la app.
- Un único armado del paquete de datos, usado por el portal y por el staff, testeable en Vitest.

**Non-Goals:**
- Redactar el texto legal definitivo: la plantilla es un punto de partida y Admin advierte que debe validarlo la asesoría legal de la clínica.
- Notificación de filtraciones, evaluaciones de impacto, contratos con encargados y borrado automático por retención.
- Un rol de administrador por clínica: sigue publicando la cuenta de plataforma, como en la spec 6.

## Decisions

### 1. Avisos versionados e inmutables
`avisos_privacidad (id, tenant_id, version, texto, publicado_por, publicado_en)`, con `unique (tenant_id, version)`. La vigente es la de mayor versión.

- **Publicar:** solo por `publicar_aviso(p_texto)` (`security definer`, que exige `current_rol() = 'dev'`). Calcula la versión siguiente con un bloqueo por clínica.
- **Leer:** el staff ve los de su clínica y un dueño los de sus clínicas (`es_cliente_de_tenant`).
- **Inmutable:** un trigger rechaza `update` y `delete` para todos, incluido `service_role`.

*Alternativa descartada:* una sola fila editable con historial aparte. La versión aceptada tiene que ser exactamente el texto que el dueño leyó.

### 2. Aceptación y bloqueo en la base
`aceptaciones_privacidad (id, tenant_id, dueno_id, aviso_id, usuario_id, aceptado_en)`, inmutable.

- **Registrar:** solo por `aceptar_aviso(p_aviso)`. Verifica que sea la versión vigente de una clínica donde la cuenta tiene ficha y la registra para esa ficha.
- **Comprobar:** `aviso_aceptado(p_dueno)` indica si esa ficha aceptó la versión vigente de su clínica.
- **Bloquear:** `cliente_owns_paciente()` pasa a exigir `aviso_aceptado` de la ficha. Con eso quedan bloqueados de una vez `portal_mascotas`, `portal_consultas`, `portal_vacunas`, `portal_citas` y las políticas de recetas y exámenes, sin tocar cada una.
- **Lo que no se bloquea:** `portal_mi_dueno` sigue devolviendo las fichas, con dos columnas nuevas:
  - `aviso_vigente_id`;
  - `aviso_pendiente`.

  El portal necesita saber qué aviso mostrar.

**En la app:** el layout del portal redirige a `/portal/privacidad` mientras haya alguna clínica con aviso pendiente. Ahí se muestra cada aviso y se acepta uno por uno.

### 3. Registro de accesos
`registro_accesos (id bigserial, tenant_id, usuario_id, accion, paciente_id, dueno_id, detalle jsonb, created_at)`. `accion` toma uno de estos valores:
- `ver_ficha`;
- `exportar_documento` (en `detalle`, el tipo: historial, receta, vacunación, derivación o autorización);
- `descargar_portal`;
- `exportar_datos`;
- `anonimizar`.

**Insertar** solo por `registrar_acceso(p_accion, p_paciente, p_dueno, p_detalle)` (`security definer`):
- `usuario_id` siempre es `auth.uid()`.
- **Staff:** el tenant es el de la sesión, y el paciente o dueño deben ser de esa clínica.
- **Cliente:** el tenant es el del paciente, que debe ser suyo (`cliente_owns_paciente`). Si no, la llamada se rechaza.

**Leer:** solo dev, por clínica. Un trigger rechaza `update` y `delete` para todos. Índices por `(tenant_id, created_at)`, `paciente_id` y `dueno_id`.

**Dónde se registra:**
- La ficha del paciente lo hace en el render del servidor.
- Las exportaciones, que se generan en el cliente, llaman a una server action `registrarExportacion(...)` antes de descargar, tanto en el staff como en el portal.

*Alternativa descartada:* registrar en el middleware. No conoce qué paciente ni qué documento se exporta.

### 4. Paquete de datos del dueño
`armarPaqueteDatos(entrada)`, en `src/lib/privacidad/paquete.ts`, es una función pura que recibe los datos ya leídos y devuelve el JSON del paquete:
- versión del formato y fecha;
- clínica;
- dueño;
- mascotas, con consultas, vacunas, recetas vigentes, exámenes no internos y citas;
- preferencias;
- aceptaciones.

El PDF (`DatosDuenoDoc`) dibuja ese mismo objeto.

**Origen de los datos:**
- **Portal:** las funciones `portal_*`. Las aceptaciones las lee por RLS (`usuario_id = auth.uid()`) y las preferencias con la política existente de `notificaciones_config`.
- **Staff:** la RLS de la clínica, con las mismas columnas que expone el portal. Por eso nunca incluye notas internas.

### 5. Anonimización
`anonimizar_dueno(p_dueno)` (`security definer`, que exige `is_clinico()` y la misma clínica), en una transacción:
1. **Ficha de dueño:**
   - `nombre = 'Dueño eliminado'` y `telefono = '—'`;
   - `rut`, `email`, `direccion`, `comuna`, `sector` y `notas` a null;
   - `usuario_id` a null.
2. **Datos asociados:**
   - borra su `notificaciones_config`;
   - pone `notas_cliente = null` en sus citas.
3. Registra `anonimizar` en el registro de accesos.
4. Devuelve el `usuario_id` previo.

Después, la server action elimina la cuenta con `service_role` si ya no tiene fichas en ninguna clínica, igual que la revocación de la spec 6. Sus notificaciones y suscripciones push caen por cascada.

**Se conservan:**
- consultas, recetas y vacunas (registros médicos, §9.7);
- las aceptaciones del aviso (evidencia, sin datos personales más allá de ids);
- los `documentos_emitidos`: son autorizaciones firmadas, evidencia del consentimiento para un procedimiento, y su `datos` puede incluir nombre y RUT. Ver Open Questions.

**Confirmación:** la UI exige escribir `ELIMINAR`.

### 6. Plantilla del aviso
`src/lib/privacidad/plantilla.ts` arma texto plano a partir de `ClinicaConfig` (nombre, dirección, teléfono, email) con estas secciones:
- responsable;
- datos que se tratan;
- finalidades;
- base;
- destinatarios y encargados;
- derechos y cómo ejercerlos;
- retención (los registros clínicos se conservan; los datos personales se pueden suprimir a pedido);
- cambios al aviso.

**Admin › Privacidad** precarga la plantilla, o la versión vigente si existe, en un editor con vista previa y la publica.

Los textos se muestran como texto con `white-space: pre-wrap`, nunca como HTML, así que no hay inyección de marcado.

### 7. Invitación condicionada
`invitarCliente` verifica, con la sesión del staff, que la clínica tenga un aviso publicado. Si no lo tiene, devuelve el error del requisito.

## Risks / Trade-offs

- [La plantilla no basta legalmente] → Admin muestra un aviso para validarla con asesoría legal. La spec entrega la mecánica, no el texto definitivo.
- [Una versión nueva bloquea a todos los dueños hasta que acepten] → Es lo que pide el requisito. Admin lo advierte antes de publicar.
- [Volumen del registro, una entrada por cada apertura de ficha] → Es una fila corta con índices; con el volumen de una clínica pequeña no pesa. Se puede agregar retención del registro más adelante.
- [Fallo al registrar un acceso] → Si falla al abrir la ficha, la ficha igual se muestra y el error va a Sentry: mostrar la ficha prima. Si falla al exportar, no se descarga; la exportación espera el registro.
- [Datos personales que quedan en `documentos_emitidos.datos`] → Se conservan como evidencia de consentimiento y se documentan en el procedimiento. Ver Open Questions.

## Migration Plan

Una migración aditiva: tablas, funciones y `cliente_owns_paciente` redefinida. El portal en producción no tiene usuarios, así que el bloqueo no corta a nadie.

Antes de invitar al primer dueño (spec 8), cada clínica publica su aviso.

## Open Questions

- Si las autorizaciones firmadas (`documentos_emitidos`) deben conservar los datos del dueño al anonimizarlo, o redactarse. Lo define la asesoría legal; cambiarlo después es una actualización acotada de `anonimizar_dueno` que no altera el resto del diseño.
