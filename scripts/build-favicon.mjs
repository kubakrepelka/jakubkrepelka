/* ═══════════════════════════════════════════════════════════════
   FAVICON — the nav's JK mark
   ═══════════════════════════════════════════════════════════════

   Same letters, same font, same background as the site: `JK` set in
   Archivo at `wdth 70 / wght 900` with 0.02em letter-spacing — exactly
   what `.nav__mark` renders — in cream on ink.

   A favicon can't load a webfont, so the two glyph outlines are baked in
   below. Google Fonts only serves static Archivo instances on the named
   width stops, so these were lifted from the extra-condensed (wdth 62.5)
   and condensed (wdth 75) instances and interpolated to 70 — the axis is
   linear between those stops, so this is the curve the browser draws.
   Font units, 1000/em, y already flipped screen-down: cap line at 312,
   baseline at 1000.

     node scripts/build-favicon.mjs        # → public/

   ═══════════════════════════════════════════════════════════════ */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/* ── palette (src/style.css) ─────────────────────────────────── */
const INK   = [0x05, 0x05, 0x05];
const CREAM = [0xF2, 0xED, 0xE3];

/* ── Archivo, wdth 70 · wght 900 ─────────────────────────────── */
const UPEM = 1000;
const CAP = 312, BASELINE = 1000;                  // font units, y-down
const TRACK = 0.02 * UPEM;                         // .nav__mark letter-spacing

const GLYPHS = [
  { adv: 498, d: 'M228.8 1012Q163.8 1012 114 991.3Q64.2 970.6 36.4 923.7Q8.6 876.8 8.6 799.4L8.6 756.8L192 756.8L192 791.2Q192 821.4 199.7 837.3Q207.4 853.2 230 853.2Q253 853.2 260.9 837.3Q268.8 821.4 268.8 791.2L268.8 312L459.6 312L459.6 799Q459.6 875.8 429.4 923.2Q399.2 970.6 347.2 991.3Q295.2 1012 228.8 1012Z' },
  { adv: 577.6, d: 'M47.2 1000L47.2 312L238.4 312L238.4 592.6L367.2 312L574 312L426.4 610.8L579 1000L366 1000L295.8 772.8L238.4 840.2L238.4 1000Z' },
];

/* ── the tile ────────────────────────────────────────────────── */
const G = 64;                                      // grid
/* cap height 28 of 64 — the real Archivo JK is a wide lockup, so this is
   the size at which it still carries a margin instead of touching the
   tile edge. Lands on whole pixels from 32px up */
const CAP_TOP = 18, CAP_BOTTOM = 46;

/* ── path → contours of straight segments ────────────────────── */
/* only M / L / Q / Z appear in a glyf-derived path */
function contoursOf(d) {
  const tokens = d.match(/[MLQZ]|-?[\d.]+/g);
  const out = [];
  let cur = null, x = 0, y = 0, i = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') { cur = []; out.push(cur); x = num(); y = num(); cur.push([x, y]); }
    else if (cmd === 'L') { x = num(); y = num(); cur.push([x, y]); }
    else if (cmd === 'Q') {
      const cx = num(), cy = num(), nx = num(), ny = num();
      /* 12 steps is well past what 512px can resolve */
      for (let s = 1; s <= 12; s++) {
        const t = s / 12, u = 1 - t;
        cur.push([u * u * x + 2 * u * t * cx + t * t * nx, u * u * y + 2 * u * t * cy + t * t * ny]);
      }
      x = nx; y = ny;
    }
    else if (cmd === 'Z') cur = null;
  }
  return out;
}

/* ── set "JK" ────────────────────────────────────────────────── */
const placed = [];
let pen = 0;
for (const g of GLYPHS) {
  for (const c of contoursOf(g.d)) placed.push(c.map(([x, y]) => [x + pen, y]));
  pen += g.adv + TRACK;
}

/* fit by ink, not by advance — the sidebearings would throw it off-centre */
const xs = placed.flat().map(p => p[0]);
const inkL = Math.min(...xs), inkR = Math.max(...xs);

const SCALE = (CAP_BOTTOM - CAP_TOP) / (BASELINE - CAP);
const LEFT = (G - (inkR - inkL) * SCALE) / 2;

const POLYS = placed.map(c => c.map(([x, y]) => [
  LEFT + (x - inkL) * SCALE,
  CAP_TOP + (y - CAP) * SCALE,
]));

