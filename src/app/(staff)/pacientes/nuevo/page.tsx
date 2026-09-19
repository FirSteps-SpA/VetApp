import Link from "next/link";
import type { Metadata } from "next";

import { PatientForm } from "./patient-form";

export const metadata: Metadata = {
  title: "Nuevo paciente",
};

export default function NuevoPacientePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/pacientes"
        className="text-sm text-text-muted hover:text-text"
      >
        ← Pacientes
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold text-text">
        Nuevo paciente
      </h1>
      <PatientForm />
    </div>
  );
}
