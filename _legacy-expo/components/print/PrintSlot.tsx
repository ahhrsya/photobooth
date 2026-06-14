import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { usePrintAudio } from "../../hooks/usePrintAudio";
import { colors } from "../../constants/theme";

interface PrintSlotProps {
  children: React.ReactNode;
  cardWidth: number;
  cardHeight: number;
  onAnimationComplete: () => void;
  autoPlay?: boolean;
  containerStyle?: ViewStyle;
}

export const PrintSlot: React.FC<PrintSlotProps> = ({
  children,
  cardWidth,
  cardHeight,
  onAnimationComplete,
  autoPlay = true,
  containerStyle,
}) => {
  const translateY = useSharedValue(cardHeight + 40);
  const rotateZ = useSharedValue(1.5);
  const opacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);
  const wobble = useSharedValue(0);

  // drag after print
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const audio = usePrintAudio();

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const playSound = () => {
    audio.play();
  };

  const startPrint = () => {
    opacity.value = withTiming(1, { duration: 150 });
    shadowOpacity.value = withTiming(0.35, { duration: 1200 });

    // Sound + light haptic on contact
    runOnJS(playSound)();
    setTimeout(() => {
      runOnJS(triggerHaptic)();
    }, 30);

    // Main slide-up
    translateY.value = withSequence(
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
      // micro-wobble: 3 damped oscillations
      withTiming(-6, { duration: 80, easing: Easing.out(Easing.cubic) }),
      withSpring(2, { damping: 6, stiffness: 220, mass: 0.6 }),
      withSpring(-1, { damping: 6, stiffness: 220, mass: 0.6 }),
      withSpring(0, { damping: 8, stiffness: 220, mass: 0.6 }),
    );

    // Rotation: tilt 1.5° → straighten
    rotateZ.value = withSequence(
      withTiming(1.5, { duration: 0 }),
      withDelay(
        200,
        withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) })
      )
    );

    // Completion callbacks
    setTimeout(() => {
      runOnJS(triggerHaptic)();
    }, 1100);

    setTimeout(() => {
      runOnJS(onAnimationComplete)();
    }, 1400);
  };

  useEffect(() => {
    if (autoPlay) {
      const t = setTimeout(startPrint, 80);
      return () => clearTimeout(t);
    }
  }, [autoPlay]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value + dragY.value + wobble.value },
      { translateX: dragX.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
    opacity: opacity.value,
    shadowOpacity: shadowOpacity.value,
  }));

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      dragX.value = e.translationX;
      dragY.value = e.translationY;
    })
    .onEnd(() => {
      dragX.value = withSpring(0, { damping: 14, stiffness: 120 });
      dragY.value = withSpring(0, { damping: 14, stiffness: 120 });
    });

  return (
    <View style={[styles.root, containerStyle]}>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.card,
            {
              width: cardWidth,
              height: cardHeight,
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 12 },
              shadowRadius: 24,
              elevation: 16,
            },
            cardStyle,
          ]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "transparent",
  },
});
