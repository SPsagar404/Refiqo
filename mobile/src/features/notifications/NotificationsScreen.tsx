import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { EmptyState, Loader, Screen } from '@/components/ui';
import { qk } from '@/lib/queryClient';
import { dayBucket, timeAgo } from '@/lib/format';
import { colors, radii, spacing, typography } from '@/theme';
import { NotificationType } from '@/types/enums';
import { AppNotification } from '@/types/models';
import { listNotifications, markAllRead, markRead } from './notificationsApi';

const TABS = ['all', 'unread', 'mentions'] as const;

const ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  REFERRAL_ACCEPTED: { icon: 'checkmark-circle', color: colors.success },
  REFERRAL_REJECTED: { icon: 'close-circle', color: colors.danger },
  NEW_MESSAGE: { icon: 'chatbubble-ellipses', color: colors.info },
  REFERRAL_REQUEST_RECEIVED: { icon: 'paper-plane', color: colors.primary },
  REFERRAL_UNDER_REVIEW: { icon: 'hourglass', color: colors.warning },
  REMINDER: { icon: 'alarm', color: colors.warning },
  MILESTONE: { icon: 'trophy', color: colors.primary },
  WELCOME: { icon: 'hand-left', color: colors.primary },
};

export function NotificationsScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const filter = TABS[tab];

  const { data, isLoading } = useQuery({
    queryKey: qk.notifications(filter),
    queryFn: () => listNotifications(filter),
  });

  const readOne = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const readAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const sections = useMemo(() => {
    const groups: Record<string, AppNotification[]> = { Today: [], Yesterday: [], Earlier: [] };
    (data?.data ?? []).forEach((n: AppNotification) => groups[dayBucket(n.createdAt)].push(n));
    return Object.entries(groups)
      .filter(([, items]) => items.length)
      .map(([title, items]) => ({ title, data: items }));
  }, [data]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
          <Pressable onPress={() => readAll.mutate()} hitSlop={8}>
            <Text style={styles.readAll}>Mark all read</Text>
          </Pressable>
        </View>
        <View style={styles.tabs}>
          {TABS.map((t, i) => (
            <Pressable key={t} style={[styles.tab, tab === i && styles.tabActive]} onPress={() => setTab(i)}>
              <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>
                {t[0].toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <Loader />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          renderItem={({ item }) => {
            const meta = ICONS[item.type] ?? { icon: 'notifications' as const, color: colors.primary };
            return (
              <Pressable
                style={[styles.item, !item.readAt && styles.itemUnread]}
                onPress={() => !item.readAt && readOne.mutate(item.id)}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${meta.color}22` }]}>
                  <Ionicons name={meta.icon} size={18} color={meta.color} />
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemText} numberOfLines={2}>{item.body}</Text>
                  <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
                </View>
                {!item.readAt && <View style={styles.dot} />}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title="You're all caught up" subtitle="No notifications here yet." />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.h1, color: colors.text },
  readAll: { ...typography.small, color: colors.primary, fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  tab: { paddingVertical: 6, paddingHorizontal: spacing.lg, borderRadius: radii.pill, backgroundColor: colors.surfaceAlt },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.small, color: colors.textSecondary },
  tabTextActive: { color: colors.white, fontWeight: '600' },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  sectionHeader: { ...typography.caption, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, textTransform: 'uppercase' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  itemUnread: {},
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1, marginLeft: spacing.md },
  itemTitle: { ...typography.bodyStrong, color: colors.text },
  itemText: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  itemTime: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: spacing.sm },
});
