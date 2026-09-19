"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const qs = next.trim() ? `?q=${encodeURIComponent(next.trim())}` : "";
      router.replace(`/pacientes${qs}`);
    }, 300);
  }

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Buscar por nombre, número de ficha o teléfono del dueño…"
      className="min-h-tap w-full rounded-control border border-border bg-surface px-3 text-body text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle"
    />
  );
}
