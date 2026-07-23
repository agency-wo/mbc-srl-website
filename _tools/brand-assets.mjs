// Session 4 — rasterize favicons and compose the OG share image.
import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BRAND = join(ROOT, "assets", "img", "brand");
const IMG = join(ROOT, "assets", "img");

// --- Favicons from the SVG mark ---
const favSizes = [
  ["favicon-32.png", 32], ["favicon-48.png", 48],
  ["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512],
];
for (const [name, size] of favSizes) {
  await sharp(join(BRAND, "favicon.svg")).resize(size, size).png().toFile(join(ROOT, name === "favicon-32.png" || name.startsWith("favicon") || name.startsWith("apple") || name.startsWith("icon") ? name : name));
  console.log("favicon:", name, size);
}

// --- OG share image 1200x630 ---
const W = 1200, H = 630;
const base = await sharp(join(IMG, "bolla-glamping-notte-montagne-1800.jpg"))
  .resize(W, H, { fit: "cover", position: "attention" })
  .toBuffer();

const overlay = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#12211A" stop-opacity="0.15"/>
      <stop offset="0.55" stop-color="#12211A" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#12211A" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <g transform="translate(80,430)">
    <circle cx="34" cy="34" r="30" fill="none" stroke="#BC6B3E" stroke-width="5.5"/>
    <path d="M13 51 L27 22 L38 39 L49 22 L63 51 Z" fill="#F6F1E7"/>
    <rect x="28" y="39" width="2.6" height="16" fill="#F6F1E7"/>
    <rect x="45.4" y="39" width="2.6" height="16" fill="#F6F1E7"/>
  </g>
  <text x="168" y="478" font-family="Georgia,serif" font-size="52" font-weight="700" letter-spacing="2" fill="#F6F1E7">MBC SRL</text>
  <text x="82" y="548" font-family="Georgia,serif" font-size="40" font-weight="600" fill="#F6F1E7">Bolle per glamping &amp; percorsi benessere</text>
  <text x="82" y="590" font-family="Arial,sans-serif" font-size="24" fill="#E7D9C7" letter-spacing="1">Cupole, saune, idromassaggio · progetti chiavi in mano</text>
</svg>`);

await sharp(base).composite([{ input: overlay, top: 0, left: 0 }]).jpeg({ quality: 82 }).toFile(join(IMG, "og-share.jpg"));
console.log("wrote og-share.jpg");
