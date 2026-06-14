import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Chip({ label, selected, onPress, onRemove, size = 'md', style }: ChipProps) {
  const Container = onPress ? Pressable : View;
  return (
    <Container
      onPress={onPress}
      style={[
        styles.chip,
        size === 'sm' && styles.chipSm,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
    >
      <Text style={[styles.label, size === 'sm' && styles.labelSm, selected && styles.labelSelected]}>
        {label}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
          <Ionicons name="close" size={14} color={selected ? colors.white : colors.textSecondary} />
        </Pressable>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipSm: { paddingHorizontal: spacing.md, paddingVertical: 6 },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  unselected: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  label: { ...typography.small, color: colors.textSecondary },
  labelSm: { ...typography.caption },
  labelSelected: { color: colors.white, fontWeight: '600' },
  remove: { marginLeft: spacing.xs },
});
