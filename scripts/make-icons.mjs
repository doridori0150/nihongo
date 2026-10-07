// Generates the PWA PNG icons (no image tools needed): green tile, white speech bubble, red sun.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../public/', import.meta.url));

const GREEN = [43, 79, 134];
const WHITE = [255, 255, 255];
const RED = [224, 83, 58];

function crc32(buf) {
  let c,
    crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const SS = 4;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const c = pixel((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a += 255;
          }
        }
      const n = SS * SS;
      const o = y * (size * 4 + 1) + 1 + x * 4;
      const cov = a / 255 || 1;
      raw[o] = Math.round(r / cov);
      raw[o + 1] = Math.round(g / cov);
      raw[o + 2] = Math.round(b / cov);
      raw[o + 3] = Math.round(a / n);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRoundRect(u, v, r) {
  const dx = Math.max(r - u, 0, u - (1 - r));
  const dy = Math.max(r - v, 0, v - (1 - r));
  return dx * dx + dy * dy <= r * r;
}

function inTriangle(px, py, a, b, c) {
  const side = (p, q) => (px - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (py - q[1]);
  const d1 = side(a, b);
  const d2 = side(b, c);
  const d3 = side(c, a);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/** @param full fill the whole square (maskable) instead of a rounded tile */
function design(full) {
  return (u, v) => {
    if (!full && !inRoundRect(u, v, 0.22)) return null;
    const scale = full ? 0.8 : 1; // keep the bubble inside the maskable safe zone
    const x = 0.5 + (u - 0.5) / scale;
    const y = 0.5 + (v - 0.5) / scale;
    const cx = 0.5,
      cy = 0.47,
      R = 0.31;
    const d2 = (x - cx) ** 2 + (y - cy) ** 2;
    if (d2 <= 0.115 ** 2) return RED;
    if (d2 <= R * R) return WHITE;
    if (inTriangle(x, y, [0.29, 0.62], [0.42, 0.74], [0.22, 0.86])) return WHITE;
    return GREEN;
  };
}

writeFileSync(OUT + 'icon-192.png', png(192, design(false)));
writeFileSync(OUT + 'icon-512.png', png(512, design(false)));
writeFileSync(OUT + 'icon-maskable-512.png', png(512, design(true)));
console.log('icons written');
