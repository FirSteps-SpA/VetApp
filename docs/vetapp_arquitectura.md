# VetApp — Arquitectura y Diseño de Sistema

**Documento de Planificación Técnica — Fase I y Fase II**
Stack: Next.js · TypeScript · Supabase (Auth + PostgreSQL + Storage) · PWA
Junio 2026

---

## Tabla de Contenidos

1. [Modelo de Datos Completo](#1-modelo-de-datos-completo)
2. [Gestión de Archivos Adjuntos](#2-gestión-de-archivos-adjuntos)
3. [Sistema de Autenticación y Roles](#3-sistema-de-autenticación-y-roles)
4. [Flujo de Ficha Clínica](#4-flujo-de-ficha-clínica)
5. [Generación de PDF](#5-generación-de-pdf)
6. [Arquitectura de Navegación PWA](#6-arquitectura-de-navegación-pwa)
7. [Módulo de Agenda](#7-módulo-de-agenda)
8. [Módulo de Vacunas y Alertas](#8-módulo-de-vacunas-y-alertas)
9. [Portal de Clientes — Fase II](#9-portal-de-clientes--fase-ii)
10. [Escalabilidad Futura](#10-escalabilidad-futura)
11. [Fases de Implementación](#11-fases-de-implementación)

---

## 1. Modelo de Datos Completo

Todo el esquema está diseñado para Supabase (PostgreSQL). Las políticas RLS se definen desde Fase I. Las tablas marcadas como "Fase II" son opcionales en el deploy inicial pero se crean vacías para no requerir migraciones disruptivas.

---

### 1.1 Tabla: `usuarios`

Extiende `auth.users` de Supabase. Almacena datos de perfil y rol de cada usuario del sistema. El campo `rol` determina los permisos vía RLS.

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK, FK `auth.users.id` | Sincronizado con Supabase Auth |
| `nombre` | TEXT | NOT NULL | Nombre completo |
| `email` | TEXT | NOT NULL, UNIQUE | Email de login |
| `rol` | TEXT | NOT NULL, CHECK (`rol` IN ('dev','veterinario','recepcionista','cliente')) | Rol del usuario |
| `activo` | BOOLEAN | NOT NULL, DEFAULT true | Permite deshabilitar acceso sin eliminar |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Última modificación (trigger) |

**RLS: `usuarios`**

| Rol | SELECT | INSERT | UPDATE | DELETE | Condición |
|---|---|---|---|---|---|
| dev | ✓ | ✓ | ✓ | ✓ | Sin restricciones |
| veterinario | ✓ | ✗ | Solo propio | ✗ | SELECT todos; UPDATE WHERE `id = auth.uid()` |
| recepcionista | Solo propio | ✗ | Solo propio | ✗ | Solo su propio registro |
| cliente | Solo propio | ✗ | Solo propio | ✗ | Solo su propio registro |

> La creación de nuevos usuarios la ejecuta dev o veterinario vía función admin protegida, nunca directamente por el cliente.

---

### 1.2 Tabla: `dueños`

Representa a los propietarios de las mascotas. En Fase II, un dueño puede tener un usuario asociado para el portal de clientes. La relación es 1:1 opcional: un dueño puede existir sin cuenta de usuario (registrado solo por el veterinario).

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único |
| `nombre` | TEXT | NOT NULL | Nombre completo del dueño |
| `telefono` | TEXT | NOT NULL | Teléfono de contacto principal |
| `email` | TEXT | UNIQUE | Email (requerido para invitar a portal Fase II) |
| `direccion` | TEXT | | Dirección opcional |
| `usuario_id` | UUID | FK `usuarios.id`, UNIQUE, NULLABLE | Vinculado si tiene acceso al portal (Fase II) |
| `notas` | TEXT | | Observaciones internas del veterinario |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**RLS: `dueños`**

| Rol | SELECT | INSERT | UPDATE | DELETE | Condición |
|---|---|---|---|---|---|
| dev / veterinario | ✓ todos | ✓ | ✓ | Soft delete | Sin restricciones operativas |
| recepcionista | ✓ todos | ✓ | ✓ | ✗ | Puede crear y editar dueños, no eliminar |
| cliente | Solo propio | ✗ | Solo propio | ✗ | WHERE `usuario_id = auth.uid()` |

---

### 1.3 Tabla: `pacientes`

Entidad central del sistema. Cada mascota es un paciente.

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `nombre` | TEXT | NOT NULL | Nombre de la mascota |
| `especie` | TEXT | NOT NULL, CHECK (`especie` IN ('perro','gato','conejo','ave','reptil','otro')) | Especie |
| `raza` | TEXT | | Raza o cruce |
| `fecha_nacimiento` | DATE | | Para calcular edad exacta en consulta |
| `sexo` | TEXT | CHECK (`sexo` IN ('macho','hembra','desconocido')) | |
| `castrado` | BOOLEAN | DEFAULT false | Estado reproductivo |
| `peso_kg` | NUMERIC(5,2) | | Último peso registrado (se actualiza en cada consulta) |
| `foto_url` | TEXT | | URL en Supabase Storage (bucket `fotos-pacientes`) |
| `numero_ficha` | TEXT | UNIQUE, NOT NULL | Número legible (generado: PAC-00001) |
| `activo` | BOOLEAN | NOT NULL, DEFAULT true | Paciente activo vs. archivado |
| `notas` | TEXT | | Observaciones generales permanentes |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Índices recomendados:**
- `INDEX ON pacientes(nombre)` — búsqueda por nombre
- `INDEX ON pacientes(numero_ficha)` — búsqueda por ficha
- `INDEX ON pacientes(activo) WHERE activo = true` — listados operativos

**RLS: `pacientes`**

| Rol | SELECT | INSERT | UPDATE | DELETE | Condición |
|---|---|---|---|---|---|
| dev / veterinario | ✓ todos | ✓ | ✓ | Soft delete (`activo=false`) | Sin restricciones |
| recepcionista | ✓ activos | ✓ básico | Campos no clínicos | ✗ | Solo campos nombre/especie/raza/dueño |
| cliente | Sus mascotas | ✗ | ✗ | ✗ | Via `paciente_dueños` WHERE `dueño.usuario_id = auth.uid()` |

---

### 1.4 Tabla: `paciente_dueños`

Relación muchos a muchos entre pacientes y dueños. Permite: un paciente con múltiples dueños (pareja, familia), un dueño con múltiples mascotas. `es_principal` identifica al contacto primario.

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `paciente_id` | UUID | PK (compuesta), FK `pacientes.id`, ON DELETE CASCADE | |
| `dueño_id` | UUID | PK (compuesta), FK `dueños.id`, ON DELETE CASCADE | |
| `es_principal` | BOOLEAN | NOT NULL, DEFAULT false | Dueño de contacto primario |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

> Constraint adicional: solo puede existir un `es_principal=true` por paciente (enforced via `UNIQUE INDEX WHERE es_principal = true` o trigger).

---

### 1.5 Tabla: `consultas`

Registra cada visita clínica. Es el pivote principal: recetas, exámenes y evoluciones se asocian a una consulta específica o directamente al paciente (`examenes.consulta_id` nullable).

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `paciente_id` | UUID | NOT NULL, FK `pacientes.id` | |
| `veterinario_id` | UUID | NOT NULL, FK `usuarios.id` | Quién realizó la consulta |
| `cita_id` | UUID | FK `citas.id`, NULLABLE | Vincula con cita previa si aplica |
| `fecha` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha y hora de la consulta |
| `tipo` | TEXT | NOT NULL, DEFAULT 'consulta', CHECK (`tipo` IN ('consulta','control','cirugia','urgencia','vacunacion')) | Tipo de visita |
| `motivo` | TEXT | NOT NULL | Motivo de consulta (texto libre) |
| `anamnesis` | TEXT | | Historia clínica relevante de la visita |
| `examen_fisico` | TEXT | | Hallazgos del examen físico |
| `diagnostico` | TEXT | NOT NULL | Diagnóstico principal |
| `diagnostico_diferencial` | TEXT | | Diagnósticos diferenciales considerados |
| `tratamiento` | TEXT | NOT NULL | Plan de tratamiento indicado |
| `peso_kg` | NUMERIC(5,2) | | Peso en esta consulta (actualiza `pacientes.peso_kg` via trigger) |
| `temperatura_c` | NUMERIC(4,1) | | Temperatura corporal |
| `notas` | TEXT | | Notas adicionales / instrucciones para dueño |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Índices recomendados:**
- `INDEX ON consultas(paciente_id, fecha DESC)` — historial cronológico
- `INDEX ON consultas(veterinario_id, fecha)` — agenda por veterinario
- `INDEX ON consultas(cita_id) WHERE cita_id IS NOT NULL` — linking

**RLS: `consultas`**

| Rol | SELECT | INSERT | UPDATE | DELETE | Condición |
|---|---|---|---|---|---|
| dev / veterinario | ✓ todas | ✓ | ✓ | ✗ (audit) | No se eliminan, se anulan |
| recepcionista | ✗ | ✗ | ✗ | ✗ | Sin acceso a datos clínicos |
| cliente | Sus mascotas | ✗ | ✗ | ✗ | Solo campos: `fecha`, `tipo`, `diagnostico`, `tratamiento`. Sin `anamnesis`/`notas` internas |

---

### 1.6 Tabla: `recetas`

Documento clínico formal. Siempre vinculada a una consulta. El campo `medicamentos` usa JSONB para flexibilidad (lista de fármacos con dosis, frecuencia, duración). El `pdf_url` se almacena solo si el veterinario guarda explícitamente el PDF.

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `consulta_id` | UUID | NOT NULL, FK `consultas.id` | Siempre asociada a una consulta |
| `paciente_id` | UUID | NOT NULL, FK `pacientes.id` | Redundancia intencional para queries directas |
| `veterinario_id` | UUID | NOT NULL, FK `usuarios.id` | |
| `numero_receta` | TEXT | NOT NULL, UNIQUE | REC-00001 — identificador legible |
| `fecha` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `medicamentos` | JSONB | NOT NULL | Array: `[{nombre, presentacion, dosis, frecuencia, duracion, instrucciones}]` |
| `instrucciones_generales` | TEXT | | Instrucciones globales |
| `vigente` | BOOLEAN | NOT NULL, DEFAULT true | Permite invalidar recetas sin eliminar |
| `pdf_url` | TEXT | | URL en Storage si fue generado y guardado |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Estructura JSONB `medicamentos` (ejemplo):**
```json
[
  {
    "nombre": "Amoxicilina",
    "presentacion": "250mg comprimidos",
    "dosis": "1 comprimido",
    "frecuencia": "cada 12 horas",
    "duracion": "7 días",
    "instrucciones": "con alimento"
  }
]
```

**RLS: `recetas`**

| Rol | SELECT | INSERT | UPDATE | DELETE | Condición |
|---|---|---|---|---|---|
| dev / veterinario | ✓ | ✓ | Solo `vigente=false` (invalidar) | ✗ | No se eliminan recetas |
| recepcionista | ✗ | ✗ | ✗ | ✗ | Sin acceso |
| cliente | Sus mascotas | ✗ | ✗ | ✗ | Solo campos: `numero_receta`, `fecha`, `medicamentos`, `instrucciones_generales` |

---

### 1.7 Tabla: `examenes`

Archivos adjuntos con metadatos. `consulta_id` es nullable: un examen puede adjuntarse directamente a la ficha sin estar vinculado a una consulta específica (ej: radiografías históricas).

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `paciente_id` | UUID | NOT NULL, FK `pacientes.id` | |
| `consulta_id` | UUID | FK `consultas.id`, NULLABLE | Vinculado a consulta o a ficha directamente |
| `tipo` | TEXT | NOT NULL, CHECK (`tipo` IN ('hemograma','radiografia','ecografia','biopsia','cultivo','foto','otro')) | Categoría |
| `nombre` | TEXT | NOT NULL | Nombre descriptivo del examen |
| `descripcion` | TEXT | | Resultados o notas del examen |
| `archivo_url` | TEXT | | URL en Supabase Storage |
| `archivo_nombre` | TEXT | | Nombre original del archivo |
| `archivo_tipo` | TEXT | | MIME type: `image/jpeg`, `application/pdf`, etc. |
| `archivo_tamanio_bytes` | INTEGER | | Tamaño para control de cuota |
| `interno` | BOOLEAN | NOT NULL, DEFAULT false | Si `true`, no visible para clientes en Fase II |
| `fecha` | DATE | NOT NULL | Fecha del examen (puede diferir de fecha de carga) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Índices:**
- `INDEX ON examenes(paciente_id, fecha DESC)`
- `INDEX ON examenes(consulta_id) WHERE consulta_id IS NOT NULL`
- `INDEX ON examenes(tipo)` — filtro por categoría

**RLS: `examenes`**

| Rol | SELECT | INSERT | UPDATE | DELETE | Condición |
|---|---|---|---|---|---|
| dev / veterinario | ✓ | ✓ | ✓ | ✓ | Acceso completo |
| recepcionista | ✗ | ✗ | ✗ | ✗ | Sin acceso |
| cliente | Sus mascotas | ✗ | ✗ | ✗ | Solo archivos donde `interno = false` |

---

### 1.8 Tabla: `vacunas`

Registro de cada vacuna aplicada. La próxima dosis puede calcularse en base al esquema de vacunación o ser ingresada manualmente. Se prefiere almacenamiento explícito para facilitar alertas sin cómputo en runtime.

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `paciente_id` | UUID | NOT NULL, FK `pacientes.id` | |
| `consulta_id` | UUID | FK `consultas.id`, NULLABLE | Si se aplicó en consulta |
| `veterinario_id` | UUID | NOT NULL, FK `usuarios.id` | |
| `nombre_vacuna` | TEXT | NOT NULL | Ej: Polivalente, Antirrábica |
| `laboratorio` | TEXT | | Laboratorio fabricante |
| `lote` | TEXT | | Número de lote |
| `fecha_aplicacion` | DATE | NOT NULL | |
| `proxima_dosis` | DATE | | Calculada o ingresada manualmente |
| `estado_alerta` | TEXT | DEFAULT 'al_dia', CHECK (`estado_alerta` IN ('al_dia','proxima','vencida')) | Calculado por trigger/cron |
| `notas` | TEXT | | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

### 1.9 Tabla: `esquemas_vacunacion`

Configuración de esquemas de vacunación por especie. Permite que el sistema sugiera próxima dosis automáticamente. Es configurable (no hardcodeado), con valores por defecto pre-cargados en el deploy inicial.

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `especie` | TEXT | NOT NULL | perro, gato, conejo, etc. |
| `nombre_vacuna` | TEXT | NOT NULL | Nombre canónico |
| `intervalo_dias` | INTEGER | NOT NULL | Días entre dosis (ej: 365 para anual) |
| `es_obligatoria` | BOOLEAN | DEFAULT false | Para el resumen de estado vacunal |
| `descripcion` | TEXT | | Notas sobre el esquema |
| `activo` | BOOLEAN | DEFAULT true | |

---

### 1.10 Tabla: `citas`

Gestión de agenda. Una cita puede originarse desde el veterinario (Fase I) o desde una solicitud del cliente (Fase II).

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `paciente_id` | UUID | NOT NULL, FK `pacientes.id` | |
| `dueño_id` | UUID | FK `dueños.id`, NULLABLE | |
| `veterinario_id` | UUID | NOT NULL, FK `usuarios.id` | |
| `fecha_hora` | TIMESTAMPTZ | NOT NULL | Inicio de la cita |
| `duracion_minutos` | INTEGER | NOT NULL, DEFAULT 30 | Duración estimada |
| `motivo` | TEXT | NOT NULL | Motivo declarado de la cita |
| `estado` | TEXT | NOT NULL, DEFAULT 'pendiente', CHECK (`estado` IN ('pendiente','confirmada','en_consulta','realizada','cancelada','no_asistio')) | Estado de la cita |
| `notas` | TEXT | | Notas internas (solo staff) |
| `notas_cliente` | TEXT | | Notas visibles al cliente en Fase II |
| `creado_por_cliente` | BOOLEAN | DEFAULT false | Para diferenciar origen en Fase II |
| `consulta_id` | UUID | FK `consultas.id`, NULLABLE | Vinculada al iniciar la consulta |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Índices:**
- `INDEX ON citas(veterinario_id, fecha_hora)` — vista de agenda
- `INDEX ON citas(paciente_id, fecha_hora DESC)`
- `INDEX ON citas(estado, fecha_hora)` — filtro por estado

**RLS: `citas`**

| Rol | SELECT | INSERT | UPDATE | DELETE | Condición |
|---|---|---|---|---|---|
| dev / veterinario | ✓ todas | ✓ | ✓ | Soft (cancelada) | Sin restricciones |
| recepcionista | ✓ todas | ✓ | Estado + notas | ✗ | Puede crear/modificar citas, no datos clínicos |
| cliente | Sus mascotas | Solo solicitud | Cancelar propia | ✗ | Solo citas propias, campos no internos |

---

### 1.11 Tabla: `clinica_config`

Configuración global de la clínica. Tabla de fila única con los datos que aparecen en los documentos exportados.

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, DEFAULT 1, CHECK (`id = 1`) | Fila única forzada |
| `nombre_clinica` | TEXT | NOT NULL | |
| `direccion` | TEXT | | |
| `telefono` | TEXT | | |
| `email` | TEXT | | |
| `logo_url` | TEXT | | URL en Storage bucket `clinica-assets` |
| `numero_registro` | TEXT | | Número de registro veterinario |
| `ciudad` | TEXT | | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

### 1.12 Tabla: `audit_log`

Registro automático de modificaciones via triggers de PostgreSQL. Nunca escrita directamente por la aplicación. Cubre las tablas clínicas sensibles: `consultas`, `recetas`, `vacunas`.

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | BIGSERIAL | PK | |
| `tabla` | TEXT | NOT NULL | Nombre de la tabla modificada |
| `registro_id` | UUID | NOT NULL | ID del registro modificado |
| `operacion` | TEXT | NOT NULL, CHECK (`operacion` IN ('INSERT','UPDATE','DELETE')) | |
| `usuario_id` | UUID | FK `usuarios.id` | Quién realizó la operación |
| `datos_anteriores` | JSONB | | Estado antes del cambio (UPDATE/DELETE) |
| `datos_nuevos` | JSONB | | Estado después del cambio (INSERT/UPDATE) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

> RLS: solo `dev` puede SELECT. Ningún rol puede INSERT/UPDATE/DELETE directamente; el trigger actúa con `SECURITY DEFINER`.

---

### 1.13 Decisiones de diseño clave

- **Paciente–dueño (N:M):** Diseño explícito via tabla `paciente_dueños`. Soporta familia compartida y futura transferencia de paciente. `es_principal` marca el contacto de referencia.
- **Acceso de clientes en Fase II:** El campo `dueños.usuario_id` es nullable desde Fase I. Las políticas RLS ya referencian esta columna con condiciones que retornan vacío si es NULL. No se requiere migración estructural al activar Fase II.
- **Recetas como documento:** El JSONB `medicamentos` permite estructura variable sin alterar el schema. El `pdf_url` es opcional: si el PDF no se guarda en Storage, se genera bajo demanda en cada vista.
- **`consulta_id` nullable en `examenes`:** Permite adjuntar archivos históricos a la ficha sin forzar una consulta ficticia. La UI deberá sugerir siempre vincular a consulta, pero no lo fuerza.
- **`estado_alerta` en `vacunas`:** Columna desnormalizada actualizada por trigger o cron job nocturno. Evita recalcular en cada query de listado de alertas.

---

## 2. Gestión de Archivos Adjuntos

Los archivos son ciudadanos de primera clase. El sistema usa Supabase Storage (compatible S3) con múltiples buckets según tipo de contenido y política de acceso.

---

### 2.1 Estructura de Buckets

| Bucket | Acceso | Contenido | Retención |
|---|---|---|---|
| `fotos-pacientes` | Privado | Fotos de perfil de mascotas (JPG, PNG, WEBP) | Permanente |
| `examenes` | Privado | Exámenes clínicos: imágenes, PDFs, radiografías | Permanente |
| `recetas-pdf` | Privado | PDFs de recetas generadas y guardadas | Permanente |
| `historiales-pdf` | Privado, TTL 24h | PDFs de historial generados bajo demanda | 24 horas |
| `clinica-assets` | Público | Logo, firma escaneada, branding de la clínica | Permanente |

> El bucket `historiales-pdf` usa TTL de 24 horas: los PDFs generados caducan automáticamente para no acumular archivos duplicados. Si el usuario necesita el PDF nuevamente, se regenera.

---

### 2.2 Estructura de Carpetas

**Bucket `examenes`:**
```
examenes/{paciente_id}/{YYYY-MM}/{uuid}_{nombre_sanitizado}.{ext}
```
- Organización por paciente y mes para facilitar listados parciales
- UUID al frente garantiza unicidad sin depender del nombre original
- El nombre sanitizado (snake_case, sin caracteres especiales) mejora legibilidad en URLs firmadas

**Bucket `fotos-pacientes`:**
```
fotos-pacientes/{paciente_id}/perfil_{timestamp}.{ext}
```
- Una foto de perfil activa por paciente; las versiones anteriores se mantienen para historial

**Bucket `recetas-pdf`:**
```
recetas-pdf/{paciente_id}/{numero_receta}.pdf
```

---

### 2.3 Tipos de Archivo Soportados

| Tipo | MIME types | Uso | Límite |
|---|---|---|---|
| Imagen | `image/jpeg`, `image/png`, `image/webp` | Fotos de paciente, lesiones, heridas | 10 MB |
| PDF | `application/pdf` | Exámenes de laboratorio, informes | 25 MB |
| DICOM | `application/dicom`, `image/dicom-rle` | Radiografías digitales (si aplica) | 50 MB |
| Video | `video/mp4` (futuro) | Registros de comportamiento (Fase II) | 100 MB |

> DICOM se soporta a nivel de almacenamiento, pero la visualización en browser requiere una librería especializada (ej: `cornerstone.js`). Se implementa en Fase IV solo si el veterinario tiene equipos con salida DICOM.

---

### 2.4 Política de Acceso por Rol

**Fase I:**
- Veterinario y dev: acceso completo a todos los buckets privados vía Storage RLS.
- Las URLs de descarga son signed URLs con expiración de 1 hora generadas server-side.
- Nunca se exponen URLs directas a Storage; el cliente siempre solicita una URL firmada vía API.

**Fase II — Cliente:**
- El cliente puede ver archivos de `examenes` vinculados a sus pacientes, excepto los marcados con `interno = true`.
- Las fotos de paciente son accesibles via signed URL con verificación RLS.
- Las recetas son accesibles si `recetas.vigente = true`.
- Los historiales generados para el cliente usan su propio prefijo: `historiales-pdf/clientes/{usuario_id}/{timestamp}.pdf`.

---

### 2.5 Vinculación con Base de Datos

- **`examenes.archivo_url`:** Ruta relativa en Storage (sin dominio). La URL firmada se genera en el momento de la vista, nunca se almacena la URL firmada en la DB.
- **`recetas.pdf_url`:** Opcional. Solo se almacena si el veterinario guarda el PDF explícitamente.
- **`pacientes.foto_url`:** URL del bucket `fotos-pacientes`.
- **`clinica_config.logo_url`:** URL pública del bucket `clinica-assets` (logo no es dato sensible).

---

### 2.6 Estrategia de Nombres y Anti-colisión

- **UUID + timestamp:** Formato `{uuid}_{timestamp}_{nombre_sanitizado}.{ext}`. El UUID garantiza unicidad absoluta, el timestamp permite ordenamiento, el nombre sanitizado mantiene legibilidad.
- **Sanitización:** Nombres convertidos a lowercase, espacios a guiones bajos, caracteres especiales eliminados, max 50 caracteres antes de la extensión.
- **Extensión preservada:** Se mantiene la extensión original para que los navegadores manejen el tipo MIME correctamente en downloads.

---

### 2.7 Consideraciones de Cuota

- Supabase Free Plan: 1 GB de Storage. Suficiente para ~2.000 archivos de 500 KB promedio.
- Plan Pro: 100 GB. Adecuado para operación clínica normal con radiografías.
- Implementar alerta interna cuando el uso supere el 80% de la cuota contratada.
- Los PDFs de historial con TTL de 24h reducen la acumulación de archivos temporales.

---

## 3. Sistema de Autenticación y Roles

Se usa Supabase Auth con email/password como método principal. El rol del usuario se almacena en `app_metadata` del JWT (no en `user_metadata`, que es editable por el usuario). Las políticas RLS leen el rol directamente del JWT.

---

### 3.1 Mecanismo de Propagación de Roles

- Al crear un usuario en la tabla `usuarios` (via función admin, no registro libre), se llama a una Supabase Edge Function o función SQL con `SECURITY DEFINER` que actualiza `auth.users.app_metadata` con el campo `rol`.
- El JWT incluye `app_metadata` automáticamente. Las políticas RLS usan: `(auth.jwt() -> 'app_metadata' ->> 'rol')`.
- El rol nunca se lee de la tabla `usuarios` en las políticas RLS para evitar joins costosos; se lee del JWT.
- Si el rol cambia, se revoca la sesión del usuario (se invalida el refresh token) para forzar relogin con el nuevo JWT.

> **Función helper recomendada:**
> ```sql
> CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
>   SELECT (auth.jwt() -> 'app_metadata' ->> 'rol')::TEXT
> $$ LANGUAGE SQL STABLE;
> ```
> Simplifica todas las políticas RLS.

---

### 3.2 Flujo de Login por Rol

**Veterinario y Dev (Fase I):**
1. Accede a `/login` con email y contraseña
2. Supabase Auth valida credenciales y devuelve JWT con rol en `app_metadata`
3. El cliente Next.js almacena la sesión via `supabase-js` (cookie httpOnly recomendada)
4. El middleware de Next.js verifica el JWT en cada request protegido
5. Si el token expira, `supabase-js` lo renueva automáticamente con el refresh token

**Recepcionista (Fase II):**
- Mismo flujo que veterinario pero con `rol='recepcionista'`. Las RLS limitan automáticamente su acceso.
- La interfaz muestra solo las secciones permitidas. Las rutas clínicas redirigen a `/unauthorized`.

**Cliente / Dueño (Fase II):**
1. El veterinario activa el acceso del cliente desde la ficha del dueño ("Invitar al portal")
2. Se llama a una Edge Function protegida que: (a) crea el usuario en Supabase Auth con `rol='cliente'`, (b) actualiza `dueños.usuario_id` con el nuevo `user_id`, (c) envía email de invitación con magic link de 48h
3. El cliente hace clic en el link del email → es autenticado directamente → llega a `/portal`
4. Al primer login, se le pide establecer una contraseña (opcional, puede seguir usando magic link)
5. El portal solo muestra las mascotas vinculadas a su `dueño_id`

> **No hay registro abierto.** Los clientes solo pueden acceder si el veterinario los invita explícitamente. Decisión deliberada de seguridad.

---

### 3.3 Diferencias de Experiencia por Rol

| Característica | Dev | Veterinario | Recepcionista | Cliente |
|---|---|---|---|---|
| Login | Email/pass | Email/pass | Email/pass | Magic link / pass |
| Ver fichas clínicas | ✓ | ✓ | Solo básico | Solo sus mascotas |
| Crear consultas | ✓ | ✓ | ✗ | ✗ |
| Emitir recetas | ✓ | ✓ | ✗ | ✗ |
| Ver exámenes | ✓ | ✓ | ✗ | Sus mascotas (no internos) |
| Gestionar agenda | ✓ | ✓ | ✓ | Solo solicitar |
| Admin/config | ✓ | ✗ | ✗ | ✗ |
| Exportar PDF historial | ✓ | ✓ | ✗ | Sus mascotas |

---

### 3.4 Seguridad de Datos Clínicos

- **RLS como capa de seguridad primaria:** Toda política RLS se verifica a nivel de base de datos. Incluso si hay un bug en la UI, la BD no retorna datos no autorizados.
- **Signed URLs para archivos:** Ningún archivo tiene URL pública permanente (excepto logo de clínica). Las URLs firmadas expiran en 1 hora máximo.
- **Campo `interno` en `examenes`:** Permite que el veterinario marque archivos como "solo staff" incluso si el paciente tiene portal activo.
- **Auditoría:** Todas las modificaciones a datos clínicos quedan en `audit_log` via trigger.
- **Sin acceso cruzado entre clientes:** La política RLS del rol `cliente` siempre une via `paciente_dueños → dueños → usuario_id = auth.uid()`.
- **Sesiones:** JWT con expiración de 1 hora + refresh token de 7 días. El logout invalida el refresh token.

---

## 4. Flujo de Ficha Clínica

La ficha clínica es el núcleo del sistema. Su diseño debe permitir que en los primeros 30 segundos de una consulta el veterinario tenga toda la información crítica visible sin navegar ni buscar.

---

### 4.1 Información en los Primeros 30 Segundos (Hero Card)

Al abrir la ficha de un paciente, el área superior (hero card) muestra permanentemente:

- Foto de la mascota + nombre + especie/raza + edad calculada + peso reciente
- Número de ficha y estado (activo/archivado)
- Dueño principal: nombre y teléfono (clic para llamar en mobile)
- Última consulta: fecha + diagnóstico en una línea
- Medicamentos activos: nombre + dosis (extraídos de la última receta vigente)
- Estado vacunal: chip "Al día" / "Próxima" / "Vencida" con link a sección vacunas
- Próxima cita: fecha + motivo si existe

> Esta información se carga en una sola query con JOINs optimizados y se cachea en el cliente durante la sesión activa de consulta.

---

### 4.2 Jerarquía de Información: Tabs

| Tab | Contenido principal | Carga |
|---|---|---|
| **Resumen** (default) | Hero card + últimas 3 consultas + alertas activas | Inmediata con la ficha |
| Historial | Lista cronológica de todas las consultas expandibles | Lazy on tab click |
| Recetas | Lista de recetas con estado vigente/anulada + botón descargar PDF | Lazy |
| Exámenes | Grid de archivos con filtro por tipo + previsualización inline | Lazy |
| Vacunas | Timeline de vacunas aplicadas + próximas pendientes | Lazy |
| Citas | Historial de citas + próxima pendiente | Lazy |

---

### 4.3 Navegación entre Consultas Históricas

- La tab **Historial** muestra tarjetas compactas ordenadas por fecha DESC: fecha, tipo, diagnóstico en una línea, veterinario.
- Al expandir una tarjeta se muestran: motivo, anamnesis, examen físico, diagnóstico completo, tratamiento, receta vinculada (si existe), exámenes vinculados.
- Una consulta expandida tiene botón "Ver completo" que navega a `/pacientes/{id}/consultas/{consultaId}`.
- Desde la vista de consulta individual se puede imprimir/exportar esa consulta específica.

---

### 4.4 Adjuntar y Visualizar Exámenes

- Zona de drop en la tab Exámenes y también inline dentro del formulario de nueva consulta.
- Al subir un archivo se pide: tipo de examen (selector), nombre descriptivo, fecha del examen, descripción/resultados.
- Los archivos de imagen se previewan inline (thumbnail). Los PDFs muestran un ícono con opción de abrir en nueva pestaña o descargar.
- Los archivos se muestran en un grid con filtros por tipo y fecha.
- **Vinculación a consulta:** si se adjunta desde el formulario de consulta, `consulta_id` se setea automáticamente. Si se adjunta desde la tab general, `consulta_id` es null a menos que el veterinario lo vincule manualmente.

---

### 4.5 Emitir Receta desde la Ficha

1. El veterinario hace clic en "Nueva Receta" desde la ficha o desde el formulario de consulta
2. Se abre un formulario modal/panel lateral con: lista de medicamentos (agregar múltiples), instrucciones generales, fecha
3. Cada medicamento tiene campos: nombre, presentación, dosis, frecuencia, duración, instrucciones específicas
4. Al guardar, se crea el registro en `recetas` vinculado a la consulta activa
5. El sistema genera un número de receta correlativo (REC-00001)
6. Opción "Guardar y descargar PDF" genera el PDF inmediatamente. Opción "Solo guardar" almacena el registro sin PDF.

---

### 4.6 Registrar Nueva Consulta sin Perder Contexto

- El botón "Nueva Consulta" abre un **panel lateral deslizante (drawer)** que ocupa 60% del ancho en desktop, pantalla completa en mobile.
- La hero card del paciente permanece visible en el 40% restante en desktop, proporcionando contexto constante.
- El drawer tiene secciones plegables: Datos clínicos (motivo, anamnesis, examen físico), Diagnóstico, Tratamiento, Receta (inline), Adjuntar exámenes.
- Al guardar, el drawer se cierra, la ficha se actualiza sin navegación, y la nueva consulta aparece en la tab Historial.
- Si se sale del drawer con cambios no guardados, se muestra confirmación de descarte.

---

## 5. Generación de PDF

La exportación de documentos es una función crítica del sistema, no un addon. Se diseña desde Fase I con soporte completo para todos los escenarios de exportación definidos.

---

### 5.1 Tipos de Documento Exportable

| Tipo | Uso principal | Campos incluidos |
|---|---|---|
| Historial Clínico Completo | Derivación, entrega a dueño | Datos paciente + dueño + todas las consultas + recetas + lista de exámenes |
| Resumen Clínico | Derivación parcial, segunda opinión | Datos paciente + consultas en rango de fechas seleccionado |
| Receta Individual | Entrega al dueño, farmacia | Datos clínica + paciente + dueño + medicamentos + instrucciones + firma |
| Carta de Derivación | Referir a especialista | Datos clínica + paciente + motivo derivación + historial relevante + exámenes adjuntos |
| Ficha de Vacunación | Viajes, requisitos legales | Datos paciente + historial completo de vacunas aplicadas |

---

### 5.2 Campos por Tipo de Documento

**Historial Clínico Completo:**
- Encabezado: logo clínica, nombre, dirección, teléfono, número de registro veterinario
- Datos del paciente: nombre, especie, raza, fecha de nacimiento, edad, sexo, castrado, número de ficha, foto (opcional)
- Datos del dueño: nombre, teléfono, email
- Por cada consulta (cronológico): fecha, tipo, veterinario, motivo, diagnóstico, tratamiento, medicamentos recetados
- Lista de exámenes: nombre, tipo, fecha, descripción (sin archivos embebidos, solo listados)
- Historial de vacunas: nombre vacuna, fecha aplicación, próxima dosis
- Pie de página: fecha de generación, número de páginas

**Receta Individual:**
- Logo clínica + datos de contacto (encabezado)
- Número de receta + fecha
- Datos del paciente + dueño
- Lista de medicamentos: nombre comercial, presentación, dosis, frecuencia, duración, instrucciones
- Instrucciones generales
- Nombre del veterinario + número de registro + espacio para firma

---

### 5.3 Dónde se Genera el PDF: Cliente vs. Servidor

**Decisión: Generación client-side con `react-pdf` (`@react-pdf/renderer`)**

Justificación:
- Permite diseño declarativo en JSX con soporte completo de estilos, fuentes e imágenes
- Sin latencia de red: el PDF se genera en el browser con los datos ya cargados en la ficha
- Sin costo de Edge Functions para cada generación
- El resultado se puede descargar directamente o enviarse al servidor para almacenar en Storage

**Excepción — PDFs grandes o de lote:**
- Si el historial tiene más de 100 consultas, se delega a una Supabase Edge Function que usa `pdfkit` o headless Chromium
- El Edge Function retorna la URL en Storage con TTL de 24 horas

---

### 5.4 Logo de la Clínica en PDFs

- Se carga desde `clinica_config.logo_url` en cada generación de PDF
- Para generación client-side: se precarga como base64 al inicio de la sesión y se cachea en memoria
- Para Edge Functions: se descarga desde Storage al momento de generación
- El logo se escala manteniendo aspect ratio dentro de un área máxima de 200×80px en el encabezado

---

### 5.5 Opciones de Selección de Contenido

| Parámetro | Tipo | Descripción |
|---|---|---|
| Tipo de documento | Selector | Historial completo / Resumen / Receta / Derivación / Vacunas |
| Rango de fechas | Date range picker | Filtrar consultas y exámenes por período |
| Incluir recetas | Toggle | Sí/No — aplica a historial completo |
| Incluir lista de exámenes | Toggle | Sí/No — no embebe archivos |
| Incluir vacunas | Toggle | Sí/No |
| Consultas específicas | Multi-select | Seleccionar consultas individuales para carta de derivación |
| Notas internas | Toggle | Excluir por defecto — el veterinario elige incluirlas |

---

### 5.6 Almacenamiento de PDFs Generados

- **Recetas:** se almacenan en Storage (`recetas-pdf`) solo si el veterinario elige "Guardar PDF".
- **Historiales y derivaciones:** no se almacenan por defecto (TTL 24h si se usa Edge Function). Se regeneran bajo demanda.
- **Ficha de vacunación:** no se almacena. Siempre se genera bajo demanda.

> Esta política reduce la cuota de Storage sin sacrificar funcionalidad, dado que la regeneración es rápida y gratuita client-side.

---

### 5.7 Flujo de Derivación (Escenario 4)

1. El veterinario abre la ficha del paciente y hace clic en "Generar Carta de Derivación"
2. Se abre un modal con formulario: nombre del especialista/clínica destino, motivo de derivación, selección de consultas a incluir (checkboxes), observaciones adicionales
3. El sistema genera el PDF con: encabezado clínica, datos paciente, motivo de derivación, consultas seleccionadas, lista de exámenes relevantes
4. Vista previa inline del PDF antes de descargar
5. Opciones de acción: **Descargar PDF**, **Copiar enlace** (genera URL firmada de 24h en Storage), **Enviar por email** (Fase II)

---

## 6. Arquitectura de Navegación PWA

La app es una PWA construida con Next.js (App Router). El manifiesto y el service worker se gestionan con `next-pwa` o con una solución manual para mayor control. La instalabilidad en iOS y Android es un requerimiento.

---

### 6.1 Árbol de Rutas — Fase I

| Ruta | Rol mínimo | Descripción |
|---|---|---|
| `/` | Público | Redirect a `/dashboard` si autenticado, `/login` si no |
| `/login` | Público | Formulario de login email/password |
| `/dashboard` | Veterinario | Vista del día: citas pendientes, alertas vacunas, resumen rápido |
| `/pacientes` | Veterinario | Búsqueda y listado de pacientes |
| `/pacientes/nuevo` | Veterinario | Formulario de alta de nuevo paciente + dueño |
| `/pacientes/[id]` | Veterinario | Ficha clínica completa del paciente (tabs) |
| `/pacientes/[id]/consultas/nueva` | Veterinario | Formulario de nueva consulta (también como drawer) |
| `/pacientes/[id]/consultas/[cId]` | Veterinario | Vista detallada de una consulta específica |
| `/pacientes/[id]/recetas/nueva` | Veterinario | Formulario de nueva receta |
| `/agenda` | Veterinario | Vista de calendario (día/semana) |
| `/agenda/nueva-cita` | Veterinario | Formulario de nueva cita |
| `/vacunas` | Veterinario | Lista de pacientes con vacunas pendientes/vencidas |
| `/admin` | Dev | Configuración del sistema, gestión de usuarios, clínica |
| `/admin/clinica` | Dev | Datos de la clínica, logo, configuración PDF |

---

### 6.2 Árbol de Rutas — Fase II (adicionales)

| Ruta | Rol | Descripción |
|---|---|---|
| `/portal` | Cliente | Home del portal: mascotas + citas próximas + alertas |
| `/portal/mascotas` | Cliente | Lista de sus mascotas |
| `/portal/mascotas/[id]` | Cliente | Ficha simplificada de la mascota (sin notas internas) |
| `/portal/mascotas/[id]/recetas` | Cliente | Recetas vigentes con descarga PDF |
| `/portal/mascotas/[id]/examenes` | Cliente | Exámenes disponibles con descarga |
| `/portal/citas` | Cliente | Historial de citas + próximas |
| `/portal/citas/solicitar` | Cliente | Solicitud de nueva hora |
| `/admin/usuarios` | Dev/Vet | Gestión de usuarios: invitar clientes, crear recepcionistas |
| `/admin/reservas` | Vet/Recep | Bandeja de solicitudes de cita pendientes de aprobación |

---

### 6.3 Flujo Principal del Veterinario en Consulta Típica

1. Abre `/dashboard` — ve citas del día
2. Hace clic en la cita del paciente → navega a `/pacientes/{id}`
3. Hero card carga en <2s con toda la información crítica
4. Revisa historial en tab Historial si necesita contexto adicional
5. Hace clic "Nueva Consulta" → se abre drawer lateral sin perder la ficha
6. Completa el formulario de consulta: motivo → examen físico → diagnóstico → tratamiento
7. Si necesita receta: dentro del drawer hace clic "Agregar Receta" → formulario inline
8. Si necesita adjuntar examen: zona de drop dentro del drawer
9. Guarda la consulta → drawer se cierra → ficha actualizada automáticamente
10. Si necesita derivar: botón "Derivación" en la ficha → genera PDF → descarga o comparte

---

### 6.4 Comportamiento en Móvil vs. Desktop

| Aspecto | Desktop (>1024px) | Mobile (<768px) |
|---|---|---|
| Ficha del paciente | Hero card + tabs en layout dos columnas con drawer lateral | Hero card superior + tabs full screen, nueva consulta en pantalla completa |
| Buscar paciente | Barra de búsqueda persistente en sidebar izquierdo | Barra de búsqueda en header con modal de resultados |
| Agenda | Vista semana con grid de horas | Vista día por defecto, swipe para cambiar día |
| Formularios | Panel lateral (drawer) | Modal full screen o pantalla completa |
| Navegación principal | Sidebar izquierdo permanente | Bottom navigation bar (4 ítems principales) |

---

### 6.5 Estrategia de Caché Offline

**Funciona sin conexión:**
- Últimas 20 fichas de pacientes visitadas (Service Worker + IndexedDB)
- Datos de citas del día actual (pre-cargados al inicio de sesión)
- Formulario de nueva consulta: se puede completar offline, se sincroniza al recuperar conexión
- Lista de pacientes con búsqueda local contra el caché

**Requiere conectividad:**
- Subir archivos adjuntos (fotos, PDFs de exámenes)
- Generar y descargar PDFs vía Edge Function
- Ver exámenes adjuntos (archivos en Storage)
- Autenticación y renovación de tokens

**Estrategia de sincronización:**
- Background Sync API: las consultas guardadas offline se envían automáticamente cuando vuelve la conexión
- Toast de aviso cuando la app detecta modo offline
- Indicador visual permanente de estado de conexión en el header

---

## 7. Módulo de Agenda

---

### 7.1 Vista del Veterinario

**Vista Día (default):**
- Lista vertical ordenada por hora con tarjetas de cita
- Cada tarjeta muestra: hora, duración, nombre paciente, especie (ícono), dueño, motivo, estado (color-coded)
- Acción rápida en cada tarjeta: Iniciar Consulta, Confirmar, Cancelar, Editar
- Franja de horas no ocupadas visible para identificar disponibilidad

**Vista Semana:**
- Grid de 7 días × franjas horarias (cada 30 minutos)
- Citas representadas como bloques de color según estado
- Clic en cita abre detalle; clic en franja vacía abre "Nueva Cita" con fecha/hora pre-rellenada

---

### 7.2 Flujo: Nueva Cita desde la Ficha del Paciente

1. Desde la tab Citas de la ficha del paciente, botón "Agendar Cita"
2. Formulario con campos pre-rellenados: paciente, dueño principal
3. Selector de fecha/hora con vista de disponibilidad del veterinario
4. Campos adicionales: motivo, duración estimada, notas
5. Al guardar: registro en tabla `citas` con estado `pendiente`, aparece inmediatamente en agenda

---

### 7.3 Estados de una Cita

| Estado | Descripción | Transiciones posibles |
|---|---|---|
| `pendiente` | Cita registrada, no confirmada | → `confirmada`, `cancelada` |
| `confirmada` | Paciente confirmó asistencia | → `en_consulta`, `cancelada`, `no_asistio` |
| `en_consulta` | El veterinario inició la consulta | → `realizada` |
| `realizada` | Consulta completada y cerrada | Estado final |
| `cancelada` | Cancelada por staff o cliente | Estado final (con timestamp y razón) |
| `no_asistio` | El paciente no se presentó | Estado final |

---

### 7.4 Vinculación Cita → Consulta

- Al hacer clic en "Iniciar Consulta" en una cita, el estado cambia a `en_consulta` y se navega a la ficha del paciente con el drawer de nueva consulta abierto.
- Al guardar la consulta, `consultas.cita_id = citas.id` se establece automáticamente.
- La cita pasa a estado `realizada` al guardar la consulta (via trigger o lógica de aplicación).
- Una cita puede convertirse en consulta solo una vez; si ya tiene `consulta_id`, el botón cambia a "Ver Consulta".

---

### 7.5 Fase II: Solicitud de Hora por Cliente

1. El cliente accede a `/portal/citas/solicitar`
2. Selecciona mascota, motivo, preferencia de horario (franja, no hora exacta)
3. Se crea registro en `citas` con `estado='pendiente'` y `creado_por_cliente=true`
4. El veterinario recibe notificación (push PWA y/o email) de nueva solicitud
5. Desde `/admin/reservas`, el veterinario confirma y asigna hora exacta, o rechaza con mensaje
6. El cliente recibe notificación de confirmación o rechazo

---

## 8. Módulo de Vacunas y Alertas

---

### 8.1 Esquemas de Vacunación

Los esquemas son configurables, no hardcodeados. La tabla `esquemas_vacunacion` contiene los intervalos por especie y vacuna. En el deploy inicial se pre-cargan los esquemas estándar para perros y gatos, pero el veterinario puede agregar, modificar o eliminar entradas desde `/admin`.

**Esquema por defecto para perros (ejemplo):**

| Vacuna | Intervalo | Obligatoria |
|---|---|---|
| Polivalente (DA2PP) | 365 días | Sí |
| Antirrábica | 365 días | Sí (legal) |
| Bordetella | 365 días | No |
| Leptospirosis | 365 días | No |
| Influenza Canina | 365 días | No |

---

### 8.2 Registro de Vacuna Aplicada

1. Desde la ficha del paciente (tab Vacunas) o desde el formulario de consulta (tipo=`vacunacion`)
2. Formulario: nombre vacuna (selector con opciones del esquema + opción libre), laboratorio, lote, fecha de aplicación, observaciones
3. La próxima dosis se calcula automáticamente: `fecha_aplicacion + intervalo_dias` del esquema. El veterinario puede ajustarla manualmente.
4. Se crea registro en `vacunas` con `proxima_dosis` y `estado_alerta='al_dia'`
5. Si hay consulta activa, `consulta_id` se vincula automáticamente

---

### 8.3 Cálculo de Estado de Alerta

**Trigger on-write:**
Cuando se inserta o actualiza una vacuna, un trigger recalcula `estado_alerta` basado en `proxima_dosis` vs. `now()`:
```sql
CASE
  WHEN proxima_dosis < now()                              THEN 'vencida'
  WHEN proxima_dosis BETWEEN now() AND now() + INTERVAL '30 days' THEN 'proxima'
  ELSE 'al_dia'
END
```

**Cron job nocturno (`pg_cron` o Edge Function scheduled):**
- Ejecuta `UPDATE vacunas SET estado_alerta = CASE ...` cada día a las 00:00
- Garantiza que las alertas se actualicen incluso si no hay actividad en el sistema
- El cron también puede poblar una tabla `notificaciones_pendientes` para envíos futuros en Fase II

---

### 8.4 Vista Interna de Vacunas Pendientes (`/vacunas`)

- **Sección "Vencidas":** pacientes cuya `proxima_dosis` ya pasó
- **Sección "Próximas (30 días)":** pacientes con dosis en los próximos 30 días
- Cada entrada muestra: foto + nombre paciente, vacuna pendiente, fecha prevista, dueño + teléfono
- Acción directa: "Ver ficha" y "Llamar al dueño" (en mobile abre la app de teléfono)
- Filtros: por especie, por tipo de vacuna, por rango de fechas
- El dashboard `/dashboard` muestra un resumen numérico (ej: "3 vacunas vencidas, 5 próximas") con link a `/vacunas`

---

### 8.5 Fase II: Notificación Automática al Dueño

- El cron nocturno genera notificaciones para dueños con email registrado y `usuario_id` activo
- Se envía email via Supabase (configurado con Resend o SendGrid) con recordatorio de vacuna
- Push notification via Web Push API para dueños que tienen el portal instalado como PWA
- El dueño puede desactivar notificaciones por tipo desde la configuración de su cuenta
- El veterinario puede ver en `/admin` qué notificaciones se enviaron y cuáles dueños no tienen contacto digital

---

## 9. Portal de Clientes — Fase II

---

### 9.1 Flujo de Primer Acceso (Invitación)

1. El veterinario va a la ficha del dueño y hace clic en "Invitar al portal"
2. El sistema verifica que el dueño tiene email registrado (requisito)
3. Se llama a una Edge Function protegida que: (a) crea usuario en Supabase Auth con `rol='cliente'`, (b) setea `dueños.usuario_id = nuevo_user_id`, (c) envía email con magic link de 48h
4. El dueño hace clic en el email → es autenticado directamente → llega a `/portal`
5. Si el dueño ya tiene cuenta pero el email cambió, el veterinario puede actualizar el email y reenviar la invitación

> **No existe registro abierto.** El único flujo de entrada para clientes es la invitación explícita del veterinario.

---

### 9.2 Qué Puede y No Puede Ver el Cliente

| Información | ¿Visible? | Condición |
|---|---|---|
| Nombre, especie, raza, foto del paciente | ✓ Sí | Siempre |
| Fecha y tipo de consultas | ✓ Sí | Siempre |
| Diagnóstico y tratamiento | ✓ Sí | Siempre |
| Motivo y anamnesis de consulta | ✗ No | Solo staff — información clínica interna |
| Examen físico detallado | ✗ No | Solo staff |
| Recetas vigentes | ✓ Sí | Donde `recetas.vigente = true` |
| Exámenes y archivos adjuntos | ✓ Sí | Donde `examenes.interno = false` |
| Exámenes marcados como internos | ✗ No | Solo staff |
| Historial de vacunas | ✓ Sí | Siempre |
| Datos de otros dueños del mismo paciente | ✗ No | Solo el dueño propio |
| Notas internas del veterinario | ✗ No | Solo staff |
| Citas propias | ✓ Sí | Solo las del dueño autenticado |

---

### 9.3 Descarga de Recetas y Exámenes (Escenario 2 desde Cliente)

- En `/portal/mascotas/{id}`, la tab "Recetas" muestra lista de recetas vigentes con botón "Descargar PDF"
- El PDF se genera client-side con `react-pdf` usando la misma lógica que el veterinario, pero sin campos internos
- La tab "Exámenes" muestra los archivos no internos con botón "Descargar" que solicita una signed URL de 1 hora
- El cliente puede descargarlo todo como ZIP ("Descargar historial completo") — PDF de historial + archivos
- Esta funcionalidad cubre exactamente el Escenario 2: el veterinario ya no necesita preparar documentación manualmente

---

### 9.4 Solicitud de Hora y Gestión de Reservas

- El flujo completo está descrito en la sección 7.5
- El cliente ve sus citas en estado chip (pendiente/confirmada/realizada/cancelada)
- Puede cancelar una cita confirmada con hasta N horas de anticipación (configurable en `clinica_config`)
- No puede reagendar directamente: debe cancelar y solicitar nueva hora

---

### 9.5 Notificaciones Push (PWA)

- Al instalar el portal como PWA, se solicita permiso de notificaciones
- Se usa la Web Push API con Supabase Edge Functions como servidor de push
- Tipos: recordatorio de cita (24h antes), confirmación de cita, vacuna próxima (30 días antes)
- Fallback: si el dueño no tiene PWA instalada, se envía email para todos los tipos

---

### 9.6 Múltiples Mascotas por Dueño

- El home del portal muestra lista de mascotas con foto, nombre, especie
- Cada mascota tiene su propia vista `/portal/mascotas/{id}` con datos independientes
- Las notificaciones identifican claramente a qué mascota se refieren
- Si un dueño tiene muchas mascotas, se muestra búsqueda por nombre dentro del portal

---

### 9.7 Privacidad y Consentimiento

- Al primer login, el cliente acepta los términos de uso y política de privacidad (registro de aceptación en DB)
- El veterinario puede revocar el acceso del cliente en cualquier momento (desactiva el usuario en Auth, limpia `usuario_id` del dueño)
- El cliente puede solicitar la eliminación de su cuenta: el veterinario procesa la solicitud; los datos clínicos del paciente no se eliminan por ser registros médicos

---

## 10. Escalabilidad Futura

---

### 10.1 Segundo Veterinario

El modelo de datos ya tiene `veterinario_id` en todas las tablas clínicas (`consultas`, `recetas`, `vacunas`, `citas`). El segundo veterinario se agrega creando un nuevo usuario con `rol='veterinario'`. No se requieren cambios de schema.

**Consideraciones adicionales:**
- Por defecto, ambos veterinarios ven todas las fichas (clínica compartida). Si se necesita privacidad entre veterinarios, se agrega columna `asignado_a` en `pacientes` y se ajusta la RLS.
- En la agenda, cada veterinario ve solo sus propias citas por defecto, con opción de ver la del colega.
- Los reportes de actividad clínica pueden filtrarse por `veterinario_id`.

---

### 10.2 Incorporación de Recepcionista

El rol `recepcionista` ya existe en el sistema de autenticación y en la tabla `usuarios`. Las políticas RLS ya lo contemplan con acceso limitado a:

- `citas`: crear, ver, modificar estado; no puede ver notas clínicas
- `pacientes`: ver datos básicos, crear nuevo paciente (no datos clínicos)
- `dueños`: ver y crear
- Sin acceso a: `consultas`, `recetas`, `examenes`, `vacunas`

En la UI, la recepcionista solo ve las secciones de Agenda, Pacientes (básico) y Dueños. Las rutas clínicas redirigen a `/unauthorized`.

---

### 10.3 Múltiples Sucursales

No está en el roadmap inmediato, pero estas son las decisiones que facilitan o complican el escalamiento a multi-sucursal.

> **Recomendación adoptada:** aunque la *funcionalidad* multi-sucursal no se active hasta una fase futura, la *estructura mínima* se anticipa desde la Fase 1. La misma lógica que justificó incluir `dueños.usuario_id` y `veterinario_id` desde el inicio (ver tabla 10.4) aplica aquí: agregar `sucursal_id` después implica `ALTER TABLE` sobre datos productivos. Crear la tabla `sucursales` (con una fila "principal" por defecto) y las columnas `sucursal_id` nullable desde el deploy inicial evita esa migración disruptiva. En modo mono-sucursal todo opera de forma transparente contra la sucursal por defecto.

**Cambios necesarios en el schema:**
- Agregar tabla `sucursales` con `id`, `nombre`, `direccion`, `telefono`, `activo` y configuración propia
- Agregar `sucursal_id` (FK) a: `usuarios` (o tabla N:M `usuario_sucursales` si un veterinario rota entre sedes), `citas`, `clinica_config`
- Los pacientes y fichas clínicas **no** se asignan a sucursal: la ficha es única y portable, un paciente puede atenderse en cualquier sede (coherente con "ficha clínica como eje central")
- Solo lo operativo lleva sucursal: las `citas` (¿en qué lugar se atiende?), los `usuarios` y la configuración
- Propagar `sucursal_id` al JWT (`app_metadata`), igual que el `rol`

**Cambios en RLS:**
- La recepcionista solo ve citas de su sucursal: `AND sucursal_id = auth.jwt() -> 'app_metadata' ->> 'sucursal_id'`
- El veterinario puede tener múltiples sucursales o estar restringido a una

**Activación funcional (fase futura, post-9):**
- UI de gestión de sucursales en `/admin`
- `clinica_config` por sucursal: logo y datos por sede en los encabezados de los PDFs
- Relación N:M usuario↔sucursal si un veterinario atiende en varias sedes
- Selector de sucursal en el login/header

---

### 10.4 Decisiones Críticas de Fase I

Las siguientes decisiones, si no se toman correctamente, pueden dificultar el crecimiento:

| Decisión | Correcta (adoptada) | Problemática (evitar) |
|---|---|---|
| Roles en JWT | `app_metadata` controlado por server | `user_metadata` editable por usuario |
| `veterinario_id` en tablas clínicas | Sí, en todas las tablas desde Fase I | Omitirlo y agregarlo luego (migración data) |
| `dueños.usuario_id` nullable | Sí, preparado para Fase II sin migración | No incluirlo en Fase I (requiere ALTER TABLE) |
| `paciente_dueños` como tabla separada | Sí, relación N:M explícita | Columna única `dueño_id` en `pacientes` (limita a 1 dueño) |
| `numero_ficha` y `numero_receta` únicos | Sí, UNIQUE generado por DB | Generado en frontend (colisiones en multi-vet) |
| RLS desde el primer deploy | Sí, definidas para todos los roles | Agregar RLS después con datos existentes (riesgo de exposición transitoria) |
| `audit_log` via trigger | Sí, inmutable desde Fase I | Auditoría en app-level (se puede bypassear) |

---

## 11. Fases de Implementación

El desarrollo se divide en 9 fases incrementales. Cada fase entrega valor funcional al veterinario. Las fases 1–6 constituyen el MVP de Fase I; las fases 7–9 implementan Fase II.

---

### Fase 1 — Fundación

**Objetivo:** Proyecto funcional, autenticado, con estructura de carpetas, DB y Storage configurados. Base sólida para todas las fases siguientes.

**Entregables técnicos:**
- Proyecto Next.js 14+ (App Router) + TypeScript strict configurado
- `next-pwa` o `@ducanh2912/next-pwa` integrado con `manifest.json` y service worker básico
- Supabase project creado: Auth habilitado, PostgreSQL con **todas las tablas del schema completo**
- Todos los buckets de Storage creados con sus políticas
- Todas las políticas RLS implementadas para todos los roles
- Triggers para `audit_log` y `updated_at` implementados
- Esquemas de vacunación por defecto pre-cargados
- `clinica_config` con datos de placeholder
- **Estructura multi-sucursal anticipada (ver 10.3):** tabla `sucursales` con una fila "principal" por defecto; columnas `sucursal_id` nullable en `usuarios` y `citas`; propagación de `sucursal_id` al JWT (`app_metadata`) junto al `rol`. La funcionalidad no se expone en la UI todavía, pero se evita una migración disruptiva futura
- Middleware de Next.js para protección de rutas por rol
- Variables de entorno configuradas para dev y producción

**Entregables funcionales:**
- El veterinario puede hacer login y logout
- Las rutas protegidas redirigen a `/login` si no hay sesión
- La app es instalable como PWA en Android e iOS

**Criterios de éxito:**
- Login exitoso con usuario de prueba `rol=veterinario`
- RLS verificada: un usuario cliente no puede leer `consultas` (test directo en Supabase dashboard)
- La app pasa Lighthouse PWA audit con score > 90

---

### Fase 2 — Pacientes

**Objetivo:** El veterinario puede registrar pacientes y encontrarlos rápidamente. Flujo más frecuente del día a día.

**Entregables técnicos:**
- Ruta `/pacientes`: lista paginada + barra de búsqueda (nombre, número de ficha, teléfono dueño)
- Ruta `/pacientes/nuevo`: formulario con validación (paciente + dueño en un solo flujo)
- Ruta `/pacientes/[id]`: hero card completa con lazy-load de tabs
- Carga de foto de paciente con preview y upload a Storage
- Generación de `numero_ficha` automático (PAC-XXXXX)
- Cache client-side de los últimos 20 pacientes visitados (SWR o React Query)

**Entregables funcionales:**
- Registrar nueva mascota con todos sus datos y dueño
- Buscar paciente por nombre, número de ficha o teléfono del dueño en menos de 2 segundos
- Ver ficha del paciente con hero card

**Criterios de éxito:**
- Buscar un paciente entre 100 registros de prueba retorna resultados en < 500ms
- La foto se sube correctamente y aparece en la hero card

**Dependencias:** Fase 1 completa

---

### Fase 3 — Consultas y Recetas

**Objetivo:** El veterinario puede registrar el trabajo clínico esencial. Cubre los Escenarios 1 y 3.

**Entregables técnicos:**
- Drawer lateral de nueva consulta con todos los campos del schema
- Ruta `/pacientes/[id]/consultas/[cId]`: vista completa de consulta individual
- Tab Historial en la ficha: lista de consultas con expand/collapse
- Formulario de receta inline en el drawer de consulta
- Generación de `numero_receta` automático (REC-XXXXX)
- Actualización de `pacientes.peso_kg` via trigger al guardar consulta con peso

**Entregables funcionales:**
- Registrar una consulta completa en menos de 5 minutos
- Emitir una receta con múltiples medicamentos desde la consulta
- Ver el historial de consultas en orden cronológico
- Los medicamentos de la última receta vigente aparecen en la hero card

**Criterios de éxito:**
- Consulta guardada correctamente con todas las relaciones (paciente, veterinario)
- La hero card actualiza "última consulta" y "medicamentos activos" sin reload

**Dependencias:** Fase 2 completa

---

### Fase 4 — Exámenes y Archivos

**Objetivo:** Los archivos clínicos son ciudadanos de primera clase. Elimina la dependencia de WhatsApp.

**Entregables técnicos:**
- Zona de drop (drag & drop + selector de archivo) en drawer de consulta y tab Exámenes
- Upload progresivo con barra de progreso
- Previsualización inline de imágenes (thumbnail); ícono para PDFs
- Grid de exámenes filtrable por tipo y fecha
- Modal de vista expandida de imagen; visor de PDF inline
- Vinculación automática de examen a consulta activa

**Entregables funcionales:**
- Arrastrar una foto de herida y que aparezca en la ficha del paciente
- Subir un PDF de laboratorio vinculado a la consulta actual
- Filtrar exámenes por tipo

**Criterios de éxito:**
- Un archivo de 10MB se sube en menos de 10 segundos en conexión normal
- RLS verificada: un archivo de `examenes` no es accesible sin signed URL válida

**Dependencias:** Fase 3 completa

---

### Fase 5 — Exportación PDF

**Objetivo:** El veterinario puede exportar cualquier documento clínico en segundos. Cubre los Escenarios 2 y 4.

**Entregables técnicos:**
- Integración `@react-pdf/renderer` para generación client-side
- Componentes PDF: layout base con logo de clínica, header/footer
- Tipo "Receta Individual": genera y descarga/guarda PDF
- Tipo "Historial Completo": con selector de rango de fechas y toggles de secciones
- Tipo "Carta de Derivación": con selección de consultas y formulario de motivo
- Tipo "Ficha de Vacunación"
- Vista previa inline antes de descargar
- Upload a Storage (`recetas-pdf`) cuando se elige "Guardar PDF"

**Entregables funcionales:**
- Descargar receta de un paciente como PDF con logo de la clínica
- Generar historial completo de los últimos 2 años en un click
- Generar carta de derivación con selección de consultas relevantes

**Criterios de éxito:**
- PDF de receta generado en menos de 3 segundos client-side
- El logo de la clínica aparece correctamente en el encabezado de todos los documentos
- El historial de un paciente con 50 consultas genera un PDF sin errores

**Dependencias:** Fases 3 y 4 completas; `clinica_config` con logo cargado

---

### Fase 6 — Agenda y Vacunas

**Objetivo:** Digitalizar los dos módulos operativos restantes de Fase I.

**Entregables técnicos:**
- Ruta `/agenda`: vistas día y semana con componente de calendario
- Formulario de nueva cita con selector de paciente, hora y disponibilidad
- Transición de estados de cita con validación de flujo
- Vinculación automática cita → consulta al iniciar
- Ruta `/vacunas`: panel de alertas con secciones vencidas/próximas
- Tab Vacunas en ficha del paciente: timeline de vacunas y próximas dosis
- Formulario de registro de vacuna aplicada con sugerencia de próxima dosis
- Trigger de recálculo de `estado_alerta`
- Cron job nocturno de actualización de alertas (`pg_cron`)
- Widget de alertas en `/dashboard`
- **Preparación multi-sucursal en agenda (ver 10.3):** las citas son la entidad operativa que lleva `sucursal_id`. Dejar la RLS de recepcionista lista para filtrar por sucursal (`AND sucursal_id = auth.jwt()->'app_metadata'->>'sucursal_id'`); en modo mono-sucursal se autocompleta con la sucursal por defecto

**Entregables funcionales:**
- Ver todas las citas del día ordenadas por hora
- Agendar una cita desde la ficha del paciente
- Iniciar una consulta directamente desde la cita
- Ver qué pacientes tienen vacunas vencidas o próximas a vencer
- Registrar una vacuna aplicada que calcule automáticamente la próxima dosis

**Criterios de éxito:**
- Una cita pasa de `pendiente` a `realizada` con la consulta vinculada correctamente
- El cron job actualiza el estado de 100 vacunas en menos de 1 segundo

**Dependencias:** Fases 3 y 4 completas

---

### Fase 7 — Portal de Clientes

**Objetivo:** Los dueños de mascotas pueden acceder a la información de sus mascotas sin intermediarios. Fase II comienza aquí.

**Entregables técnicos:**
- Edge Function `invite-client` para crear usuario cliente y enviar email
- Flujo de onboarding de cliente (magic link → primer login)
- Rutas `/portal/*` con middleware de `rol=cliente`
- Vista simplificada de ficha de mascota (sin campos internos)
- Descarga de recetas y exámenes para el cliente
- Generación de PDF de historial versión cliente (sin notas internas)
- Auditoría de RLS: verificación exhaustiva de que no hay data leaks

**Entregables funcionales:**
- Un dueño puede acceder al historial de su mascota desde su teléfono
- Puede descargar sus recetas vigentes como PDF
- Puede ver y descargar sus exámenes no internos

**Criterios de éxito:**
- Penetration test básico: un cliente no puede acceder a datos de otro dueño en ningún endpoint
- El flujo de invitación funciona de extremo a extremo
- La ficha del portal no muestra ningún campo marcado como interno

**Dependencias:** Fases 1–5 completas

---

### Fase 8 — Reservas y Notificaciones

**Objetivo:** El cliente puede solicitar horas y recibir recordatorios automáticos.

**Entregables técnicos:**
- Flujo de solicitud de hora desde el portal (`/portal/citas/solicitar`)
- Bandeja de aprobación en `/admin/reservas`
- Notificaciones push (Web Push API) con service worker actualizado
- Integración de email transaccional (Resend o SendGrid via Supabase)
- Cron job de notificaciones: recordatorio citas 24h antes, vacunas 30 días antes
- Configuración de notificaciones por dueño (opt-in/opt-out por tipo)

**Entregables funcionales:**
- Un cliente solicita una hora y el veterinario la confirma desde la app
- El cliente recibe un recordatorio push 24 horas antes de su cita
- Los dueños con vacunas próximas reciben un email de recordatorio

**Criterios de éxito:**
- Notificación push recibida en iOS y Android con el portal instalado
- El veterinario puede aprobar o rechazar solicitudes en menos de 30 segundos

**Dependencias:** Fase 7 completa

---

### Fase 9 — Pulido y Deploy

**Objetivo:** La app está lista para uso en producción: instalable, rápida, probada en dispositivos reales, con monitoreo básico.

**Entregables técnicos:**
- Optimización Lighthouse: PWA score > 95, Performance > 85 en mobile
- Verificación de instalabilidad: iOS Safari (Add to Home Screen), Android Chrome (install banner)
- Prueba en dispositivos reales: iPad, iPhone, Android
- Optimización de queries lentas identificadas en Supabase Dashboard
- Error boundary components para fallos no críticos
- Logging de errores client-side (Sentry o similar)
- Deploy en producción: Vercel (Next.js) + Supabase Project separado para producción
- Variables de entorno separadas dev/staging/prod
- Backup automático de Supabase habilitado (Point-in-Time Recovery)

**Entregables funcionales:**
- La app funciona fluidamente en el dispositivo que usa el veterinario en consulta
- La app es instalable y funciona como app nativa en el dispositivo
- Los datos están respaldados automáticamente

**Criterios de éxito:**
- El veterinario completa un flujo completo (búsqueda → consulta → receta → PDF) en menos de 10 minutos en su dispositivo real
- Ningún error no capturado en la primera semana de uso en producción
- El backup de la BD puede restaurarse exitosamente en un ambiente de prueba

**Dependencias:** Fases 1–8 completas

---

### Resumen de Fases

| Fase | Nombre | Duración est. | Valor principal |
|---|---|---|---|
| 1 | Fundación | 1 semana | Infraestructura completa, auth, PWA instalable |
| 2 | Pacientes | 1 semana | Alta y búsqueda de pacientes |
| 3 | Consultas y Recetas | 1–2 semanas | Trabajo clínico esencial digitalizado |
| 4 | Exámenes y Archivos | 1 semana | Fin de WhatsApp como sistema de archivos |
| 5 | Exportación PDF | 1 semana | Historial y derivaciones en segundos |
| 6 | Agenda y Vacunas | 1–2 semanas | Operación diaria completamente digitalizada |
| 7 | Portal Clientes | 1–2 semanas | Dueños acceden sin intermediarios |
| 8 | Reservas y Notificaciones | 1 semana | Comunicación automática con clientes |
| 9 | Pulido y Deploy | 1 semana | Producción estable y monitorizada |

> Las duraciones son estimaciones para un solo desarrollador trabajando full-time. Fases 3 y 6 pueden extenderse según la complejidad de los formularios clínicos y la iteración con el veterinario.

---

*VetApp — Documento de Arquitectura v1.0 — Junio 2026*
