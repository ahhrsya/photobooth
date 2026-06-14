import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Button } from "../ui/Button";
import { colors, spacing } from "../../constants/theme";

interface ActionButtonsProps {
  onSave: () => void;
  onShare: () => void;
  saving?: boolean;
  sharing?: boolean;
  visible: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSave,
  onShare,
  saving,
  sharing,
  visible,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withDelay(
        200,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
      );
      translateY.value = withDelay(
        200,
        withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
      );
    } else {
      opacity.value = 0;
      translateY.value = 20;
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.root, style]} pointerEvents="box-none">
      <View style={styles.row}>
        <Button
          label={saving ? "Saving..." : "Save to Gallery"}
          onPress={onSave}
          loading={saving}
          style={styles.btn}
        />
        <Button
          label={sharing ? "Sharing..." : "Share"}
          onPress={onShare}
          variant="secondary"
          loading={sharing}
          style={styles.btn}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: "100%",
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  btn: { flex: 1 },
});
