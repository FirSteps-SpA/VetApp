import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests unitarios de lógica pura (sin DOM ni Supabase). `npm run test` corre la
// suite dos veces, con TZ=UTC y TZ=America/Santiago (ver package.json).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
