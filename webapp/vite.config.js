import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/historysuhi/",
  plugins: [react()],
  publicDir: false,
});
