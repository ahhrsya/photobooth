import React, { useRef, useState, useEffect } from "react";
import {
  FlatList,
  View,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
} from "react-native";
import { TemplateCard } from "./TemplateCard";
import { Template, Format } from "../../types";
import { spacing } from "../../constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_WIDTH = 150;
const CARD_GAP = spacing.md;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

interface TemplateCarouselProps {
  templates: Template[];
  format: Format;
  selectedId: string | null;
  onSelect: (template: Template) => void;
}

export const TemplateCarousel: React.FC<TemplateCarouselProps> = ({
  templates,
  format,
  selectedId,
  onSelect,
}) => {
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (selectedId) {
      const idx = templates.findIndex((t) => t.id === selectedId);
      if (idx >= 0) {
        listRef.current?.scrollToOffset({
          offset: idx * SNAP_INTERVAL - SCREEN_W / 2 + CARD_WIDTH / 2 + spacing.lg,
          animated: true,
        });
        setActiveIndex(idx);
      }
    }
  }, [selectedId]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SNAP_INTERVAL);
    setActiveIndex(idx);
  };

  return (
    <FlatList
      ref={listRef}
      data={templates}
      horizontal
      keyExtractor={(t) => t.id}
      showsHorizontalScrollIndicator={false}
      snapToInterval={SNAP_INTERVAL}
      decelerationRate="fast"
      onMomentumScrollEnd={handleMomentumEnd}
      contentContainerStyle={styles.content}
      renderItem={({ item, index }) => (
        <View style={{ marginRight: CARD_GAP }}>
          <TemplateCard
            template={item}
            format={format}
            isSelected={index === activeIndex || item.id === selectedId}
            onSelect={() => onSelect(item)}
          />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
});
