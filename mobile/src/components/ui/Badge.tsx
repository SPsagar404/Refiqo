import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';
import { ReferralStatus } from '@/types/enums';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceElevated, fg: colors.textSecondary },
  success: { bg: colors.successMuted, fg: colors.success },
  warning: { bg: colors.warningMuted, fg: colors.warning },
  danger: { bg: colors.dangerMuted, fg: colors.danger },
  info: { bg: 'rgba(56,189,248,0.16)', fg: colors.info },
  primary: { bg: colors.primaryMuted, fg: colors.primary },
};

export function Badge({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon && <Ionicons name={icon} size={12} color={t.fg} style={styles.icon} />}
      <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const STATUS_MAP: Record<ReferralStatus, { tone: Tone; label: string }> = {
  PENDING: { tone: 'warning', label: 'Pending' },
  UNDER_REVIEW: { tone: 'info', label: 'Under Review' },
  ACCEPTED: { tone: 'success', label: 'Accepted' },
  REJECTED: { tone: 'danger', label: 'Rejected' },
};

export function StatusBadge({ status }: { status: ReferralStatus }) {
  const s = STATUS_MAP[status];
  return <Badge label={s.label} tone={s.tone} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  icon: { marginRight: 4 },
  label: { ...typography.caption, fontWeight: '700' },
});
