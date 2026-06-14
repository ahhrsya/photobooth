import { useEffect } from "react";
import { useAudioPlayer } from "expo-audio";
import { Platform } from "react-native";

const PRINT_SOUND = require("../assets/sounds/print.wav");

interface PrintAudio {
  play: () => void;
}

export const usePrintAudio = (): PrintAudio => {
  const player = useAudioPlayer(PRINT_SOUND);

  useEffect(() => {
    if (Platform.OS === "web") return;
    try {
      player.volume = 0.85;
      player.pause();
    } catch (e) {
      // best-effort
    }
  }, [player]);

  const play = () => {
    if (Platform.OS === "web") return;
    try {
      // Reset to start before each play
      player.seekTo(0);
      player.play();
    } catch (e) {
      // swallow
    }
  };

  return { play };
};
