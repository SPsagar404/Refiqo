import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadow, spacing, typography } from '@/theme';

/** Titled card grouping related form fields (used by the onboarding wizard). */
export function FormSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: { flex: 1 },
  title: { ...typography.h3, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
