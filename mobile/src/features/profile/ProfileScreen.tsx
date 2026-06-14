import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, Loader, Screen } from '@/components/ui';
import { qk } from '@/lib/queryClient';
import { AppStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/authStore';
import { colors, radii, spacing, typography } from '@/theme';
import { becomeReferrer, getMyProfile } from './usersApi';

type Nav = NativeStackNavigationProp<AppStackParamList>;

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  screen?: keyof AppStackParamList;
}

const MENU: MenuItem[] = [
  { icon: 'heart-outline', label: 'Saved Items', screen: 'Saved' },
  { icon: 'person-outline', label: 'Personal Information' },
  { icon: 'briefcase-outline', label: 'Experience & Education' },
  { icon: 'sparkles-outline', label: 'Skills' },
  { icon: 'document-text-outline', label: 'Resume' },
  { icon: 'notifications-outline', label: 'Notification Preferences' },
  { icon: 'lock-closed-outline', label: 'Privacy & Security' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
  { icon: 'information-circle-outline', label: 'About Refiqo' },
];

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const signOut = useAuthStore((s) => s.signOut);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: qk.me, queryFn: getMyProfile });

  const promote = useMutation({
    mutationFn: becomeReferrer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      refreshUser();
    },
  });

  if (isLoading || !data) return <Screen><Loader /></Screen>;

  const isReferrer = !!data.referrerProfile;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Avatar name={data.fullName} uri={data.avatarUrl} size={84} />
        <View style={styles.nameRow}>
          <Text style={styles.name}>{data.fullName}</Text>
          {data.isVerified && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
        </View>
        <Text style={styles.title}>{data.jobTitle}{data.company ? ` · ${data.company.name}` : ''}</Text>
        <Text style={styles.email}>{data.email}</Text>
        {data.location && (
          <Badge label={`${data.location.city}, ${data.location.country}`} tone="neutral" />
        )}
      </View>

      {data.referrerProfile && (
        <Card style={styles.statRow} padded={false}>
          {[
            { label: 'Referrals', value: data.referrerProfile.referralsGiven },
            { label: 'Response', value: `${data.referrerProfile.responseRatePct}%` },
            { label: 'Rating', value: data.referrerProfile.ratingAvg.toFixed(1) },
          ].map((s, i, arr) => (
            <View key={s.label} style={[styles.stat, i < arr.length - 1 && styles.statBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Card>
      )}

      {!isReferrer && (
        <Pressable onPress={() => promote.mutate()} disabled={promote.isPending}>
          <LinearGradient
            colors={['#7437FF', '#5A20DF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.becomeCard}
          >
            <View style={styles.becomeIcon}>
              <Ionicons name="ribbon" size={20} color="#fff" />
            </View>
            <View style={styles.becomeText}>
              <Text style={styles.becomeTitle}>
                {promote.isPending ? 'Setting you up…' : 'Become a Referrer'}
              </Text>
              <Text style={styles.becomeSub}>Help others & appear in referral searches</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        </Pressable>
      )}

      <View style={styles.menu}>
        {MENU.map((m, i) => (
          <Pressable
            key={m.label}
            style={[styles.menuItem, i < MENU.length - 1 && styles.menuBorder]}
            onPress={() => m.screen && navigation.navigate(m.screen as any)}
          >
            <Ionicons name={m.icon} size={20} color={colors.textSecondary} />
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Button title="Sign Out" variant="danger" icon="log-out-outline" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  name: { ...typography.h2, color: colors.text },
  title: { ...typography.body, color: colors.textSecondary },
  email: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  statRow: { flexDirection: 'row', marginVertical: spacing.lg },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  statBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  statValue: { ...typography.h3, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  becomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  becomeIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  becomeText: { flex: 1 },
  becomeTitle: { ...typography.bodyStrong, color: '#fff' },
  becomeSub: { ...typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { ...typography.body, color: colors.text, flex: 1 },
});
