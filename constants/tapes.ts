// Washi tape presets — CSS gradients for MVP.

export interface TapePreset {
  id: string;
  name: string;
  css: string;
}

export const TAPES: TapePreset[] = [
  {
    id: "pink",
    name: "Pink",
    css: "repeating-linear-gradient(45deg, rgba(255,111,165,0.85) 0 8px, rgba(255,140,180,0.85) 8px 16px)",
  },
  {
    id: "kraft",
    name: "Kraft",
    css: "linear-gradient(180deg, rgba(184, 132, 75, 0.85), rgba(140, 92, 50, 0.85))",
  },
  {
    id: "mint",
    name: "Mint",
    css: "repeating-linear-gradient(0deg, rgba(168,216,185,0.85) 0 14px, rgba(190,228,205,0.85) 14px 28px)",
  },
  {
    id: "polka",
    name: "Polka",
    css: "radial-gradient(circle, rgba(255,255,255,0.95) 1px, transparent 2px) 0 0/8px 8px, rgba(158,197,232,0.85)",
  },
  {
    id: "stars",
    name: "Stars",
    css: "linear-gradient(120deg, rgba(255,217,114,0.85), rgba(255,170,80,0.85))",
  },
  {
    id: "noir",
    name: "Noir",
    css: "repeating-linear-gradient(90deg, rgba(20,20,20,0.85) 0 6px, rgba(50,50,50,0.85) 6px 12px)",
  },
];
