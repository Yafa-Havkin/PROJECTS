import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite dev server config. The dev server proxies /api requests to the FastAPI
// backend on localhost:8000, so the browser talks to the backend without CORS
// headaches during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
