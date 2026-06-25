// Genera íconos PWA placeholder (PNG) sin dependencias externas.
// Fondo teal con un círculo blanco centrado. Reemplazar por el branding real
// de la clínica cuando esté disponible. Uso: `npm run gen:icons`.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "icons");

const BG = [13, 148, 136]; // #0d9488 (teal-600)
const FG = [255, 255, 255];

// CRC32 (PNG usa el polinomio estándar IEEE).
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function makePng(size, circleRatio) {
  const r = (size / 2) * circleRatio;
  const cx = size / 2;
  const cy = size / 2;

  // Datos crudos RGBA con byte de filtro 0 por fila.
  const rowLen = size * 4 + 1;
  const raw = Buffer.alloc(rowLen * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filtro None
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const inside = dx * dx + dy * dy <= r * r;
      const [cr, cg, cb] = inside ? FG : BG;
      const o = y * rowLen + 1 + x * 4;
      raw[o] = cr;
      raw[o + 1] = cg;
      raw[o + 2] = cb;
      raw[o + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });

const files = [
  ["icon-192.png", 192, 0.62],
  ["icon-512.png", 512, 0.62],
  // Maskable: círculo más pequeño para respetar la safe zone (~80%).
  ["icon-maskable-512.png", 512, 0.5],
  ["apple-touch-icon.png", 180, 0.62],
];

for (const [name, size, ratio] of files) {
  writeFileSync(join(OUT_DIR, name), makePng(size, ratio));
  console.log(`✓ public/icons/${name} (${size}x${size})`);
}
