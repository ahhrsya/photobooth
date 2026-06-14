import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/theme";
import { sizes } from "../../constants/dimensions";

interface CaptureButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export const CaptureButton: React.FC<CaptureButtonProps> = ({
  onPress,
  disabled,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.outer,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.inner} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: sizes.captureButton,
    height: sizes.captureButton,
    borderRadius: sizes.captureButton / 2,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  inner: {
    width: sizes.captureButton - 16,
    height: sizes.captureButton - 16,
    borderRadius: (sizes.captureButton - 16) / 2,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  disabled: { opacity: 0.4 },
});
