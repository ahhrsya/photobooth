import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Template } from "../../types";
import { FONT_FAMILY } from "../../constants/fonts";
import { OVERLAY_SOURCES } from "../../constants/overlays";

interface PhotoStripProps {
  photos: string[];
  template: Template;
  width: number;
  height: number;
  caption?: string;
}

export const PhotoStrip: React.FC<PhotoStripProps> = ({
  photos,
  template,
  width,
  height,
  caption = "made today",
}) => {
  const innerWidth = width - template.borderWidth * 2;
  const innerHeight = height - template.borderWidth * 2;
  const photoAreaHeight =
    innerHeight -
    (template.showDate ? 40 : 0) -
    (template.showCaption ? 32 : 0) -
    template.photoGap * (photos.length - 1);
  const photoHeight = photoAreaHeight / photos.length;

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
        },
      ]}
    >
      {photos.map((uri, i) => (
        <Image
          key={i}
          source={{ uri }}
          style={{
            width: innerWidth,
            height: photoHeight,
            borderRadius: template.photoBorderRadius ?? 0,
            marginBottom: i < photos.length - 1 ? template.photoGap : 0,
            backgroundColor: "#000",
          }}
        />
      ))}

      {template.showDate && (
        <Text
          style={[
            styles.date,
            {
              color: template.textColor,
              fontFamily: dateFamily,
              marginTop: 10,
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
        >
          {caption}
        </Text>
      )}

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
    padding: 0,
    overflow: "hidden",
  },
  date: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  caption: {
    fontSize: 18,
    marginTop: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
});
