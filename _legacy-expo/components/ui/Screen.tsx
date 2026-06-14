import React, { ReactNode } from "react";
import { View, StyleSheet, StatusBar, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../constants/theme";

interface ScreenProps {
  children: ReactNode;
  style?: ViewStyle;
  bg?: string;
  edges?: ("top" | "bottom" | "left" | "right")[];
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  bg = colors.background,
  edges = ["top", "bottom"],
}) => {
  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={bg} />
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
});
