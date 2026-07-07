/* Generator ikon PWA EscapeWorld — czysty Node (zlib), bez zależności.
   Uruchomienie: node tools/make-icons.js */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ── minimalny enkoder PNG (RGBA, filtr 0) ── */
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixelFn) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtr 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ── rysunek: ciemne tło, neonowy pierścień ◉ z poświatą i celownikiem ── */
function mix(c1, c2, t) { return c1.map((v, i) => Math.round(v + (c2[i] - v) * t)); }

function drawIcon(size) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.30;          // promień pierścienia
  const ring = size * 0.045;      // grubość pierścienia
  const dot = size * 0.10;        // środkowa kropka
  const bgTop = [12, 19, 34], bgBot = [7, 11, 20];
  const cyan = [0, 229, 255];

  return png(size, (x, y) => {
    // tło — pionowy gradient + delikatna siatka
    let c = mix(bgTop, bgBot, y / size);
    if ((x % Math.round(size / 12) === 0 || y % Math.round(size / 12) === 0)) {
      c = mix(c, cyan, 0.05);
    }
    const d = Math.hypot(x - cx, y - cy);

    // poświata wokół pierścienia
    const glow = Math.max(0, 1 - Math.abs(d - R) / (size * 0.16));
    if (glow > 0) c = mix(c, cyan, glow * glow * 0.35);

    // celownik (cienkie linie przez środek, przerwane przy pierścieniu)
    const onCross = (Math.abs(x - cx) < size * 0.008 || Math.abs(y - cy) < size * 0.008);
    if (onCross && d > R + ring * 2 && d < size * 0.46) c = mix(c, cyan, 0.55);

    // pierścień
    const ringT = Math.max(0, 1 - Math.abs(d - R) / ring);
    if (ringT > 0) c = mix(c, cyan, Math.min(1, ringT * 1.6));

    // środkowa kropka
    if (d < dot) c = mix(c, cyan, 1);
    else if (d < dot + size * 0.012) c = mix(c, cyan, 1 - (d - dot) / (size * 0.012));

    return [c[0], c[1], c[2], 255];
  });
}

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), drawIcon(size));
  console.log(`icons/icon-${size}.png ✓`);
}
