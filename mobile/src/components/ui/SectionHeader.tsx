import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  titleStyle,
  actionStyle,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  titleStyle?: TextStyle;
  actionStyle?: TextStyle;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, actionStyle]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  action: { ...typography.small, color: colors.primaryLink, fontWeight: '700' },
});
