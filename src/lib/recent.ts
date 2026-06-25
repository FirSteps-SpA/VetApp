// Caché client-side de los últimos pacientes visitados (sin dependencias).
"use client";

import type { Especie } from "@/lib/types/db";

export interface PacienteReciente {
  id: string;
  nombre: string;
  especie: Especie;
  numero_ficha: string;
}

const KEY = "vetapp:pacientes-recientes";
const MAX = 20;

export function getRecientes(): PacienteReciente[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PacienteReciente[]) : [];
  } catch {
    return [];
  }
}

export function pushReciente(p: PacienteReciente): void {
  if (typeof window === "undefined") return;
  try {
    const actuales = getRecientes().filter((x) => x.id !== p.id);
    const next = [p, ...actuales].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignorar cuota / modo privado.
  }
}
