// Modelo único de navegación primaria. La misma lista de destinos alimenta
// la barra inferior (teléfono) y el riel lateral (tablet / escritorio), de
// modo que la paridad entre tramos queda garantizada por construcción.
//
// `icon` es un NOMBRE, no el componente: este módulo lo importan Server
// Components (los layouts), y un componente de ícono (una función) no se
// puede pasar como prop de Server a Client Component. `primary-nav.tsx`
// (Client Component) resuelve el nombre al componente real de lucide-react.

export type IconName =
  | "home"
  | "paw-print"
  | "calendar-days"
  | "bell"
  | "syringe"
  | "user"
  | "settings";

export type BadgeKey = "reservas" | "noLeidas";

/** Rol semántico del badge: "danger" (urgente, p. ej. vencido) o "warning"
 * (pendiente de revisar, no urgente). Default "danger" si no se especifica,
 * igual que el comportamiento anterior de un solo color de badge. */
export type BadgeTone = "danger" | "warning";

export interface NavDestino {
  href: string;
  icon: IconName;
  label: string;
  /** Marcar activo solo con coincidencia exacta (p. ej. "/portal"). */
  exact?: boolean;
  grupo: "primario" | "secundario";
  /** Contador a mostrar como badge, si corresponde. */
  badge?: BadgeKey;
  badgeTone?: BadgeTone;
}

export type Contadores = Partial<Record<BadgeKey, number>>;

export function esActivo(pathname: string, d: NavDestino): boolean {
  if (d.exact) return pathname === d.href;
  return pathname === d.href || pathname.startsWith(`${d.href}/`);
}

export function staffDestinos({ esDev }: { esDev: boolean }): NavDestino[] {
  return [
    { href: "/dashboard", icon: "home", label: "Inicio", grupo: "primario" },
    {
      href: "/pacientes",
      icon: "paw-print",
      label: "Pacientes",
      grupo: "primario",
    },
    {
      href: "/agenda",
      icon: "calendar-days",
      label: "Agenda",
      grupo: "primario",
    },
    {
      href: "/reservas",
      icon: "bell",
      label: "Reservas",
      grupo: "primario",
      badge: "reservas",
      // Pendiente de revisar, no un vencimiento: tono de aviso, no de peligro.
      badgeTone: "warning",
    },
    { href: "/vacunas", icon: "syringe", label: "Vacunas", grupo: "secundario" },
    { href: "/perfil", icon: "user", label: "Mi perfil", grupo: "secundario" },
    ...(esDev
      ? [
          {
            href: "/admin",
            icon: "settings" as const,
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
      icon: "home",
      label: "Inicio",
      grupo: "primario",
      exact: true,
    },
    {
      href: "/portal/mascotas",
      icon: "paw-print",
      label: "Mascotas",
      grupo: "primario",
    },
    {
      href: "/portal/citas",
      icon: "calendar-days",
      label: "Citas",
      grupo: "primario",
    },
    {
      href: "/portal/notificaciones",
      icon: "bell",
      label: "Alertas",
      grupo: "primario",
      badge: "noLeidas",
    },
  ];
}
