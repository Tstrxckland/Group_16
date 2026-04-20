import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const NODE_ENV_DEVELOPMENT = "development";
const LOVABLE_TAGGER_MODULE = "lovable-tagger";

/**
 * Builds the Vite plugin list. The React plugin is always included.
 * In development only, tries to add lovable-tagger if available; if missing or
 * broken, the build continues without it so CI and forks are not blocked.
 *
 * @param mode - Vite env mode (e.g. "development" | "production")
 * @returns Array of Vite plugins
 */
function getPlugins(mode: string | undefined): Plugin[] {
  const plugins: Plugin[] = [react()];

  const isDev = typeof mode === "string" && mode === NODE_ENV_DEVELOPMENT;
  if (!isDev) {
    return plugins;
  }

  try {
    const taggerModule = require(LOVABLE_TAGGER_MODULE) as { componentTagger?: () => Plugin };
    const componentTagger = taggerModule?.componentTagger;
    if (typeof componentTagger === "function") {
      plugins.push(componentTagger());
    }
  } catch {
    // Optional: lovable-tagger not installed or failed to load; continue without it
  }

  return plugins;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: getPlugins(mode),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
