// ¿Puede este navegador activar push, y si no, qué le falta? (spec 8)
// En iOS el push web solo existe con la app agregada a la pantalla de inicio
// (modo standalone, iOS 16.4+): en Safari "suelto" no hay PushManager.

export type DiagnosticoPush = "disponible" | "ios-instalar" | "no-soportado";

export function diagnosticoPush(e: {
  userAgent: string;
  standalone: boolean;
  tieneServiceWorker: boolean;
  tienePushManager: boolean;
}): DiagnosticoPush {
  const ios =
    /iPhone|iPad|iPod/i.test(e.userAgent) ||
    // iPadOS se presenta como Mac con pantalla táctil.
    (/Macintosh/i.test(e.userAgent) && /Mobile/i.test(e.userAgent));
  if (ios && !e.standalone) return "ios-instalar";
  if (!e.tieneServiceWorker || !e.tienePushManager) return "no-soportado";
  return "disponible";
}
