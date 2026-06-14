import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

export interface WhyItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  text: string;
}

/**
 * "Why …?" info card with a 2-column feature grid, shown at the foot of each
 * onboarding step. Mirrors the `.why` + `.feature-grid` block in the HTML mockups.
 */
export function WhyCard({ title, items }: { title: string; items: WhyItem[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headIcon}>
          <Ionicons name="bulb-outline" size={18} color={colors.primaryLink} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.grid}>
        {items.map((it) => (
          <View key={it.label} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name={it.icon} size={18} color={colors.primaryLink} />
            </View>
            <Text style={styles.featureLabel}>{it.label}</Text>
            <Text style={styles.featureText}>{it.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.3)',
    backgroundColor: 'rgba(124, 92, 255, 0.08)',
    padding: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  headIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(124, 92, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: { ...typography.h3, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  feature: { width: '47%', marginBottom: spacing.lg },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: 'rgba(124, 92, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureLabel: { ...typography.bodyStrong, color: colors.text, marginBottom: 2 },
  featureText: { ...typography.caption, color: colors.textSecondary, lineHeight: 16 },
});
