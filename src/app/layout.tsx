import type { Metadata, Viewport } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Pareja tipográfica con nombre (ui-design-system): titular y cuerpo, cada
// una con su propia pila de resguardo declarada en tailwind.config.ts.
const fontDisplay = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});
const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  applicationName: "CSAP Pradera",
  title: {
    default: "Clínica Salud Animal Pradera",
    template: "%s · CSAP Pradera",
  },
  description: "Gestión clínica veterinaria",
  manifest: "/manifest.json",
  // App privada con datos clínicos: no indexar.
  robots: { index: false, follow: false },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CSAP Pradera",
  },
};

export const viewport: Viewport = {
  themeColor: "#586345",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${fontDisplay.variable} ${fontBody.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
