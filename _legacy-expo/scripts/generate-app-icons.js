// Generates:
//   assets/icon.png         (1024x1024, app icon)
//   assets/adaptive-icon.png (1024x1024, foreground for Android adaptive)
//   assets/splash.png       (1284x2778, splash)
//   assets/favicon.png      (48x48, web)
//
// All PNGs are valid, written by hand to avoid any image-processing dependency.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePNG(width, height, drawPixel) {
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
  const filtered = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (width * 4 + 1)] = 0;
    pixels.copy(filtered, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(filtered);
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
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
}

// 5x7 pixel font for "devel." — enough for a small wordmark in the icon.
const FONT_5x7 = {
  d: ["01110","10001","10001","10011","10101","10001","10001","01110"],
  e: ["01110","10001","10001","11111","10000","10000","10001","01110"],
  v: ["10001","10001","10001","10001","10001","01010","01010","00100"],
  l: ["11000","10000","10000","10000","10000","10000","10001","01110"],
  ".": ["00000","00000","00000","00000","00000","00000","00000","00100"],
  " ": ["00000","00000","00000","00000","00000","00000","00000","00000"],
};

function drawText(pixels, width, text, x0, y0, scale, color) {
  const glyphW = 6 * scale; // 5px + 1px gap
  let cursor = x0;
  for (const ch of text) {
    const glyph = FONT_5x7[ch] || FONT_5x7[" "];
    for (let gy = 0; gy < 8; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (glyph[gy][gx] === "1") {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const x = cursor + gx * scale + sx;
              const y = y0 + gy * scale + sy;
              if (x < 0 || y < 0 || x >= width || y >= pixels.length / (width * 4)) continue;
              const i = (y * width + x) * 4;
              pixels[i] = color[0];
              pixels[i + 1] = color[1];
              pixels[i + 2] = color[2];
              pixels[i + 3] = color[3];
            }
          }
        }
      }
    }
    cursor += glyphW;
  }
}

const out = path.join(__dirname, "..", "assets");
fs.mkdirSync(out, { recursive: true });

// === App icon (1024x1024) ===
// Cream background + dark cream border + small film-strip mark + wordmark.
const ICON_W = 1024;
const icon = Buffer.alloc(ICON_W * ICON_W * 4, 0);
const rand = mulberry32(123);

for (let y = 0; y < ICON_W; y++) {
  for (let x = 0; x < ICON_W; x++) {
    const i = (y * ICON_W + x) * 4;
    // base cream
    icon[i] = 0xFF;
    icon[i + 1] = 0xF5;
    icon[i + 2] = 0xF0;
    icon[i + 3] = 255;
  }
}

// Border ring
const borderW = 32;
for (let y = 0; y < ICON_W; y++) {
  for (let x = 0; x < ICON_W; x++) {
    const onEdge =
      x < borderW || x >= ICON_W - borderW ||
      y < borderW || y >= ICON_W - borderW;
    if (onEdge) {
      const i = (y * ICON_W + x) * 4;
      icon[i] = 0x1A; icon[i + 1] = 0x1A; icon[i + 2] = 0x1A; icon[i + 3] = 255;
    }
  }
}

