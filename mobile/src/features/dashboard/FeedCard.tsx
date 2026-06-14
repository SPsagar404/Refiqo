import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui';
import { colors, gradients, radii, shadow, spacing, typography } from '@/theme';
import { FeedItem } from './feedApi';

interface FeedCardProps {
  item: FeedItem;
  saved: boolean;
  bookmarked: boolean;
  onSave: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onViewProfile: () => void;
  onRequest: () => void;
}

const MAX_SKILLS = 4;

/** A single referral opportunity card (matches the Reels-style feed design). */
export function FeedCard({
  item,
  saved,
  bookmarked,
  onSave,
  onBookmark,
  onShare,
  onViewProfile,
  onRequest,
}: FeedCardProps) {
  const extraSkills = Math.max(0, item.skills.length - MAX_SKILLS);

  return (
    <View style={styles.card}>
      {/* top row: match badge + menu */}
      <View style={styles.topRow}>
        <View style={styles.matchBadge}>
          <Ionicons name="trending-up" size={14} color={colors.success} />
          <Text style={styles.matchText}>{item.matchScore}% Match</Text>
        </View>
        <Pressable hitSlop={8} style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* company logo */}
      <View style={styles.logoWrap}>
        {item.companyLogoUrl ? (
          <Image source={{ uri: item.companyLogoUrl }} style={styles.logoImg} />
        ) : (
          <Text style={styles.logoLetter}>{item.company.charAt(0).toUpperCase()}</Text>
        )}
      </View>

      {/* job title + company */}
      <Text style={styles.jobTitle} numberOfLines={2}>{item.jobTitle}</Text>
      <View style={styles.companyRow}>
        <Text style={styles.companyName}>{item.company}</Text>
        {item.companyVerified && <Ionicons name="checkmark-circle" size={16} color={colors.primaryLink} />}
      </View>

      {/* meta pills */}
      <View style={styles.metaRow}>
        <MetaPill icon="location-outline" label={item.location} />
        <MetaPill icon="briefcase-outline" label={item.experience} />
        <MetaPill icon="business-outline" label={item.jobType} />
      </View>

      {/* skills */}
      <Text style={styles.sectionLabel}>Skills Required</Text>
      <View style={styles.skillRow}>
        {item.skills.slice(0, MAX_SKILLS).map((s) => (
          <View key={s} style={styles.skillChip}>
            <Text style={styles.skillText}>{s}</Text>
          </View>
        ))}
        {extraSkills > 0 && (
          <View style={[styles.skillChip, styles.skillMore]}>
            <Text style={[styles.skillText, styles.skillMoreText]}>+{extraSkills} More</Text>
          </View>
        )}
      </View>

      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

      {/* referrer sub-card */}
      <View style={styles.referrerCard}>
        <Pressable style={styles.referrerTop} onPress={onViewProfile}>
          <Avatar name={item.referrer.name} uri={item.referrer.avatarUrl} size={48} online={item.referrer.online} />
          <View style={styles.referrerInfo}>
            <Text style={styles.referrerLabel}>Referrer</Text>
            <View style={styles.referrerNameRow}>
              <Text style={styles.referrerName} numberOfLines={1}>{item.referrer.name}</Text>
              {item.referrer.verified && <Ionicons name="checkmark-circle" size={15} color={colors.primaryLink} />}
            </View>
            <Text style={styles.referrerRole} numberOfLines={1}>{item.referrer.role}</Text>
          </View>
        </Pressable>

        <View style={styles.stats}>
          <Stat icon="flash" value={`${item.referrer.responseRate}%`} label="Response Rate" />
          <View style={styles.statDivider} />
          <Stat icon="people" value={`${item.referrer.referralsDone}+`} label="Referrals Done" />
        </View>

        <View style={styles.actions}>
          <ActionBtn icon={saved ? 'heart' : 'heart-outline'} label="Save" color={saved ? colors.danger : undefined} onPress={onSave} />
          <ActionBtn icon={bookmarked ? 'bookmark' : 'bookmark-outline'} label="Bookmark" color={bookmarked ? colors.primaryLink : undefined} onPress={onBookmark} />
          <ActionBtn icon="share-social-outline" label="Share" onPress={onShare} />
          <ActionBtn icon="person-outline" label="View Profile" onPress={onViewProfile} />
        </View>
      </View>

      {/* request referral */}
      <Pressable onPress={onRequest} style={({ pressed }) => pressed && styles.pressed}>
        <LinearGradient
          colors={[...gradients.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.requestBtn}
        >
          <Ionicons name="paper-plane" size={18} color={colors.white} />
          <Text style={styles.requestText}>Request Referral</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function MetaPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={13} color={colors.textSecondary} />
      <Text style={styles.metaText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.statCell}>
      <View style={styles.statValueRow}>
        <Ionicons name={icon} size={15} color={colors.warning} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionBtn} onPress={onPress} hitSlop={6}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color={color ?? colors.text} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.25)',
    backgroundColor: 'rgba(18, 22, 40, 0.65)',
    padding: spacing.md,
    ...shadow.card,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  matchText: { ...typography.caption, color: colors.success, fontWeight: '700' },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#0A0F1C',
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%' },
  logoLetter: { fontSize: 28, fontWeight: '800', color: colors.text },
  jobTitle: { ...typography.h2, color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  companyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  companyName: { ...typography.bodyStrong, color: colors.text },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  metaPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  metaText: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
  sectionLabel: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  skillText: { ...typography.small, color: colors.text },
  skillMore: { borderColor: 'rgba(124, 92, 255, 0.5)' },
  skillMoreText: { color: colors.primaryLink, fontWeight: '600' },
  description: { ...typography.small, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  referrerCard: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.md,
  },
  referrerTop: { flexDirection: 'row', gap: spacing.md },
  referrerInfo: { flex: 1, justifyContent: 'center' },
  referrerLabel: { ...typography.caption, color: colors.primaryLink, fontWeight: '700' },
  referrerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  referrerName: { ...typography.h3, color: colors.text },
  referrerRole: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statValue: { ...typography.bodyStrong, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 5 },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    ...shadow.glow,
  },
  requestText: { ...typography.h3, color: colors.white },
  pressed: { opacity: 0.9 },
});
