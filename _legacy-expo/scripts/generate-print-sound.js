// One-off generator for the print sound effect.
// Produces assets/sounds/print.wav (a short, satisfying "printer" sound:
// pink-ish noise burst with a paper-whirr envelope, ~1.2s, 22050Hz mono).
const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050;
const DURATION = 1.2; // seconds
const N = Math.floor(SAMPLE_RATE * DURATION);

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate samples
const rand = mulberry32(13);
const samples = new Int16Array(N);

// Mechanical clack at t=0
const clackDecay = 0.04;
for (let i = 0; i < Math.floor(SAMPLE_RATE * clackDecay); i++) {
  const t = i / SAMPLE_RATE;
  const env = Math.exp(-t * 70);
  const v = (rand() * 2 - 1) * env * 0.6;
  samples[i] += Math.round(v * 32767);
}

// Motor whirr from 100ms onward
let lp = 0; // simple lowpass state
for (let i = Math.floor(SAMPLE_RATE * 0.08); i < N; i++) {
  const t = i / SAMPLE_RATE;
  // amplitude envelope: ramp in, sustain, fade out
  let env;
  if (t < 0.15) env = (t - 0.08) / 0.07; // ramp in
  else if (t < 0.95) env = 1;
  else env = (1.1 - t) / 0.15; // fade
  if (env < 0) env = 0;

  // noise + a touch of high-freq jitter
  const noise = rand() * 2 - 1;
  lp = lp * 0.7 + noise * 0.3; // lowpass-ish
  const jitter = Math.sin(2 * Math.PI * 90 * t) * 0.04;
  const v = (lp + jitter) * env * 0.35;
  samples[i] = Math.round(Math.max(-1, Math.min(1, v)) * 32767);
}

// Build WAV file (PCM 16-bit mono)
const dataSize = samples.length * 2;
const buf = Buffer.alloc(44 + dataSize);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + dataSize, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); // PCM chunk size
buf.writeUInt16LE(1, 20); // format = PCM
buf.writeUInt16LE(1, 22); // channels = 1
buf.writeUInt32LE(SAMPLE_RATE, 24);
buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
buf.writeUInt16LE(2, 32); // block align
buf.writeUInt16LE(16, 34); // bits per sample
buf.write("data", 36);
buf.writeUInt32LE(dataSize, 40);
for (let i = 0; i < samples.length; i++) {
  buf.writeInt16LE(samples[i], 44 + i * 2);
}

const out = path.join(__dirname, "..", "assets", "sounds");
fs.mkdirSync(out, { recursive: true });
const target = path.join(out, "print.wav");
fs.writeFileSync(target, buf);
console.log(`✓ wrote ${target} (${(buf.length / 1024).toFixed(1)} kB)`);
