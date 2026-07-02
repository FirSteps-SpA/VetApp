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
      className="text-sm font-medium text-teal-700 hover:underline"
    >
      Marcar todas como leídas
    </button>
  );
}
