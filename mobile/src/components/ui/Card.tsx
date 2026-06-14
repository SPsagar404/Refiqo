import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({ children, onPress, style, padded = true }: CardProps) {
  const content = [styles.card, padded && styles.padded, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [content, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={content}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.85 },
});
