// One-off generator for overlay assets. Run: node scripts/generate-overlays.js
// Produces assets/frames/{y2k-stars,film-grain,dark-vignette,pastel-sparkles,classic-stamp}.png
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const W = 600;
const H = 800;

function makePNG(width, height, drawPixel) {
  // Build RGBA buffer
  const pixels = Buffer.alloc(width * height * 4, 0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y);
      const i = (y * width + x) * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = a;
    }
  }

  // Add filter byte (0) per scanline
  const filtered = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (width * 4 + 1)] = 0;
    pixels.copy(filtered, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(filtered);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  // CRC table
  const crcTable = (() => {
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
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// seeded PRNG for reproducibility
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// === Y2K stars ===
function genY2KStars() {
  const rand = mulberry32(42);
  return makePNG(W, H, (x, y) => {
    const r = rand();
    if (r < 0.0015) {
      // star core
      const brightness = 0.6 + rand() * 0.4;
      return [255, 255, 255, Math.floor(255 * brightness)];
    }
    if (r < 0.003) {
      return [255, 200, 230, 200];
    }
    return [0, 0, 0, 0];
  });
}

// === Film grain (mono noise) ===
function genFilmGrain() {
  const rand = mulberry32(7);
  return makePNG(W, H, () => {
    const v = 60 + Math.floor(rand() * 90);
    return [v, v, v, 110];
  });
}

// === Dark vignette ===
function genDarkVignette() {
  const cx = W / 2;
  const cy = H / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  return makePNG(W, H, (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.sqrt(dx * dx + dy * dy) / maxR;
    const intensity = Math.pow(Math.max(0, r - 0.5) / 0.5, 1.5) * 0.85;
    return [0, 0, 0, Math.floor(255 * intensity)];
  });
}

// === Pastel sparkles (soft bokeh) ===
function genPastelSparkles() {
  const rand = mulberry32(99);
  const sparkles = [];
  for (let i = 0; i < 80; i++) {
    sparkles.push({
      x: rand() * W,
      y: rand() * H,
      r: 8 + rand() * 24,
      c: [
        [255, 200, 220],
        [200, 230, 255],
        [220, 255, 220],
        [255, 240, 200],
      ][Math.floor(rand() * 4)],
    });
  }
  return makePNG(W, H, (x, y) => {
    for (const s of sparkles) {
      const dx = x - s.x;
      const dy = y - s.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < s.r) {
        const a = (1 - d / s.r) * 0.18;
        return [...s.c, Math.floor(255 * a)];
      }
    }
    return [255, 255, 255, 0];
  });
}

// === Classic stamp (small dotted border + corners) ===
function genClassicStamp() {
  return makePNG(W, H, (x, y) => {
    // 8 dots in top-left, bottom-right corners
    const dots = [
      [40, 40],
      [W - 40, H - 40],
    ];
    for (const [dx, dy] of dots) {
      const d = Math.sqrt((x - dx) ** 2 + (y - dy) ** 2);
      if (d < 8) return [0, 0, 0, 220];
    }
    // small "+" marks
    const marks = [
      [40, H - 40],
      [W - 40, 40],
    ];
    for (const [mx, my] of marks) {
      if ((x === mx || y === my) && Math.abs(x - mx) + Math.abs(y - my) < 10) {
        return [0, 0, 0, 220];
      }
    }
    return [0, 0, 0, 0];
  });
}

const out = path.join(__dirname, "..", "assets", "frames");
fs.mkdirSync(out, { recursive: true });

fs.writeFileSync(path.join(out, "y2k-stars.png"), genY2KStars());
fs.writeFileSync(path.join(out, "film-grain.png"), genFilmGrain());
fs.writeFileSync(path.join(out, "dark-vignette.png"), genDarkVignette());
fs.writeFileSync(path.join(out, "pastel-sparkles.png"), genPastelSparkles());
fs.writeFileSync(path.join(out, "classic-stamp.png"), genClassicStamp());

console.log("✓ generated 5 overlay PNGs in", out);
