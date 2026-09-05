-- VetApp — Columnas para autollenar documentos legales y certificados.
-- Datos estables que hoy se retipean en cada emisión (autorizaciones y
-- certificado de microchip) pasan a vivir en la entidad que los posee. Todas
-- nullable, sin backfill. Ver cambio openspec `add-document-prefill-columns`.
-- =========================================================================

-- Animal: color/pelaje y datos de tenencia responsable (mismos valores que el
-- certificado de microchip). CHECK acepta NULL (columna sin dato).
alter table pacientes
  add column color          text,
  add column modo_obtencion text
    check (modo_obtencion in
      ('recogido','reubicacion','regalo','nacido','compra')),
  add column razon_tenencia text
    check (razon_tenencia in
      ('compania','asistencia','terapia','trabajo','seguridad','deporte',
       'exposicion','reproduccion','caza'));

-- Domicilio del dueño: comuna y sector junto a la `direccion` de texto libre
-- ya existente (no se descompone la dirección completa).
alter table duenos
  add column comuna text,
  add column sector text;

-- Identidad profesional del staff. `rut` sin unicidad ni validación de dígito
-- verificador en esta iteración. `titulo_profesional` mapea 1:1 al check
-- médico / técnico del certificado oficial de microchip.
alter table usuarios
  add column rut                text,
  add column titulo_profesional text
    check (titulo_profesional in ('medico', 'tecnico'));

-- RLS: sin cambios. Las políticas vigentes ya cubren las columnas nuevas de la
-- misma fila (`pacientes_update` / `duenos_update` = public.is_staff();
-- `usuarios_update` = id = auth.uid() o rol dev). Los GRANT del proyecto son a
-- nivel de tabla, no por columna.
