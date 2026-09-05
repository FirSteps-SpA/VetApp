"use client";

import { useRouter } from "next/navigation";

import { marcarTodasLeidas } from "./actions";

export function MarcarLeidasButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await marcarTodasLeidas();
        router.refresh();
      }}
      className="inline-flex min-h-tap items-center text-support font-medium text-accent hover:underline"
    >
      Marcar todas como leídas
    </button>
  );
}
