import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** GitHub Pages 프로젝트 사이트 경로. 로컬은 `/`. */
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/SEO-TESTING-HTML/" : "/",
}));
