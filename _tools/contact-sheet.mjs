// Builds labeled contact sheets from _source/photos so we can art-direct.
import sharp from "sharp";
import { readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "_source", "photos");
const OUT = join(__dirname, "sheets");
mkdirSync(OUT, { recursive: true });

const CELL_W = 360;
const CELL_H = 300; // 240 image + 60 label
const COLS = 5;
const PER_SHEET = 25; // 5x5

const files = readdirSync(SRC).filter(f => /\.(jpe?g|png|heic)$/i.test(f)).sort();

function labelSvg(text) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return Buffer.from(
    `<svg width="${CELL_W}" height="60"><rect width="100%" height="100%" fill="#1E3328"/>` +
    `<text x="8" y="24" font-family="monospace" font-size="15" fill="#F6F1E7">${safe}</text>` +
    `<text x="8" y="46" font-family="monospace" font-size="13" fill="#BC6B3E">${'#' + (text.split('|')[0])}</text></svg>`
  );
}

async function thumb(file, idx) {
  try {
    const img = sharp(join(SRC, file), { failOn: "none" }).rotate();
    const resized = await img
      .resize(CELL_W, 240, { fit: "cover" })
      .jpeg({ quality: 70 })
      .toBuffer();
    const label = await sharp(labelSvg(`${idx} | ${file}`)).png().toBuffer();
    const cell = await sharp({ create: { width: CELL_W, height: CELL_H, channels: 3, background: "#000" } })
      .composite([{ input: resized, top: 0, left: 0 }, { input: label, top: 240, left: 0 }])
      .jpeg({ quality: 72 })
      .toBuffer();
    return { cell, ok: true };
  } catch (e) {
    const err = await sharp({ create: { width: CELL_W, height: CELL_H, channels: 3, background: "#5a1a1a" } })
      .composite([{ input: await sharp(labelSvg(`${idx} | ${file} (ERR)`)).png().toBuffer(), top: 120, left: 0 }])
      .jpeg().toBuffer();
    return { cell: err, ok: false, msg: e.message };
  }
}

let sheet = 0;
const results = [];
for (let start = 0; start < files.length; start += PER_SHEET) {
  const batch = files.slice(start, start + PER_SHEET);
  const rows = Math.ceil(batch.length / COLS);
  const composites = [];
  for (let i = 0; i < batch.length; i++) {
    const idx = start + i + 1;
    const { cell, ok, msg } = await thumb(batch[i], idx);
    results.push({ idx, file: batch[i], ok, msg });
    composites.push({ input: cell, top: Math.floor(i / COLS) * CELL_H, left: (i % COLS) * CELL_W });
  }
  const outPath = join(OUT, `sheet-${++sheet}.jpg`);
  await sharp({ create: { width: COLS * CELL_W, height: rows * CELL_H, channels: 3, background: "#000" } })
    .composite(composites)
    .jpeg({ quality: 74 })
    .toFile(outPath);
  console.log("wrote", outPath);
}
console.log("\nHEIC/errors:");
results.filter(r => !r.ok).forEach(r => console.log(" ", r.idx, r.file, "->", r.msg));
console.log("\nTotal:", files.length, "files across", sheet, "sheets");