// Film-strip motif: 3 horizontal dark rectangles with rounded look in center
const stripX = 220;
const stripY = 240;
const stripW = 584;
const stripH = 460;
const stripRadius = 24;
for (let y = stripY; y < stripY + stripH; y++) {
  for (let x = stripX; x < stripX + stripW; x++) {
    const dx = Math.max(stripX + stripRadius - x, x - (stripX + stripW - stripRadius - 1), 0);
    const dy = Math.max(stripY + stripRadius - y, y - (stripY + stripH - stripRadius - 1), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (x >= stripX && x < stripX + stripW && y >= stripY && y < stripY + stripH && dist <= stripRadius) {
      const i = (y * ICON_W + x) * 4;
      icon[i] = 0x1A; icon[i + 1] = 0x1A; icon[i + 2] = 0x1A; icon[i + 3] = 255;
    }
  }
}
// Sprocket holes on the sides of the strip
for (let i = 0; i < 4; i++) {
  const holeY = stripY + 30 + i * 110;
  for (let dy = -22; dy <= 22; dy++) {
    for (let dx = -22; dx <= 22; dx++) {
      if (dx * dx + dy * dy > 22 * 22) continue;
      for (const sx of [stripX + 24, stripX + stripW - 24 - 0]) {
        const x = sx + dx;
        const y = holeY + dy;
        if (x < 0 || y < 0 || x >= ICON_W || y >= ICON_W) continue;
        const idx = (y * ICON_W + x) * 4;
        icon[idx] = 0xFF; icon[idx + 1] = 0xF5; icon[idx + 2] = 0xF0; icon[idx + 3] = 255;
      }
    }
  }
}
// Cream photo windows inside strip
const padX = 90;
const padY = 90;
const gap = 20;
const photoH = (stripH - padY * 2 - gap * 2) / 3;
for (let p = 0; p < 3; p++) {
  const py = stripY + padY + p * (photoH + gap);
  for (let y = py; y < py + photoH; y++) {
    for (let x = stripX + padX; x < stripX + stripW - padX; x++) {
      const i = (y * ICON_W + x) * 4;
      icon[i] = 0xFF; icon[i + 1] = 0xF5; icon[i + 2] = 0xF0; icon[i + 3] = 255;
    }
  }
}

// Wordmark below strip
drawText(icon, ICON_W, "devel.", 320, 760, 18, [0x1A, 0x1A, 0x1A, 255]);
// tiny tagline
drawText(icon, ICON_W, "developing moments", 220, 900, 6, [0x6B, 0x6B, 0x6B, 255]);

fs.writeFileSync(path.join(out, "icon.png"), makePNG(ICON_W, ICON_W, (x, y) => {
  const i = (y * ICON_W + x) * 4;
  return [icon[i], icon[i + 1], icon[i + 2], icon[i + 3]];
}));

// === Adaptive icon foreground (1024x1024) ===
// Same mark but tighter (Android crops to a circle/squircle so leave padding).
const A_W = 1024;
const adaptive = Buffer.alloc(A_W * A_W * 4, 0); // transparent
// Reuse the strip motif only, centred, with a transparent surround so the
// platform background shows through.
const sX = 360, sY = 320, sW = 304, sH = 384, sR = 18;
for (let y = 0; y < A_W; y++) {
  for (let x = 0; x < A_W; x++) {
    const dx = Math.max(sX + sR - x, x - (sX + sW - sR - 1), 0);
    const dy = Math.max(sY + sR - y, y - (sY + sH - sR - 1), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= sR) {
      const i = (y * A_W + x) * 4;
      adaptive[i] = 0x1A; adaptive[i + 1] = 0x1A; adaptive[i + 2] = 0x1A; adaptive[i + 3] = 255;
    }
  }
}
fs.writeFileSync(path.join(out, "adaptive-icon.png"), makePNG(A_W, A_W, (x, y) => {
  const i = (y * A_W + x) * 4;
  return [adaptive[i], adaptive[i + 1], adaptive[i + 2], adaptive[i + 3]];
}));

// === Splash (1284x2778) ===
// Solid cream + wordmark centred
const S_W = 1284, S_H = 2778;
const splash = Buffer.alloc(S_W * S_H * 4);
for (let y = 0; y < S_H; y++) {
  for (let x = 0; x < S_W; x++) {
    const i = (y * S_W + x) * 4;
    splash[i] = 0xFF; splash[i + 1] = 0xF5; splash[i + 2] = 0xF0; splash[i + 3] = 255;
  }
}
const wordmark = "devel.";
const wScale = 36;
const wWidth = wordmark.length * 6 * wScale;
const wX = Math.floor((S_W - wWidth) / 2);
const wY = Math.floor((S_H - 8 * wScale) / 2);
drawText(splash, S_W, wordmark, wX, wY, wScale, [0x1A, 0x1A, 0x1A, 255]);
// tagline
const tag = "developing your moments";
const tScale = 10;
const tWidth = tag.length * 6 * tScale;
const tX = Math.floor((S_W - tWidth) / 2);
drawText(splash, S_W, tag, tX, wY + 8 * wScale + 40, tScale, [0x6B, 0x6B, 0x6B, 255]);

fs.writeFileSync(path.join(out, "splash.png"), makePNG(S_W, S_H, (x, y) => {
  const i = (y * S_W + x) * 4;
  return [splash[i], splash[i + 1], splash[i + 2], splash[i + 3]];
}));

// === Favicon (48x48) ===
const F_W = 48;
const favicon = Buffer.alloc(F_W * F_W * 4);
for (let y = 0; y < F_W; y++) {
  for (let x = 0; x < F_W; x++) {
    const i = (y * F_W + x) * 4;
    favicon[i] = 0xFF; favicon[i + 1] = 0xF5; favicon[i + 2] = 0xF0; favicon[i + 3] = 255;
  }
}
// Small dark frame
for (let y = 0; y < F_W; y++) {
  for (let x = 0; x < F_W; x++) {
    const onEdge = x < 3 || x >= F_W - 3 || y < 3 || y >= F_W - 3;
    if (onEdge) {
      const i = (y * F_W + x) * 4;
      favicon[i] = 0x1A; favicon[i + 1] = 0x1A; favicon[i + 2] = 0x1A; favicon[i + 3] = 255;
    }
  }
}
// Centered dark dot
for (let y = 16; y < 32; y++) {
  for (let x = 16; x < 32; x++) {
    const i = (y * F_W + x) * 4;
    favicon[i] = 0x1A; favicon[i + 1] = 0x1A; favicon[i + 2] = 0x1A; favicon[i + 3] = 255;
  }
}
fs.writeFileSync(path.join(out, "favicon.png"), makePNG(F_W, F_W, (x, y) => {
  const i = (y * F_W + x) * 4;
  return [favicon[i], favicon[i + 1], favicon[i + 2], favicon[i + 3]];
}));

console.log("✓ wrote icon, adaptive-icon, splash, favicon");
