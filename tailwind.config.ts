import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Tramos responsivos con nombre. Se suman a los sm/md/lg de Tailwind,
      // que se conservan mientras dura la migración.
      screens: {
        tablet: "640px",
        desktop: "1024px",
      },
      colors: {
        // Roles de color semánticos. La paleta concreta (CSAP Pradera) vive
        // detrás de estas variables en globals.css.
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        "surface-sunken": "var(--color-surface-sunken)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        accent: "var(--color-accent)",
        "accent-subtle": "var(--color-accent-subtle)",
        "on-accent": "var(--color-on-accent)",
        // Secondary/tertiary: no usar como relleno sólido con texto encima
        // (no pasan AA a texto normal). Sirven de color de ícono/borde/acento
        // decorativo sobre su propia variante "subtle", con `text` como texto.
        "accent-secondary": "var(--color-accent-secondary)",
        "accent-secondary-subtle": "var(--color-accent-secondary-subtle)",
        "accent-tertiary": "var(--color-accent-tertiary)",
        "accent-tertiary-subtle": "var(--color-accent-tertiary-subtle)",
        warning: "var(--color-warning)",
        "warning-subtle": "var(--color-warning-subtle)",
        danger: "var(--color-danger)",
        "danger-subtle": "var(--color-danger-subtle)",
        badge: "var(--color-badge)",
        "on-badge": "var(--color-on-badge)",
      },
      borderRadius: {
        control: "var(--radius-control)",
        card: "var(--radius-card)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        raised: "var(--elevation-raised)",
        overlay: "var(--elevation-overlay)",
      },
      spacing: {
        tap: "var(--tap-min)",
        "tap-lg": "var(--tap-comfortable)",
        rail: "var(--rail-w)",
      },
      minWidth: {
        tap: "var(--tap-min)",
      },
      minHeight: {
        tap: "var(--tap-min)",
      },
      fontSize: {
        support: ["0.8125rem", { lineHeight: "1.15rem" }],
        body: ["0.875rem", { lineHeight: "1.375rem" }],
        section: ["1.125rem", { lineHeight: "1.6rem" }],
        page: ["1.5rem", { lineHeight: "1.9rem" }],
      },
      maxWidth: {
        reading: "72ch",
      },
      fontFamily: {
        // Pareja tipográfica con nombre: titular (Manrope) y cuerpo (Plus
        // Jakarta Sans), cada una con una pila de resguardo real.
        display: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        body: [
          "var(--font-body)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
