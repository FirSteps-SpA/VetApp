"use client";

import { useEffect, useState } from "react";

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
  "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60";

export function PushToggle() {
  const [soportado, setSoportado] = useState(false);
  const [activo, setActivo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    (async () => {
      if (
        typeof navigator === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      )
        return;
      setSoportado(true);
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

  if (!soportado) {
    return (
      <p className="text-sm text-slate-400">
        Tu navegador no soporta notificaciones push.
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
      {msg && <p className="text-xs text-red-600">{msg}</p>}
    </div>
  );
}
