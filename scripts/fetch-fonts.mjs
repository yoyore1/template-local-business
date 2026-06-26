// Self-hosts the Google Fonts (Fraunces + Inter): downloads the woff2 files and
// writes a local @font-face stylesheet, so the site has zero third-party deps.
// Usage: node scripts/fetch-fonts.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "..", "public", "assets", "fonts");
const CSS_OUT = path.join(__dirname, "..", "public", "assets", "css", "fonts.css");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,340;0,9..144,420;0,9..144,500;1,9..144,420&family=Inter:wght@400;500;600;700&display=swap";

async function run() {
  await mkdir(FONTS_DIR, { recursive: true });
  const res = await fetch(CSS_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`fonts css ${res.status}`);
  let css = await res.text();

  const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
  const unique = [...new Set(urls)];
  console.log(`Found ${unique.length} woff2 files to localize.`);

  const map = {};
  let i = 0;
  for (const url of unique) {
    const fam = (url.match(/\/s\/([a-z0-9]+)\//i) || [, "font"])[1];
    const name = `${fam}-${String(++i).padStart(2, "0")}.woff2`;
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) { console.log(`  skip ${url} (${r.status})`); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    await writeFile(path.join(FONTS_DIR, name), buf);
    map[url] = `/assets/fonts/${name}`;
    console.log(`  ${name}  ${(buf.length / 1024).toFixed(0)}KB  (${fam})`);
  }

  css = css.replace(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g, (m, u) =>
    map[u] ? `url(${map[u]})` : m
  );
  const header = "/* Self-hosted via scripts/fetch-fonts.mjs — Fraunces + Inter, font-display: swap */\n";
  await writeFile(CSS_OUT, header + css);
  console.log(`\nWrote ${path.relative(path.join(__dirname, ".."), CSS_OUT)} (${Object.keys(map).length} faces localized).`);
}

run().catch((e) => { console.error(e); process.exit(1); });
