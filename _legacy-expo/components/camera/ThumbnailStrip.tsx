import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { colors, spacing } from "../../constants/theme";

interface ThumbnailStripProps {
  photos: string[];
  total: number;
}

export const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({
  photos,
  total,
}) => {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => {
        const uri = photos[i];
        return (
          <View key={i} style={[styles.thumb, !!uri && styles.thumbFilled]}>
            {uri ? (
              <Image source={{ uri }} style={styles.image} />
            ) : (
              <View style={styles.placeholder} />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  thumb: {
    width: 50,
    height: 70,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
    overflow: "hidden",
  },
  thumbFilled: {
    borderColor: colors.white,
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
});
