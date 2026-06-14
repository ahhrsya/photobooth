import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors } from "../../constants/theme";

interface CameraFlashProps {
  trigger: number;
  onComplete?: () => void;
}

export const CameraFlash: React.FC<CameraFlashProps> = ({
  trigger,
  onComplete,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    opacity.value = withTiming(
      1,
      { duration: 50, easing: Easing.out(Easing.cubic) },
      () => {
        opacity.value = withTiming(0, { duration: 220 }, (finished) => {
          if (finished && onComplete) {
            // schedule on JS thread callback
            setTimeout(onComplete, 0);
          }
        });
      }
    );
  }, [trigger]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.root, style]}
    />
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
  },
});
