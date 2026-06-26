// Resizes + compresses the supplied source images into web-optimized JPEGs
// in public/assets/img. Re-run anytime you drop new source files in (edit MAP).
import sharp from "sharp";
import path from "node:path";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "assets", "img");
const DL = "C:/Users/yoven/Downloads";

// slot name  ->  source file in Downloads
const MAP = {
  "house-wash": "B75F2444-9D60-4B34-9E06-526391C8D00D.png",
  "driveway":   "FAD195FF-06D1-423C-84EB-5615496D64E2.png",
  "roof":       "7E4E19AC-A00A-4B14-A514-33CAF6DFCB81.png",
  "deck":       "9FFB164E-81B0-4EB4-B81E-3D02A60CAA58.png",
  "patio":      "E5FA8FC9-BD1B-4027-B0B9-07937398F4C8.png",
  "commercial": "3B6119BC-9F4D-4F0C-B39A-EF70DB996FA6.png",
  "owner":      "AFB1AA2C-D437-42F5-B76A-8FAE283093D7.png",
};

const MAX_W = 1600; // plenty for every display size on the site

for (const [name, src] of Object.entries(MAP)) {
  const inp = path.join(DL, src);
  const out = path.join(OUT, `${name}.jpg`);
  try {
    const info = await sharp(inp)
      .rotate() // respect EXIF orientation
      .resize({ width: MAX_W, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(out);
    const kb = (statSync(out).size / 1024).toFixed(0);
    console.log(`OK  ${name.padEnd(12)} ${info.width}x${info.height}  ${kb}KB`);
  } catch (e) {
    console.log(`MISS ${name}: ${e.message}`);
  }
}
