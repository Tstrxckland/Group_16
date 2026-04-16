import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    include: ["tests/**/*.{test,spec}.ts?(x)", "src/**/*.{test,spec}.ts?(x)"],
    mockReset: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      all: true,
      include: ["src/hooks/useAuth.tsx", "src/lib/contentModeration.ts"],
      reporter: ["text", "html"],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },
  },
});

