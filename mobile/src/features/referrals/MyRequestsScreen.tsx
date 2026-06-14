import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, EmptyState, Loader, Screen, StatusBadge } from '@/components/ui';
import { qk } from '@/lib/queryClient';
import { timeAgo } from '@/lib/format';
import { AppStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';
import { ReferralStatus } from '@/types/enums';
import { listReferrals } from './referralsApi';

type Nav = NativeStackNavigationProp<AppStackParamList>;

const TABS: { key: string; status?: ReferralStatus }[] = [
  { key: 'All' },
  { key: 'Pending', status: ReferralStatus.PENDING },
  { key: 'Accepted', status: ReferralStatus.ACCEPTED },
  { key: 'Rejected', status: ReferralStatus.REJECTED },
];

export function MyRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState(0);
  const status = TABS[tab].status;

  const params = { role: 'seeker' as const, status, limit: 30 };
  const query = useQuery({ queryKey: qk.referrals(params), queryFn: () => listReferrals(params) });

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>My Requests {query.data ? `(${query.data.meta.total})` : ''}</Text>
        <View style={styles.tabs}>
          {TABS.map((t, i) => (
            <Pressable key={t.key} style={[styles.tab, tab === i && styles.tabActive]} onPress={() => setTab(i)}>
              <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t.key}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {query.isLoading ? (
        <Loader />
      ) : (
        <FlatList
          data={query.data?.data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('RequestDetail', { id: item.id })}>
              <View style={styles.row}>
                <Avatar name={item.party.fullName} uri={item.party.avatarUrl} size={44} />
                <View style={styles.info}>
                  <Text style={styles.name}>{item.party.fullName}</Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {item.party.jobTitle}{item.party.company ? ` · ${item.party.company}` : ''}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
              <View style={styles.footer}>
                <Text style={styles.role}>
                  <Ionicons name="briefcase-outline" size={12} color={colors.textMuted} /> {item.jobRole}
                </Text>
                <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
              </View>
              {item.status === 'REJECTED' && item.rejectionReason && (
                <Text style={styles.reason}>Reason: {item.rejectionReason}</Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState icon="paper-plane-outline" title="No requests yet" subtitle="Find a referrer and send your first request." />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.lg },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: colors.surfaceAlt },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.small, color: colors.textSecondary },
  tabTextActive: { color: colors.white, fontWeight: '600' },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 110 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.bodyStrong, color: colors.text },
  sub: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  role: { ...typography.small, color: colors.textSecondary },
  time: { ...typography.caption, color: colors.textMuted },
  reason: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
});
