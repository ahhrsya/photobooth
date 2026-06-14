import { Platform } from "react-native";
import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";

interface WebCameraMockProps {
  format: "strip" | "polaroid";
  expectedCount: number;
  onAllCaptured: (uris: string[]) => void;
}

/**
 * Web-only mock for the camera screen. Lets the user pick photos from
 * their device (or use placeholder generated images) so the full flow
 * can be tested on the web dev server without a real camera.
 */
export const WebCameraMock: React.FC<WebCameraMockProps> = ({
  format,
  expectedCount,
  onAllCaptured,
}) => {
  const [picked, setPicked] = useState<string[]>([]);

  const pickOne = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        const next = [...picked, res.assets[0].uri];
        setPicked(next);
        if (next.length >= expectedCount) {
          onAllCaptured(next);
        }
      }
    } catch (e) {
      console.warn("image picker failed", e);
    }
  };

  const usePlaceholders = () => {
    // Use base64-encoded colored SVG so html2canvas can capture without
    // hitting CORS (which would taint the canvas).
    const uris = Array.from({ length: expectedCount }, (_, i) => {
      const hue = (i * 137) % 360;
      const label = `photo ${i + 1}`;
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 70%, 75%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360}, 70%, 55%)"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <circle cx="200" cy="160" r="50" fill="rgba(255,255,255,0.3)"/>
  <text x="200" y="220" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="white" text-anchor="middle">${label}</text>
</svg>`;
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    });
    setPicked(uris);
    onAllCaptured(uris);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Web preview mode</Text>
      <Text style={styles.subtitle}>
        {format === "strip"
          ? `Pick ${expectedCount} photos (or use placeholders) to compose a strip`
          : "Pick 1 photo (or use a placeholder) to compose a polaroid"}
      </Text>

      <View style={styles.thumbsRow}>
        {Array.from({ length: expectedCount }).map((_, i) => (
          <View key={i} style={styles.thumb}>
            {picked[i] ? (
              <View style={styles.thumbFilled}>
                <Text style={styles.thumbText}>✓ {i + 1}</Text>
              </View>
            ) : (
              <Text style={styles.thumbText}>{i + 1}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={pickOne}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          disabled={picked.length >= expectedCount}
        >
          <Text style={styles.btnText}>
            {picked.length >= expectedCount
              ? "All picked"
              : `📷  Pick photo ${picked.length + 1}`}
          </Text>
        </Pressable>

        {picked.length < expectedCount && (
          <Pressable
            onPress={usePlaceholders}
            style={({ pressed }) => [
              styles.btn,
              styles.btnSecondary,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={[styles.btnText, styles.btnTextSecondary]}>
              ⚡  Use placeholders
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.hint}>
        Native build uses the real camera; this is a dev-only fallback for the
        web preview.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: "#aaa",
    fontSize: 13,
    textAlign: "center",
    maxWidth: 320,
  },
  thumbsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#555",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbFilled: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFB3DE",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbText: {
    color: "#fff",
    fontWeight: "700",
  },
  actions: {
    marginTop: 8,
    gap: 12,
    width: "100%",
    maxWidth: 320,
  },
  btn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#fff",
  },
  btnPressed: { opacity: 0.7 },
  btnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },
  btnTextSecondary: {
    color: "#fff",
  },
  hint: {
    color: "#666",
    fontSize: 11,
    textAlign: "center",
    marginTop: 16,
    maxWidth: 320,
  },
});
