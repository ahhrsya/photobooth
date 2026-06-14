export type Format = "strip" | "polaroid";

export type FontKey =
  | "system"
  | "SpaceMono-Regular"
  | "SpaceMono-Bold"
  | "PressStart2P"
  | "Caveat"
  | "DancingScript";

export type OverlayKey =
  | "y2k-stars"
  | "film-grain"
  | "dark-vignette"
  | "pastel-sparkles"
  | "classic-stamp";

export interface Template {
  id: string;
  name: string;
  tags: string[];
  format: Format | "both";

  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius?: number;

  photoGap: number;
  photoBorderRadius?: number;

  showDate: boolean;
  showCaption: boolean;
  dateFont: FontKey;
  captionFont: FontKey;
  textColor: string;

  // Optional decorative overlay layered on top of the card
  overlayKey?: OverlayKey;
  overlayOpacity?: number;

  thumbnail: string;
}
