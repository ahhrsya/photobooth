import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from "react-native-reanimated";
import { Screen } from "../components/ui/Screen";
import { colors, radius, spacing } from "../constants/theme";
import { usePhotoboothStore } from "../store/usePhotoboothStore";
import { Format } from "../types";

const FORMATS: { id: Format; label: string; sub: string; shape: "strip" | "square" }[] = [
  { id: "strip", label: "Photo Strip", sub: "3 frames, one roll", shape: "strip" },
  { id: "polaroid", label: "Polaroid", sub: "1 frame, classic feel", shape: "square" },
];

const FloatingPreview: React.FC<{ shape: "strip" | "square" }> = ({ shape }) => {
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  if (shape === "strip") {
    return (
      <Animated.View style={[styles.stripMock, style]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.stripCell} />
        ))}
      </Animated.View>
    );
  }
  return <Animated.View style={[styles.polaroidMock, style]} />;
};

export default function HomeScreen() {
  const router = useRouter();
  const [hover, setHover] = useState<Format | null>(null);
  const setFormat = usePhotoboothStore((s) => s.setFormat);
  const resetAll = usePhotoboothStore((s) => s.resetAll);

  useEffect(() => {
    resetAll();
  }, []);

  const onChoose = (id: Format) => {
    setFormat(id);
    usePhotoboothStore.getState().setExpectedCount(id === "strip" ? 3 : 1);
    router.push("/template-picker");
  };

  return (
    <Screen bg={colors.background}>
      <View style={styles.header}>
        <Text style={styles.brand}>devel.</Text>
        <Text style={styles.tagline}>developing your moments</Text>
      </View>

      <View style={styles.grid}>
        {FORMATS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => onChoose(f.id)}
            onPressIn={() => setHover(f.id)}
            onPressOut={() => setHover(null)}
            style={({ pressed }) => [
              styles.tile,
              (pressed || hover === f.id) && styles.tileHover,
            ]}
          >
            <FloatingPreview shape={f.shape} />
            <Text style={styles.tileLabel}>{f.label}</Text>
            <Text style={styles.tileSub}>{f.sub}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>tap to start your roll</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  brand: {
    fontSize: 48,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
  grid: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
    alignItems: "center",
  },
  tile: {
    flex: 1,
    aspectRatio: 0.7,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  tileHover: {
    transform: [{ scale: 1.02 }],
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tileLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.md,
    textAlign: "center",
  },
  tileSub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  stripMock: {
    width: 70,
    height: 110,
    backgroundColor: colors.white,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: colors.text,
    justifyContent: "space-between",
    padding: 4,
  },
  stripCell: {
    width: "100%",
    flex: 1,
    backgroundColor: "#D6D6D6",
    borderRadius: 2,
    marginVertical: 1,
  },
  polaroidMock: {
    width: 100,
    height: 120,
    backgroundColor: colors.white,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: colors.text,
    padding: 6,
  },
  footer: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
  },
});
