import Link from "next/link";
import type { Metadata } from "next";

import { SentryTestButtons } from "./sentry-test-buttons";

export const metadata: Metadata = {
  title: "Prueba de Sentry",
};

// TEMPORAL: verificar que Sentry recibe errores en el preview. Quitar antes de mergear.
export default function SentryTestPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/admin" className="text-sm text-text-muted hover:text-text">
        ← Admin
      </Link>
      <h1 className="text-2xl font-semibold text-text">Prueba de Sentry</h1>
      <SentryTestButtons />
    </div>
  );
}
