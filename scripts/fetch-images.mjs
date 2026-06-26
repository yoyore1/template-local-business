// Sources high-resolution, commercially-licensed imagery from Wikimedia Commons.
// Direct download URLs + full license/attribution metadata (public domain / CC).
// Usage: node scripts/fetch-images.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "assets", "img");
const API = "https://commons.wikimedia.org/w/api.php";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Skip clearly off-brand results so the set stays residential / exterior / premium.
const BLOCK = /(toilet|vehicle|truck|car |land rover|isuzu|tank|aircraft|boat|ship|animal|dog|horse|fish|raceway|hatchery|sausage|food|kitchen|dish|hand washing|car wash|engine|tractor)/i;

// w = target download width (resized thumb). min = required source width for quality.
const SLOTS = [
  { name: "hero",         w: 2400, min: 2000, queries: ["pressure washing driveway", "power washing concrete", "high pressure cleaning pavement", "pressure washing"] },
  { name: "driveway",     w: 1600, min: 1400, queries: ["driveway cleaning", "cleaning paving pressure washer", "concrete cleaning pressure", "pavement cleaning"] },
  { name: "house-wash",   w: 1600, min: 1400, queries: ["facade cleaning", "wall cleaning pressure washer", "building facade cleaning", "house washing"] },
  { name: "roof",         w: 1600, min: 1300, queries: ["roof cleaning", "cleaning roof tiles", "low pressure roof washing", "roof moss removal"] },
  { name: "deck",         w: 1600, min: 1300, queries: ["deck cleaning", "wooden terrace cleaning", "cleaning wooden deck pressure"] },
  { name: "patio",        w: 1600, min: 1300, queries: ["patio cleaning", "paving slab cleaning", "stone paving cleaning"] },
  { name: "commercial",   w: 1600, min: 1400, queries: ["sidewalk cleaning pressure", "pavement cleaning city", "street cleaning high pressure"] },
  { name: "before-dirty", w: 1400, min: 1100, queries: ["algae paving stones", "moss concrete", "dirty pavement lichen", "green algae pavement"] },
  { name: "after-clean",  w: 1400, min: 1100, queries: ["clean concrete pavement", "clean paving slabs", "new grey concrete driveway"] },
  { name: "gallery-1",    w: 1600, min: 1300, queries: ["high pressure water cleaning", "pressure washer cleaning ground", "cleaning sidewalk pressure washer"] },
  { name: "gallery-2",    w: 1600, min: 1300, queries: ["cleaning brick wall pressure", "graffiti removal pressure washing", "brick cleaning water jet"] },
  { name: "gallery-3",    w: 1600, min: 1300, queries: ["cleaning stone steps", "cleaning fountain pressure", "stone stairs cleaning"] },
  { name: "spray",        w: 1600, min: 1300, queries: ["pressure washer nozzle spray", "high pressure water jet", "water jet cleaning"] },
];

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json();
}

async function search(query, width) {
  const params = new URLSearchParams({
    action: "query", format: "json", generator: "search",
    gsrsearch: query, gsrnamespace: "6", gsrlimit: "30",
    prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: String(width),
  });
  const data = await fetchJSON(`${API}?${params}`);
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  return pages
    .map((p) => ({ title: p.title, info: p.imageinfo?.[0] }))
    .filter((p) => p.info && /image\/(jpeg|png)/.test(p.info.mime) && !BLOCK.test(p.title));
}

function meta(info, key) {
  const v = info?.extmetadata?.[key]?.value;
  return v ? String(v).replace(/<[^>]*>/g, "").trim() : "";
}

async function download(url, dest, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      return buf.length;
    }
    if (res.status === 403 || res.status === 429) { await sleep(1500 * (i + 1)); continue; }
    throw new Error(`download ${res.status}`);
  }
  throw new Error("download throttled");
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const credits = [];
  for (const slot of SLOTS) {
    let done = false;
    for (const q of slot.queries) {
      if (done) break;
      let results = [];
      try { results = await search(q, slot.w); }
      catch (e) { console.log(`  search err "${q}": ${e.message}`); await sleep(800); continue; }
      results.sort((a, b) => (b.info.width || 0) - (a.info.width || 0));
      const candidates = results.filter((r) => (r.info.width || 0) >= slot.min).slice(0, 4);
      for (const r of candidates) {
        const dl = r.info.thumburl || r.info.url;
        const ext = /png/.test(r.info.mime) ? "png" : "jpg";
        const dest = path.join(OUT, `${slot.name}.${ext}`);
        try {
          await sleep(500);
          const bytes = await download(dl, dest);
          if (bytes < 25000) continue;
          credits.push({
            slot: slot.name, file: `${slot.name}.${ext}`, query: q, title: r.title,
            sourceWidth: r.info.width, sourceHeight: r.info.height,
            descriptionUrl: r.info.descriptionurl,
            license: meta(r.info, "LicenseShortName"),
            licenseUrl: meta(r.info, "LicenseUrl"),
            artist: meta(r.info, "Artist") || meta(r.info, "Credit"),
          });
          console.log(`OK  ${slot.name.padEnd(13)} <- "${q}"  ${r.info.width}px  ${(bytes / 1024).toFixed(0)}KB  ${r.title.replace("File:", "")}`);
          done = true;
          break;
        } catch (e) { console.log(`  dl err ${slot.name}: ${e.message}`); }
      }
    }
    if (!done) console.log(`MISS ${slot.name}`);
    await sleep(300);
  }
  await writeFile(path.join(OUT, "credits.json"), JSON.stringify(credits, null, 2));
  console.log(`\n${credits.length}/${SLOTS.length} images sourced -> public/assets/img/  (credits.json written)`);
}

run().catch((e) => { console.error(e); process.exit(1); });
