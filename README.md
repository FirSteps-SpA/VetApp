# VetApp

PWA para la gestión clínica de una veterinaria. Centraliza el historial de pacientes, consultas, recetas, exámenes, vacunas y agenda en un solo lugar, reemplazando los registros manuales y la documentación dispersa por WhatsApp.

La aplicación nace como herramienta de uso interno para el veterinario y está diseñada desde el inicio para evolucionar hacia un portal de acceso para los dueños de mascotas, con un modelo de roles y seguridad preparado para crecer (recepcionista, segundo veterinario y múltiples sucursales) sin refactorizar el esquema de datos.

## Características

- **Ficha clínica como eje central:** acceso inmediato a los datos críticos del paciente (última consulta, medicamentos activos, estado vacunal) en los primeros segundos de la consulta.
- **Consultas y recetas:** registro estructurado del trabajo clínico y emisión de recetas desde la propia ficha.
- **Archivos adjuntos de primera clase:** exámenes, fotos y radiografías vinculados al paciente y a la consulta.
- **Exportación a PDF:** historial completo, recetas, cartas de derivación y fichas de vacunación con el logo de la clínica.
- **Agenda y vacunas:** gestión de citas y alertas de vacunas vencidas o próximas a vencer.
- **Portal de clientes (Fase II):** acceso de los dueños al historial de sus mascotas, descarga de documentos, solicitud de horas y recordatorios automáticos.

## Stack

- **Framework:** Next.js (App Router) + TypeScript estricto
- **Tipo de app:** Progressive Web App (PWA) — instalable en móvil y desktop, sin app store
- **Backend:** Supabase (Auth, PostgreSQL con Row Level Security, Storage)
- **Generación de PDF:** `@react-pdf/renderer` (client-side)

## Documentación

La planificación técnica completa —modelo de datos, RLS, flujos, fases de implementación y escalabilidad— está en [`docs/vetapp_arquitectura.md`](docs/vetapp_arquitectura.md).
