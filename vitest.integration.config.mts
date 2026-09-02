import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Tests de integración: corren contra una instancia real de Supabase (local
 * si NEXT_PUBLIC_SUPABASE_URL apunta a http://127.0.0.1:54321, o el
 * proyecto remoto si no hay Docker disponible) usando las credenciales de
 * .env.local. No se mockea RLS (SPEC.md sección 43) — se prueba tal como
 * se comporta Postgres realmente.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.integration.test.ts"],
    environment: "node",
    setupFiles: ["./vitest.integration.setup.mts"],
    testTimeout: 30000,
    // Los tests de integración crean/borran datos reales en el mismo
    // proyecto: evitar carreras entre tests ejecutándolos en serie.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
