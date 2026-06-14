import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

export const sizes = {
  cardStripWidth: Math.min(SCREEN_WIDTH * 0.72, 320),
  cardStripHeight: Math.min(SCREEN_HEIGHT * 0.62, 620),
  cardPolaroidWidth: Math.min(SCREEN_WIDTH * 0.78, 360),
  cardPolaroidHeight: Math.min(SCREEN_HEIGHT * 0.72, 720),
  slotHeight: 14,
  captureButton: 76,
  countdownFont: 140,
};

export const STRIP_PHOTO_COUNT = 3;
