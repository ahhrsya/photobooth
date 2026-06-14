import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { colors } from "../../constants/theme";
import { sizes } from "../../constants/dimensions";

interface CountdownOverlayProps {
  onComplete: () => void;
  duration?: number;
  trigger: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  onComplete,
  duration = 3,
  trigger,
}) => {
  const [label, setLabel] = useState<string>("");
  const scale = useSharedValue(1.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    let cancelled = false;

    const animate = async () => {
      for (let i = duration; i >= 1; i--) {
        if (cancelled) return;
        setLabel(String(i));
        scale.value = 1.5;
        opacity.value = 1;
        scale.value = withTiming(1, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withSequence(
          withTiming(1, { duration: 50 }),
          withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) })
        );
        await new Promise((r) => setTimeout(r, 800));
      }
      if (cancelled) return;
      setLabel("");
      onComplete();
    };

    animate();
    return () => {
      cancelled = true;
    };
  }, [trigger]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!label) return null;

  return (
    <Animated.View style={[styles.root, animStyle]} pointerEvents="none">
      <Animated.Text style={styles.text}>{label}</Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: colors.white,
    fontSize: sizes.countdownFont,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 4 },
  },
});
