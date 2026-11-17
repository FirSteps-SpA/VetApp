import type { Metadata } from "next";

import { LoginScreen } from "./login-screen";

export const metadata: Metadata = {
  title: "Ingresar",
};

// Login genérico (sin clínica en la URL): marca VetApp. Cada clínica tiene su
// propia entrada con su marca en `/c/<slug>/login`.
export default function LoginPage() {
  return <LoginScreen nombre="VetApp" logoUrl={null} />;
}
