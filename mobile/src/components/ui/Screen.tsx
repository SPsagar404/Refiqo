import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

/** Base screen container: safe-area + dark background, optional scroll + padding. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'bottom'],
  style,
  contentStyle,
}: ScreenProps) {
  const inner = padded ? [styles.padded, contentStyle] : contentStyle;
  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, inner]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 110 },
  padded: { paddingHorizontal: spacing.xl },
});
