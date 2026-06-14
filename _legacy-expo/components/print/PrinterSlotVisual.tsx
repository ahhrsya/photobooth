import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../../constants/theme";
import { sizes } from "../../constants/dimensions";

export const PrinterSlotVisual: React.FC<{ width?: number }> = ({
  width = sizes.cardStripWidth,
}) => {
  return (
    <View style={[styles.root, { width }]}>
      <View style={styles.slot}>
        <View style={styles.line} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
  slot: {
    width: "100%",
    height: sizes.slotHeight,
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    justifyContent: "center",
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  line: {
    width: "100%",
    height: 2,
    backgroundColor: "#000",
    opacity: 0.6,
  },
});
