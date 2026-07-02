"use client";

import dynamic from "next/dynamic";

import type { PortalDownloadsData } from "./portal-downloads";

// Carga @react-pdf solo en cliente, fuera del SSR.
const PortalDownloads = dynamic(() => import("./portal-downloads"), {
  ssr: false,
  loading: () => (
    <p className="text-sm text-slate-400">Cargando descargas…</p>
  ),
});

export function DownloadsLoader({ data }: { data: PortalDownloadsData }) {
  return <PortalDownloads data={data} />;
}
