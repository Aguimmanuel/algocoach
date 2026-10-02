import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The Python backend. Override with ALGOCOACH_API if it runs elsewhere.
const API_TARGET = process.env.ALGOCOACH_API ?? "http://127.0.0.1:8000";

// Everything the browser asks for under /api is forwarded to Python, so the
// frontend only ever uses relative URLs — no ports, no CORS, works from any host.
const proxy = {
  "/api": { target: API_TARGET, changeOrigin: true },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true, // bind 0.0.0.0 so the sandbox preview can reach it
    allowedHosts: true, // the preview is served under a proxied hostname
    proxy,
  },
  preview: {
    host: true,
    allowedHosts: true,
    proxy,
  },
});
