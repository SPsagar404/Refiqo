import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Screen } from '@/components/ui';
import { qk } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { colors, radii, spacing, typography } from '@/theme';
import { getMyProfile } from '@/features/profile/usersApi';
import { completeOnboarding } from './onboardingApi';

export function ProfileCreatedScreen() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const mutation = useMutation({ mutationFn: completeOnboarding });
  const profile = useQuery({ queryKey: qk.me, queryFn: getMyProfile });

  useEffect(() => {
    mutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const STATUS = [
    { label: 'Status', value: 'Complete', icon: 'checkmark-circle' as const },
    { label: 'Visibility', value: 'Active', icon: 'eye' as const },
    { label: 'Verification', value: 'Verified', icon: 'shield-checkmark' as const },
  ];

  const NEXT = [
    { icon: 'search' as const, label: 'Explore Referrers' },
    { icon: 'paper-plane' as const, label: 'Send Referral Requests' },
    { icon: 'chatbubbles' as const, label: 'Chat & Build Connections' },
  ];

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={styles.check}>
          <Ionicons name="checkmark" size={40} color={colors.white} />
        </View>
        <Text style={styles.title}>Profile Created Successfully</Text>
        <Text style={styles.sub}>You're all set to start getting referrals.</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Profile Completion Status</Text>
        {STATUS.map((s) => (
          <View key={s.label} style={styles.statusRow}>
            <Ionicons name={s.icon} size={18} color={colors.success} />
            <Text style={styles.statusLabel}>{s.label}</Text>
            <Text style={styles.statusValue}>{s.value}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>What's next</Text>
        {NEXT.map((n) => (
          <View key={n.label} style={styles.nextRow}>
            <View style={styles.nextIcon}>
              <Ionicons name={n.icon} size={16} color={colors.primary} />
            </View>
            <Text style={styles.nextLabel}>{n.label}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Profile Summary</Text>
        <SummaryRow label="Skills Added" value={`${profile.data?.skills.length ?? 0}`} />
        <SummaryRow label="Resume Uploaded" value={profile.data?.resumes.length ? 'Yes' : 'Not yet'} />
        <SummaryRow label="Location" value={profile.data?.location ? `${profile.data.location.city}, ${profile.data.location.country}` : '—'} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Security & Privacy</Text>
        {[
          { icon: 'shield-checkmark' as const, label: '100% Secure', sub: 'Your data is encrypted' },
          { icon: 'lock-closed' as const, label: 'Private & Safe', sub: 'You control your visibility' },
          { icon: 'briefcase' as const, label: 'Built for Professionals', sub: 'Verified referrer network' },
        ].map((s) => (
          <View key={s.label} style={styles.nextRow}>
            <View style={styles.nextIcon}>
              <Ionicons name={s.icon} size={16} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>{s.label}</Text>
              <Text style={styles.subItem}>{s.sub}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Recommended Actions</Text>
        {['Add more skills to improve matches', 'Connect with verified referrers', 'Start sending referral requests'].map(
          (a) => (
            <View key={a} style={styles.nextRow}>
              <Ionicons name="ellipse-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.nextLabel, { marginLeft: spacing.md }]}>{a}</Text>
            </View>
          ),
        )}
      </Card>

      <Button
        title="Go To Dashboard"
        loading={mutation.isPending}
        onPress={() => refreshUser()}
      />
    </Screen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: spacing.xxl },
  check: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.h1, color: colors.text, textAlign: 'center' },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  card: { marginBottom: spacing.lg },
  cardTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  statusLabel: { ...typography.body, color: colors.textSecondary, marginLeft: spacing.md, flex: 1 },
  statusValue: { ...typography.bodyStrong, color: colors.success },
  nextRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  nextIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  nextLabel: { ...typography.body, color: colors.text },
  subItem: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  summaryLabel: { ...typography.small, color: colors.textSecondary },
  summaryValue: { ...typography.bodyStrong, color: colors.text },
});
