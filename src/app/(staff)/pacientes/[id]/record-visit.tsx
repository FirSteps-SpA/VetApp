"use client";

import { useEffect } from "react";

import { pushReciente, type PacienteReciente } from "@/lib/recent";

// Registra la visita en el caché de "recientes" (localStorage). No renderiza nada.
export function RecordVisit({ paciente }: { paciente: PacienteReciente }) {
  useEffect(() => {
    pushReciente(paciente);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente.id]);

  return null;
}
