import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { Template, Format } from "../../types";
import { colors, radius, spacing } from "../../constants/theme";
import { FONT_FAMILY } from "../../constants/fonts";
import { OVERLAY_SOURCES } from "../../constants/overlays";

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
  format: Format;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
  format,
}) => {
  const captionFamily = FONT_FAMILY[template.captionFont];
  const dateFamily = FONT_FAMILY[template.dateFont];

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View
        style={[
          styles.preview,
          {
            backgroundColor: template.backgroundColor,
            borderColor: template.borderColor,
            borderWidth: Math.max(2, template.borderWidth / 2),
            borderRadius: template.borderRadius ?? 0,
          },
        ]}
      >
        {format === "strip" ? (
          <View style={styles.stripPreview}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.stripCell,
                  {
                    backgroundColor: darken(template.backgroundColor),
                    borderRadius: template.photoBorderRadius ?? 0,
                  },
                ]}
              />
            ))}
            {template.showDate && (
              <Text
                style={[
                  styles.miniDate,
                  {
                    color: template.textColor,
                    fontFamily: dateFamily,
                  },
                ]}
              >
                JUN 13
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.polaroidInner}>
            <View
              style={[
                styles.polaroidPreview,
                {
                  backgroundColor: darken(template.backgroundColor),
                  borderRadius: template.photoBorderRadius ?? 0,
                },
              ]}
            />
            {template.showCaption && (
              <Text
                style={[
                  styles.miniCaption,
                  {
                    color: template.textColor,
                    fontFamily: captionFamily,
                  },
                ]}
                numberOfLines={1}
              >
                say cheese!
              </Text>
            )}
          </View>
        )}

        {template.overlayKey && (
          <Image
            source={OVERLAY_SOURCES[template.overlayKey]}
            style={[
              styles.overlayLayer,
              { opacity: (template.overlayOpacity ?? 1) * 0.9 },
            ]}
            resizeMode="cover"
          />
        )}
      </View>
      <Text style={styles.name}>{template.name}</Text>
      <View style={styles.tagRow}>
        {template.tags.slice(0, 2).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
};

const darken = (hex: string) => {
  return hex.toLowerCase() === "#ffffff"
    ? "#D6D6D6"
    : hex.toLowerCase() === "#0a0a0a"
    ? "#2A2A2A"
    : hex;
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    borderRadius: radius.lg,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: colors.text,
    transform: [{ scale: 1.05 }],
  },
  cardPressed: { opacity: 0.85 },
  preview: {
    width: "100%",
    aspectRatio: 0.72,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  stripPreview: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    gap: 3,
  },
  stripCell: { width: "100%", flex: 1 },
  miniDate: {
    fontSize: 6,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 2,
  },
  polaroidInner: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  polaroidPreview: { width: "100%", flex: 1, marginBottom: 6 },
  miniCaption: {
    fontSize: 9,
    textAlign: "center",
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
  },
  tagRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  tag: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: { fontSize: 9, color: colors.textMuted, fontWeight: "600" },
});