/* ── inside test — nonzero winding, as TrueType intends ──────── */
function inLetters(px, py) {
  let wind = 0;
  for (const poly of POLYS) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (yi <= py) {
        if (yj > py && (xj - xi) * (py - yi) - (px - xi) * (yj - yi) > 0) wind++;
      } else if (yj <= py && (xj - xi) * (py - yi) - (px - xi) * (yj - yi) < 0) wind--;
    }
  }
  return wind !== 0;
}

/* ═══ SVG ═══════════════════════════════════════════════════════ */
const n = v => Number(v.toFixed(2));
const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');

function svg() {
  /* the transform the rasteriser applies, handed to the renderer instead */
  /* the scale needs real precision — two decimals is a 7% error here */
  const t = `translate(${n(LEFT - inkL * SCALE)} ${n(CAP_TOP - CAP * SCALE)}) scale(${SCALE.toFixed(6)})`;
  const paths = GLYPHS.map((g, i) => {
    const dx = GLYPHS.slice(0, i).reduce((a, p) => a + p.adv + TRACK, 0);
    return `    <path d="${g.d}" transform="translate(${n(dx)} 0)"/>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${G} ${G}" role="img" aria-label="JK">
  <rect width="${G}" height="${G}" fill="${hex(INK)}"/>
  <g fill="${hex(CREAM)}" transform="${t}">
${paths}
  </g>
</svg>
`;
}

/* ═══ raster ════════════════════════════════════════════════════ */
/* 6×6 supersampling so the diagonals and the J's bowl stay smooth */
function render(size, { inset = 0 } = {}) {
  const px = new Uint8Array(size * size * 4);
  const S = 6, inv = 1 / (S * S);
  const art = G * (1 - inset * 2);
  const scale = G / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const gx = ((x + (sx + 0.5) / S) * scale - G * inset) * (G / art);
          const gy = ((y + (sy + 0.5) / S) * scale - G * inset) * (G / art);
          const c = inLetters(gx, gy) ? CREAM : INK;
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const i = (y * size + x) * 4;
      px[i] = Math.round(r * inv); px[i + 1] = Math.round(g * inv);
      px[i + 2] = Math.round(b * inv); px[i + 3] = 255;
    }
  }
  return px;
}

/* ── minimal PNG writer ─────────────────────────────────────── */
const CRC = (() => {
  const t = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();
const crc32 = buf => {
  let c = ~0;
  for (const byte of buf) c = CRC[(c ^ byte) & 0xFF] ^ (c >>> 8);
  return ~c >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function png(size, px) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;                              // filter: none
    Buffer.from(px.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;                                 // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ── ICO — PNG-encoded entries, understood everywhere since IE11 ── */
function ico(entries) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(entries.length, 4);
  let offset = 6 + entries.length * 16;
  const dir = [], blobs = [];
  for (const { size, data } of entries) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size; e[1] = size >= 256 ? 0 : size;
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8); e.writeUInt32LE(offset, 12);
    offset += data.length;
    dir.push(e); blobs.push(data);
  }
  return Buffer.concat([head, ...dir, ...blobs]);
}

/* ═══ write ═════════════════════════════════════════════════════ */
mkdirSync(OUT, { recursive: true });
const wrote = [];
const put = (name, buf) => { writeFileSync(join(OUT, name), buf); wrote.push([name, buf.length]); };

put('favicon.svg', Buffer.from(svg(), 'utf8'));
put('favicon.ico', ico([16, 32, 48].map(size => ({ size, data: png(size, render(size)) }))));
put('favicon-96.png', png(96, render(96)));
put('icon-192.png', png(192, render(192)));
put('icon-512.png', png(512, render(512)));

/* iOS rounds the corners itself, so the mark is pulled in to clear the mask */
put('apple-touch-icon.png', png(180, render(180, { inset: 0.07 })));

put('site.webmanifest', Buffer.from(JSON.stringify({
  name: 'Jakub Křepelka',
  short_name: 'JK',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
  theme_color: '#050505',
  background_color: '#050505',
  display: 'standalone',
}, null, 2) + '\n', 'utf8'));

for (const [name, bytes] of wrote) console.log(`  ${name.padEnd(22)} ${(bytes / 1024).toFixed(1)} kB`);
