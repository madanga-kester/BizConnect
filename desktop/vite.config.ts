import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "desktop",
  plugins: [react()],
  server: { port: 5173, host: "0.0.0.0" },
  build: { outDir: "../desktop-dist", emptyOutDir: true },
});
