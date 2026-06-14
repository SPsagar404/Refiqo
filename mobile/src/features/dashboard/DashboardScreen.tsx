import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loader } from '@/components/ui';
import { toggleSaveReferrer } from '@/features/referrers/referrersApi';
import { unreadCount } from '@/features/notifications/notificationsApi';
import { qk } from '@/lib/queryClient';
import { AppStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';
import { FeedCard } from './FeedCard';
import { fetchFeed, FeedItem } from './feedApi';

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Tab = 'forYou' | 'following';

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('forYou');
  const [areaH, setAreaH] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const feed = useQuery({ queryKey: qk.feed, queryFn: fetchFeed });
  const unread = useQuery({ queryKey: qk.unreadCount, queryFn: unreadCount });

  const saveMut = useMutation({
    mutationFn: (id: string) => toggleSaveReferrer(id),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.feed }),
  });

  const onSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    saveMut.mutate(id);
  };
  const onBookmark = (id: string) =>
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const onShare = (item: FeedItem) =>
    Share.share({ message: `Check out this ${item.jobTitle} role at ${item.company} on Refiqo` }).catch(() => undefined);

  const renderItem = ({ item }: { item: FeedItem }) => (
    <ScrollView
      style={{ height: areaH }}
      contentContainerStyle={styles.page}
      showsVerticalScrollIndicator={false}
    >
      <FeedCard
        item={item}
        saved={savedIds.has(item.id) || item.isSaved}
        bookmarked={bookmarkedIds.has(item.id)}
        onSave={() => onSave(item.id)}
        onBookmark={() => onBookmark(item.id)}
        onShare={() => onShare(item)}
        onViewProfile={() => navigation.navigate('ReferrerProfile', { id: item.id })}
        onRequest={() =>
          navigation.navigate('SendReferral', { referrerId: item.referrer.id, referrerName: item.referrer.name })
        }
      />
      <View style={styles.hint}>
        <Text style={styles.hintText}>Swipe up for next</Text>
        <Ionicons name="chevron-up" size={16} color={colors.primaryLink} />
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          Refi<Text style={styles.logoAccent}>qo</Text>
        </Text>
        <View style={styles.tabs}>
          <Pressable onPress={() => setTab('forYou')}>
            <Text style={[styles.tab, tab === 'forYou' && styles.tabActive]}>For You</Text>
            {tab === 'forYou' && <View style={styles.tabUnderline} />}
          </Pressable>
          <Pressable onPress={() => setTab('following')}>
            <Text style={[styles.tab, tab === 'following' && styles.tabActive]}>Following</Text>
            {tab === 'following' && <View style={styles.tabUnderline} />}
          </Pressable>
        </View>
        <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={8} style={styles.bell}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          {!!unread.data && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unread.data > 9 ? '9+' : unread.data}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── Feed area ── */}
      <View style={styles.area} onLayout={(e) => setAreaH(e.nativeEvent.layout.height)}>
        {tab === 'following' ? (
          <FeedState icon="people-outline" title="No one yet" message="Follow referrers to see their latest openings here." />
        ) : feed.isLoading || areaH === 0 ? (
          <Loader />
        ) : feed.isError ? (
          <FeedState
            icon="cloud-offline-outline"
            title="Couldn't load your feed"
            message="Check your connection and try again."
            actionLabel="Retry"
            onAction={() => feed.refetch()}
          />
        ) : !feed.data || feed.data.length === 0 ? (
          <FeedState
            icon="sparkles-outline"
            title="No opportunities yet"
            message="We're finding referrers that match your profile. Check back soon."
            actionLabel="Refresh"
            onAction={() => feed.refetch()}
          />
        ) : (
          <FlatList
            data={feed.data}
            keyExtractor={(it) => it.id}
            renderItem={renderItem}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={areaH}
            snapToAlignment="start"
            decelerationRate="fast"
            getItemLayout={(_, index) => ({ length: areaH, offset: areaH * index, index })}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function FeedState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.state}>
      <Ionicons name={icon} size={44} color={colors.textMuted} />
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMsg}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable style={styles.retry} onPress={onAction}>
          <Text style={styles.retryText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  logo: { fontSize: 24, fontWeight: '800', color: colors.text },
  logoAccent: { color: colors.primaryLink },
  tabs: { flexDirection: 'row', gap: spacing.lg },
  tab: { ...typography.bodyStrong, color: colors.textMuted },
  tabActive: { color: colors.text },
  tabUnderline: { height: 2, borderRadius: 2, backgroundColor: colors.primary, marginTop: 4 },
  bell: { padding: 2 },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: { ...typography.caption, color: colors.white, fontSize: 10, fontWeight: '700' },
  // Reserve space for the floating bottom nav so feed cards (and the Request
  // Referral button) render fully above it.
  area: { flex: 1, marginBottom: 92 },
  page: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm },
  hintText: { ...typography.caption, color: colors.textMuted },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.sm },
  stateTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  stateMsg: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
  retry: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  retryText: { ...typography.bodyStrong, color: colors.white },
});
