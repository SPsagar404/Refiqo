import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, gradients, radii, shadow, spacing, typography } from '@/theme';

const STEPS = ['Basic Info', 'Experience', 'Resume', 'Preferences', 'Availability'];

/** Horizontal step indicator shown atop each onboarding screen (1-based). */
export function Stepper({ current }: { current: number }) {
  return (
    <View style={styles.card}>
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        const filled = done || active;
        return (
          <View key={label} style={styles.step}>
            <View style={styles.row}>
              {filled ? (
                <LinearGradient
                  colors={[...gradients.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.dot, active && shadow.glow]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={13} color={colors.white} />
                  ) : (
                    <Text style={styles.numActive}>{step}</Text>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.dot}>
                  <Text style={styles.num}>{step}</Text>
                </View>
              )}
              {i < STEPS.length - 1 && <View style={[styles.bar, done && styles.barDone]} />}
            </View>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  step: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  numActive: { ...typography.caption, color: colors.white, fontWeight: '700' },
  bar: { flex: 1, height: 3, borderRadius: 3, backgroundColor: colors.border, marginHorizontal: 3 },
  barDone: { backgroundColor: colors.primary },
  label: { ...typography.caption, color: colors.textMuted, marginTop: 6, fontSize: 10 },
  labelActive: { color: colors.text, fontWeight: '600' },
});
