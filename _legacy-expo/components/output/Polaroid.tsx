import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Template } from "../../types";
import { FONT_FAMILY } from "../../constants/fonts";
import { OVERLAY_SOURCES } from "../../constants/overlays";

interface PolaroidProps {
  photo: string;
  template: Template;
  width: number;
  height: number;
  caption?: string;
}

export const Polaroid: React.FC<PolaroidProps> = ({
  photo,
  template,
  width,
  height,
  caption = "say cheese!",
}) => {
  const sidePadding = width * 0.06;
  const innerWidth = width - sidePadding * 2;
  const bottomArea = height * 0.22;
  const photoHeight = height - bottomArea - sidePadding;

  const dateFamily = FONT_FAMILY[template.dateFont];
  const captionFamily = FONT_FAMILY[template.captionFont];

  return (
    <View
      style={[
        styles.card,
        {
          width,
          height,
          backgroundColor: template.backgroundColor,
          borderColor: template.borderColor,
          borderWidth: template.borderWidth,
          borderRadius: template.borderRadius ?? 0,
          padding: sidePadding,
        },
      ]}
    >
      <Image
        source={{ uri: photo }}
        style={{
          width: innerWidth,
          height: photoHeight,
          borderRadius: template.photoBorderRadius ?? 0,
          backgroundColor: "#000",
        }}
      />
      <View style={styles.bottom}>
        {template.showDate && (
          <Text
            style={[
              styles.date,
              {
                color: template.textColor,
                fontFamily: dateFamily,
              },
            ]}
          >
            {formatDate()}
          </Text>
        )}
        {template.showCaption && (
          <Text
            style={[
              styles.caption,
              {
                color: template.textColor,
                fontFamily: captionFamily,
              },
            ]}
            numberOfLines={1}
          >
            {caption}
          </Text>
        )}
      </View>

      {template.overlayKey && (
        <Image
          source={OVERLAY_SOURCES[template.overlayKey]}
          style={[
            styles.overlay,
            { opacity: template.overlayOpacity ?? 1 },
          ]}
          resizeMode="cover"
        />
      )}
    </View>
  );
};

const formatDate = () => {
  const d = new Date();
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
  },
  bottom: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
  },
  date: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  caption: {
    fontSize: 22,
    marginTop: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
});
