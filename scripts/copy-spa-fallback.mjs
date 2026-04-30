import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const indexHtml = path.join(dist, "index.html");
const fallback = path.join(dist, "404.html");

if (!fs.existsSync(indexHtml)) {
  console.error("Missing dist/index.html — run vite build first.");
  process.exit(1);
}
fs.copyFileSync(indexHtml, fallback);
console.log("Wrote dist/404.html for GitHub Pages SPA fallback.");
