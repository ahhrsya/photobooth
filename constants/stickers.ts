// Sticker library — emoji-based for MVP, swap to PNG assets when user provides them.

export interface StickerPreset {
  id: string;
  emoji: string;
  category: "cute" | "love" | "stars" | "retro" | "doodle";
}

export const STICKERS: StickerPreset[] = [
  { id: "heart-red", emoji: "❤️", category: "love" },
  { id: "heart-pink", emoji: "💗", category: "love" },
  { id: "heart-sparkle", emoji: "💖", category: "love" },
  { id: "two-hearts", emoji: "💕", category: "love" },
  { id: "star", emoji: "⭐", category: "stars" },
  { id: "sparkle", emoji: "✨", category: "stars" },
  { id: "star-glow", emoji: "🌟", category: "stars" },
  { id: "dizzy", emoji: "💫", category: "stars" },
  { id: "rainbow", emoji: "🌈", category: "cute" },
  { id: "sun", emoji: "🌞", category: "cute" },
  { id: "moon", emoji: "🌙", category: "cute" },
  { id: "cloud", emoji: "☁️", category: "cute" },
  { id: "flower", emoji: "🌸", category: "cute" },
  { id: "sunflower", emoji: "🌻", category: "cute" },
  { id: "rose", emoji: "🌹", category: "cute" },
  { id: "tulip", emoji: "🌷", category: "cute" },
  { id: "bear", emoji: "🧸", category: "cute" },
  { id: "cake", emoji: "🍰", category: "cute" },
  { id: "coffee", emoji: "☕", category: "cute" },
  { id: "boba", emoji: "🧋", category: "cute" },
  { id: "balloon", emoji: "🎈", category: "retro" },
  { id: "camera", emoji: "📷", category: "retro" },
  { id: "film", emoji: "🎞️", category: "retro" },
  { id: "vinyl", emoji: "💿", category: "retro" },
  { id: "tape", emoji: "📼", category: "retro" },
  { id: "lipstick", emoji: "💄", category: "retro" },
  { id: "fire", emoji: "🔥", category: "doodle" },
  { id: "peace", emoji: "✌️", category: "doodle" },
  { id: "ok", emoji: "👌", category: "doodle" },
  { id: "100", emoji: "💯", category: "doodle" },
];
