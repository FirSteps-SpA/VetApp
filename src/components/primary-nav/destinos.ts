// Modelo único de navegación primaria. La misma lista de destinos alimenta
// la barra inferior (teléfono) y el riel lateral (tablet / escritorio), de
// modo que la paridad entre tramos queda garantizada por construcción.

export type BadgeKey = "reservas" | "noLeidas";

export interface NavDestino {
  href: string;
  emoji: string;
  label: string;
  /** Marcar activo solo con coincidencia exacta (p. ej. "/portal"). */
  exact?: boolean;
  grupo: "primario" | "secundario";
  /** Contador a mostrar como badge, si corresponde. */
  badge?: BadgeKey;
}

export type Contadores = Partial<Record<BadgeKey, number>>;

export function esActivo(pathname: string, d: NavDestino): boolean {
  if (d.exact) return pathname === d.href;
  return pathname === d.href || pathname.startsWith(`${d.href}/`);
}

export function staffDestinos({ esDev }: { esDev: boolean }): NavDestino[] {
  return [
    { href: "/dashboard", emoji: "🏠", label: "Inicio", grupo: "primario" },
    { href: "/pacientes", emoji: "🐾", label: "Pacientes", grupo: "primario" },
    { href: "/agenda", emoji: "📅", label: "Agenda", grupo: "primario" },
    {
      href: "/reservas",
      emoji: "🔔",
      label: "Reservas",
      grupo: "primario",
      badge: "reservas",
    },
    { href: "/vacunas", emoji: "💉", label: "Vacunas", grupo: "secundario" },
    { href: "/perfil", emoji: "👤", label: "Mi perfil", grupo: "secundario" },
    ...(esDev
      ? [
          {
            href: "/admin",
            emoji: "⚙️",
            label: "Admin",
            grupo: "secundario" as const,
          },
        ]
      : []),
  ];
}

export function portalDestinos(): NavDestino[] {
  return [
    {
      href: "/portal",
      emoji: "🏠",
      label: "Inicio",
      grupo: "primario",
      exact: true,
    },
    {
      href: "/portal/mascotas",
      emoji: "🐾",
      label: "Mascotas",
      grupo: "primario",
    },
    { href: "/portal/citas", emoji: "📅", label: "Citas", grupo: "primario" },
    {
      href: "/portal/notificaciones",
      emoji: "🔔",
      label: "Alertas",
      grupo: "primario",
      badge: "noLeidas",
    },
  ];
}
