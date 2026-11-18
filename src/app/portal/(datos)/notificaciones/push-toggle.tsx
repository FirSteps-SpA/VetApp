"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { diagnosticoPush, type DiagnosticoPush } from "@/lib/portal/push-soporte";

import { guardarSuscripcion, quitarSuscripcion } from "./actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

const btn =
  "inline-flex min-h-tap items-center justify-center rounded-control border border-border px-4 text-body font-medium text-text hover:bg-surface-sunken disabled:opacity-60";

export function PushToggle() {
  const [soporte, setSoporte] = useState<DiagnosticoPush | null>(null);
  const [activo, setActivo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    (async () => {
      if (typeof navigator === "undefined") return;
      const d = diagnosticoPush({
        userAgent: navigator.userAgent,
        standalone:
          window.matchMedia?.("(display-mode: standalone)").matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone === true,
        tieneServiceWorker: "serviceWorker" in navigator,
        tienePushManager: "PushManager" in window,
      });
      setSoporte(d);
      if (d !== "disponible") return;
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setActivo(!!sub);
    })();
  }, []);

  async function activar() {
    setMsg(null);
    if (!vapid) {
      setMsg("Push no configurado (falta la clave VAPID pública).");
      return;
    }
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setMsg(
          "Las notificaciones push requieren la app instalada/producción (npm run build && start).",
        );
        setBusy(false);
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setBusy(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      });
      const json = sub.toJSON();
      await guardarSuscripcion({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      setActivo(true);
    } catch (e) {
      console.error(e);
      setMsg("No se pudo activar.");
    }
    setBusy(false);
  }

  async function desactivar() {
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await quitarSuscripcion(sub.endpoint);
      await sub.unsubscribe();
    }
    setActivo(false);
    setBusy(false);
  }

  if (soporte === "ios-instalar") {
    return (
      <p className="text-sm text-text-muted">
        En iPhone y iPad, las notificaciones funcionan con VetApp agregada a tu pantalla de
        inicio: en Safari toca Compartir → Agregar a inicio y ábrela desde ahí.{" "}
        <Link href="/portal/ayuda#instalar" className="font-medium text-accent hover:underline">
          Ver cómo
        </Link>
      </p>
    );
  }
  if (soporte !== "disponible") {
    return (
      <p className="text-sm text-text-muted">
        {soporte === null
          ? "Revisando si tu dispositivo admite notificaciones…"
          : "Este navegador no admite notificaciones push. Prueba con Chrome en Android o con la app instalada en iPhone."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {activo ? (
        <button onClick={desactivar} disabled={busy} className={btn}>
          Desactivar notificaciones push
        </button>
      ) : (
        <button onClick={activar} disabled={busy} className={btn}>
          Activar notificaciones push
        </button>
      )}
      {msg && <p className="text-xs text-danger">{msg}</p>}
    </div>
  );
}
