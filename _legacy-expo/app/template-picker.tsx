import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../components/ui/Screen";
import { Button } from "../components/ui/Button";
import { TemplateCarousel } from "../components/template/TemplateCarousel";
import { colors, spacing } from "../constants/theme";
import { TEMPLATES } from "../constants/templates";
import { Template } from "../types";
import { usePhotoboothStore } from "../store/usePhotoboothStore";

export default function TemplatePickerScreen() {
  const router = useRouter();
  const format = usePhotoboothStore((s) => s.format);
  const setTemplate = usePhotoboothStore((s) => s.setTemplate);
  const [selected, setSelected] = useState<Template | null>(null);

  useEffect(() => {
    if (!format) {
      router.replace("/");
    }
  }, [format]);

  if (!format) return null;

  const onSelect = (t: Template) => {
    setSelected(t);
  };

  const onUse = () => {
    if (!selected) return;
    setTemplate(selected);
    router.push("/camera");
  };

  return (
    <Screen bg={colors.background}>
      <View style={styles.header}>
        <Text style={styles.title}>choose your vibe</Text>
        <Text style={styles.subtitle}>
          {format === "strip" ? "3 frames · vertical roll" : "1 frame · polaroid"}
        </Text>
      </View>

      <View style={styles.carousel}>
        <TemplateCarousel
          templates={TEMPLATES}
          format={format}
          selectedId={selected?.id ?? null}
          onSelect={onSelect}
        />
      </View>

      <View style={styles.footer}>
        <Button
          label={selected ? `Use ${selected.name} →` : "Pick a template"}
          onPress={onUse}
          disabled={!selected}
          fullWidth
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  carousel: {
    flex: 1,
    justifyContent: "center",
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});
