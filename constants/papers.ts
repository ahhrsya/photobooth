// Background paper presets for journal pages.

import type { PaperBg } from "@/types";

export interface PaperPreset {
  id: string;
  name: string;
  bg: PaperBg;
  // CSS background applied to the page (preview)
  css: string;
}

export const PAPERS: PaperPreset[] = [
  {
    id: "cream",
    name: "Cream",
    bg: { type: "color", value: "#FBF6EE" },
    css: "#FBF6EE",
  },
  {
    id: "kraft",
    name: "Kraft",
    bg: { type: "color", value: "#E8D5B7" },
    css: "#E8D5B7",
  },
  {
    id: "lined",
    name: "Lined",
    bg: { type: "lined", value: "#FBFAF7" },
    css: "repeating-linear-gradient(#FBFAF7 0 28px, #C9C0B0 28px 29px)",
  },
  {
    id: "grid",
    name: "Grid",
    bg: { type: "grid", value: "#FBFAF7" },
    css: "linear-gradient(#FBFAF7, #FBFAF7), repeating-linear-gradient(0deg, #D8D2C2 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, #D8D2C2 0 1px, transparent 1px 24px)",
  },
  {
    id: "dot",
    name: "Dotted",
    bg: { type: "dot", value: "#FBFAF7" },
    css: "radial-gradient(circle at 12px 12px, #C8C0B0 1.2px, transparent 1.5px) 0 0/24px 24px, #FBFAF7",
  },
  {
    id: "pink",
    name: "Blush",
    bg: { type: "color", value: "#FCE4EC" },
    css: "#FCE4EC",
  },
  {
    id: "sky",
    name: "Sky",
    bg: { type: "color", value: "#E3F2FD" },
    css: "#E3F2FD",
  },
  {
    id: "black",
    name: "Black",
    bg: { type: "color", value: "#161616" },
    css: "#161616",
  },
];

export const getPaperById = (id: string) =>
  PAPERS.find((p) => p.id === id) ?? PAPERS[0];
