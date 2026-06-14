import React from "react";
import { View, ActivityIndicator, Text, StyleSheet, Pressable } from "react-native";
import { colors, spacing } from "../../constants/theme";

interface LoadingOverlayProps {
  visible: boolean;
  label?: string;
  error?: string | null;
  onRetry?: () => void;
  onSkip?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  label = "developing your photos...",
  error,
  onRetry,
  onSkip,
}) => {
  if (!visible) return null;
  return (
    <View style={styles.root}>
      <View style={styles.box}>
        {error ? (
          <>
            <Text style={[styles.text, styles.errorText]}>Couldn't render</Text>
            <Text style={styles.errorDetail}>{error}</Text>
            <View style={styles.actions}>
              {onRetry && (
                <Pressable onPress={onRetry} style={styles.btn}>
                  <Text style={styles.btnText}>Try again</Text>
                </Pressable>
              )}
              {onSkip && (
                <Pressable onPress={onSkip} style={[styles.btn, styles.btnGhost]}>
                  <Text style={[styles.btnText, styles.btnGhostText]}>
                    Continue without preview
                  </Text>
                </Pressable>
              )}
            </View>
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.text} size="large" />
            <Text style={styles.text}>{label}</Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  box: { alignItems: "center", gap: spacing.md, padding: spacing.lg },
  text: {
    color: colors.text,
    fontSize: 14,
    letterSpacing: 0.5,
    fontStyle: "italic",
  },
  errorText: {
    fontStyle: "normal",
    fontWeight: "700",
    fontSize: 18,
  },
  errorDetail: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    maxWidth: 280,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  btn: {
    backgroundColor: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.text,
  },
  btnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  btnGhostText: {
    color: colors.text,
  },
});
