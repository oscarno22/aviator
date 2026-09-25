// Generates PWA icons without any image dependency: a small attitude-indicator
// glyph (sky over ground, horizon bar, aircraft symbol) written as PNG via zlib.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const BG = [11, 18, 32];
const SKY = [56, 132, 227];
const GROUND = [139, 90, 43];
const WHITE = [245, 247, 250];
const YELLOW = [250, 204, 21];

function glyph(size, maskable) {
  const cx = size / 2, cy = size / 2;
  const R = maskable ? size * 0.34 : size * 0.44;
  return (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) return maskable ? [...BG, 255] : (d > R + 1.5 ? [0, 0, 0, 0] : [...WHITE, 255]);
    if (d > R - size * 0.018) return [...WHITE, 255];
    // aircraft symbol: center dot + wings
    const wingHalf = size * 0.19, wingT = size * 0.022;
    if (Math.abs(dy) < wingT && Math.abs(dx) < wingHalf && Math.abs(dx) > size * 0.045) return [...YELLOW, 255];
    if (d < size * 0.03) return [...YELLOW, 255];
    if (Math.abs(dy) < size * 0.008) return [...WHITE, 255]; // horizon
    return dy < 0 ? [...SKY, 255] : [...GROUND, 255];
  };
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", png(192, glyph(192, false)));
writeFileSync("public/icons/icon-512.png", png(512, glyph(512, false)));
writeFileSync("public/icons/icon-maskable-512.png", png(512, glyph(512, true)));
writeFileSync("public/icons/apple-touch-icon.png", png(180, glyph(180, true)));
console.log("icons written");
