// Builds the static site into /dist for Vercel: renders index.html from config,
// copies assets, writes robots.txt + sitemap.xml. (The estimate form is handled
// by the serverless function in /api/estimate.js.)
import { mkdir, writeFile, cp, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE } from "../src/config.js";
import { renderPage } from "../src/render.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

const template = readFileSync(path.join(ROOT, "src", "index.template.html"), "utf8");
const html = renderPage(template, SITE); // no nonce: static CSP allows the one inline config script
await writeFile(path.join(DIST, "index.html"), html);

await cp(path.join(ROOT, "public", "assets"), path.join(DIST, "assets"), { recursive: true });

await writeFile(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE.seo.url}/sitemap.xml\n`);
const today = new Date().toISOString().slice(0, 10);
await writeFile(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE.seo.url}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>\n</urlset>\n`
);

console.log("Built static site -> dist/ (index.html, assets/, robots.txt, sitemap.xml)");
