// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000/",
        changeOrigin: true,
      },
      "/ws": {
        target: "http://localhost:8000/",
        ws: true,
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost",
        changeOrigin: true,
      },
      "/converted": {
        target: "http://localhost",
        changeOrigin: true,
      },
    },
  },
});
