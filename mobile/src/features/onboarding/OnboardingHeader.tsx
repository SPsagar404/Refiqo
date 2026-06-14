import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, gradients, spacing, typography } from '@/theme';

/**
 * Onboarding screen header — uppercase step label, large title, subtitle and a
 * short gradient accent bar. Mirrors the `.page-header` block in the onboarding
 * HTML mockups (onboarding/*.html).
 */
export function OnboardingHeader({
  stepMeta,
  title,
  subtitle,
}: {
  stepMeta: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.meta}>{stepMeta}</Text>
      <Text style={styles.title}>{title}</Text>
      <LinearGradient
        colors={[...gradients.brand]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accent}
      />
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  meta: {
    ...typography.caption,
    color: colors.primaryLink,
    letterSpacing: 0.6,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  title: { ...typography.display, color: colors.text },
  accent: {
    width: 56,
    height: 4,
    borderRadius: 4,
    marginTop: spacing.md,
  },
  subtitle: { ...typography.small, color: colors.textSecondary, marginTop: spacing.md },
});
