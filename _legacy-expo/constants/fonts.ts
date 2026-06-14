import { FontKey } from "../types";

// Path to bundled font file, mapped to a fontFamily string we can use in styles.
export const FONT_SOURCES: Record<Exclude<FontKey, "system">, number> = {
  "SpaceMono-Regular": require("../assets/fonts/SpaceMono-Regular.ttf"),
  "SpaceMono-Bold": require("../assets/fonts/SpaceMono-Bold.ttf"),
  "PressStart2P": require("../assets/fonts/PressStart2P-Regular.ttf"),
  "Caveat": require("../assets/fonts/Caveat-Variable.ttf"),
  "DancingScript": require("../assets/fonts/DancingScript-Variable.ttf"),
};

// Map our internal key → fontFamily string used in StyleSheet
export const FONT_FAMILY: Record<FontKey, string | undefined> = {
  system: undefined,
  "SpaceMono-Regular": "SpaceMono-Regular",
  "SpaceMono-Bold": "SpaceMono-Bold",
  "PressStart2P": "PressStart2P",
  "Caveat": "Caveat",
  "DancingScript": "DancingScript",
};
