import { describe, expect, it } from "vitest";

import { diagnosticoPush } from "./push-soporte";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";

describe("diagnosticoPush", () => {
  it("iPhone en Safari sin instalar: falta agregar a inicio", () => {
    expect(diagnosticoPush({ userAgent: IPHONE, standalone: false, tieneServiceWorker: true, tienePushManager: false })).toBe("ios-instalar");
  });
  it("iPhone con la app instalada: disponible", () => {
    expect(diagnosticoPush({ userAgent: IPHONE, standalone: true, tieneServiceWorker: true, tienePushManager: true })).toBe("disponible");
  });
  it("Android en Chrome: disponible sin instalar", () => {
    expect(diagnosticoPush({ userAgent: ANDROID, standalone: false, tieneServiceWorker: true, tienePushManager: true })).toBe("disponible");
  });
  it("navegador sin push: no soportado", () => {
    expect(diagnosticoPush({ userAgent: ANDROID, standalone: false, tieneServiceWorker: false, tienePushManager: false })).toBe("no-soportado");
  });
});
