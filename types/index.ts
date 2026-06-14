// Shared types for Photobooth + Journal

export type Format = "strip" | "polaroid";

export interface Template {
  id: string;
  name: string;
  tags: string[];
  format: "strip" | "polaroid" | "both";
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius?: number;
  photoGap: number;
  photoBorderRadius?: number;
  showDate: boolean;
  showCaption: boolean;
  fontFamily?: string;
  textColor: string;
  overlayAsset?: string;
  overlayOpacity?: number;
  thumbnail?: string;
}

// ----- Journal -----

export type PaperBg =
  | { type: "color"; value: string }
  | { type: "paper"; value: string } // texture preset id
  | { type: "grid"; value: string }
  | { type: "dot"; value: string }
  | { type: "lined"; value: string };

export interface BaseItem {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
}

export interface PhotoItem extends BaseItem {
  type: "photo";
  src: string; // dataURL or media-key reference
  width: number;
  height: number;
  frame?: "polaroid" | "tape" | "none";
}

export interface TextItem extends BaseItem {
  type: "text";
  text: string;
  font: "handwriting-1" | "handwriting-2" | "marker" | "serif";
  size: number;
  color: string;
  width: number;
}

export interface StickerItem extends BaseItem {
  type: "sticker";
  assetId: string;
  width: number;
  height: number;
}

export interface TapeItem extends BaseItem {
  type: "tape";
  assetId: string;
  width: number;
  height: number;
}

export interface DoodleItem extends BaseItem {
  type: "doodle";
  paths: { points: [number, number][]; color: string; width: number }[];
  width: number;
  height: number;
}

export type PageItem =
  | PhotoItem
  | TextItem
  | StickerItem
  | TapeItem
  | DoodleItem;

export interface JournalPage {
  id: string;
  background: PaperBg;
  items: PageItem[];
}

export interface Journal {
  id: string;
  title: string;
  cover: string; // preset id from constants/covers.ts
  createdAt: number;
  updatedAt: number;
  pages: JournalPage[];
}
