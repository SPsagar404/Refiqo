import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Loader } from '@/components/ui';
import { getOrCreateConversation } from '@/features/chat/chatApi';
import { listReferrals } from '@/features/referrals/referralsApi';
import { brandColor } from '@/lib/format';
import { qk } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { AppStackParamList } from '@/navigation/types';
import { colors, gradients, radii, shadow, spacing, typography } from '@/theme';
import { ReferralStatus } from '@/types/enums';
import { ReferralRequestCard, ReferrerProfileDetail } from '@/types/models';
import { fetchReferrer } from './referrersApi';

type Experience = ReferrerProfileDetail['experiences'][number];
type Props = NativeStackScreenProps<AppStackParamList, 'ReferrerProfile'>;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MS_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const MAX_SKILLS = 5;

const fmtMonth = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const duration = (startIso: string, endIso: string | null, current: boolean) => {
  const start = new Date(startIso).getTime();
  const end = current || !endIso ? Date.now() : new Date(endIso).getTime();
  const yrs = (end - start) / MS_YEAR;
  return yrs < 1 ? `${Math.max(1, Math.round(yrs * 12))} mos` : `${yrs.toFixed(1)} Yrs`;
};
const avgResponse = (hours: number | null) => {
  if (hours == null) return '—';
  return hours < 24 ? `${Math.round(hours)}h` : `${(hours / 24).toFixed(1)}d`;
};

export function ReferrerProfileScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const me = useAuthStore((s) => s.user);
  const isOwn = me?.id === id;

  const { data, isLoading } = useQuery({ queryKey: qk.referrer(id), queryFn: () => fetchReferrer(id) });
  const myReqs = useQuery({
    queryKey: qk.referrals({ role: 'seeker' }),
    queryFn: () => listReferrals({ role: 'seeker' }),
    enabled: !isOwn,
  });

  const openChat = useMutation({
    mutationFn: () => getOrCreateConversation(id),
    onSuccess: (conv) => navigation.navigate('Chat', { conversationId: conv.id, title: data?.fullName ?? 'Chat' }),
  });

  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Loader />
      </SafeAreaView>
    );
  }

  // Most recent referral request between me and this referrer
  const requests: ReferralRequestCard[] = myReqs.data?.data ?? [];
  const request = requests
    .filter((r) => r.party.id === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const status = request?.status;

  const verified = data.verificationStatus === 'VERIFIED';
  const isTop = data.stats.referralsGiven >= 50 || data.stats.ratingAvg >= 4.7;
  const connections = Math.max(50, data.stats.referralsGiven * 4);

  const current = data.experiences.find((e: Experience) => e.current);
  const past = data.experiences.filter((e: Experience) => !e.current);
  const companyCount =
    new Set(data.experiences.map((e: Experience) => e.company).filter(Boolean)).size || data.experiences.length;
  const totalYears = data.stats.experienceYears ?? data.experienceYears ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.logo}>
          Refi<Text style={styles.logoAccent}>qo</Text>
        </Text>
        <Pressable style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.avatarGlow}>
            <Avatar name={data.fullName} uri={data.avatarUrl} size={104} online={data.availabilityStatus === 'AVAILABLE_NOW'} />
          </View>
          <View style={styles.heroInfo}>
            {isTop && (
              <View style={styles.topBadge}>
                <Ionicons name="ribbon" size={13} color={colors.primaryLink} />
                <Text style={styles.topBadgeText}>Top Referrer</Text>
              </View>
            )}
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{data.fullName}</Text>
              {verified && <Ionicons name="checkmark-circle" size={18} color={colors.primaryLink} />}
            </View>
            <Text style={styles.role}>{data.jobTitle ?? 'Referrer'}</Text>
            {!!data.company && (
              <Text style={styles.role}>
                @ <Text style={styles.company}>{data.company}</Text>
              </Text>
            )}
          </View>
        </View>

        <View style={styles.heroMeta}>
          {!!data.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{data.location}</Text>
            </View>
          )}
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{connections}+ connections</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <StatCell icon="flash" value={`${data.stats.responseRatePct}%`} label="Response Rate" border />
            <StatCell icon="people" value={`${data.stats.referralsGiven}+`} label="Referrals Done" border />
            <StatCell icon="time-outline" value={avgResponse(data.stats.avgResponseHours)} label="Avg. Response" border />
            <StatCell icon="star-outline" value={data.stats.ratingAvg.toFixed(1)} label="Rating" />
          </View>
        </View>

        {/* ── About ── */}
        {(data.about || data.skills.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            {!!data.about && <Text style={styles.about}>{data.about}</Text>}
            {data.skills.length > 0 && (
              <View style={styles.chips}>
                {data.skills.slice(0, MAX_SKILLS).map((s: string) => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))}
                {data.skills.length > MAX_SKILLS && (
                  <View style={[styles.chip, styles.chipMore]}>
                    <Text style={[styles.chipText, styles.chipMoreText]}>+{data.skills.length - MAX_SKILLS} More</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── Current Company ── */}
        {(current || data.company) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Company</Text>
            <View style={styles.companyRow}>
              <CompanyLogo name={current?.company ?? data.company ?? '?'} />
              <View style={styles.expInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.expCompany}>{current?.company ?? data.company}</Text>
                  {verified && <Ionicons name="checkmark-circle" size={14} color={colors.primaryLink} />}
                </View>
                <Text style={styles.expRole}>{current?.title ?? data.jobTitle}</Text>
                {current && (
                  <Text style={styles.expDates}>
                    {fmtMonth(current.startDate)} - Present • {duration(current.startDate, null, true)}
                  </Text>
                )}
              </View>
              <View style={styles.currentPill}>
                <Text style={styles.currentPillText}>Currently Here</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Work Experience ── */}
        {past.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <Text style={styles.cardTitle}>Work Experience</Text>
            </View>
            <View style={styles.timeline}>
              {past.map((e: Experience, i: number) => (
                <View key={i} style={[styles.expRow, i < past.length - 1 && styles.expRowBorder]}>
                  <CompanyLogo name={e.company ?? '?'} />
                  <View style={styles.expInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.expCompany}>{e.company ?? '—'}</Text>
                      <Ionicons name="checkmark-circle" size={14} color={colors.primaryLink} />
                    </View>
                    <Text style={styles.expRole}>{e.title}</Text>
                    <Text style={styles.expDates}>
                      {fmtMonth(e.startDate)} - {e.endDate ? fmtMonth(e.endDate) : 'Present'} •{' '}
                      {duration(e.startDate, e.endDate, e.current)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.summary}>
              <SummaryCell icon="briefcase-outline" label="Experience" value={`${totalYears} Yrs`} />
              <SummaryCell icon="business-outline" label="Companies" value={`${companyCount}`} />
              <SummaryCell icon="people-outline" label="Total Referrals" value={`${data.stats.referralsGiven}+`} />
            </View>
          </View>
        )}

        {/* ── Actions ── */}
        {isOwn ? (
          <Pressable
            style={styles.editBtn}
            onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}
          >
            <Ionicons name="create-outline" size={18} color={colors.primaryLink} />
            <Text style={styles.editText}>Edit Profile</Text>
          </Pressable>
        ) : (
          <View style={styles.actions}>
            <Pressable style={styles.outlineBtn}>
              <Ionicons name="document-text-outline" size={18} color={colors.primaryLink} />
              <Text style={styles.outlineText}>View Resume</Text>
            </Pressable>
            {status === ReferralStatus.ACCEPTED ? (
              <PrimaryBtn icon="chatbubble-ellipses" label="Open Chat" loading={openChat.isPending} onPress={() => openChat.mutate()} />
            ) : status === ReferralStatus.PENDING || status === ReferralStatus.UNDER_REVIEW ? (
              <PrimaryBtn icon="hourglass-outline" label="Request Sent" disabled />
            ) : (
              <PrimaryBtn
                icon="paper-plane"
                label="Request Referral"
                onPress={() => navigation.navigate('SendReferral', { referrerId: id, referrerName: data.fullName })}
              />
            )}
          </View>
        )}

        {/* ── Chat status note ── */}
        {!isOwn && <ChatNote status={status} reason={request?.rejectionReason ?? null} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ icon, value, label, border }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; border?: boolean }) {
  return (
    <View style={[styles.statCell, border && styles.statBorder]}>
      <Ionicons name={icon} size={18} color={colors.primaryLink} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CompanyLogo({ name }: { name: string }) {
  return (
    <View style={styles.logoTile}>
      <Text style={[styles.logoLetter, { color: brandColor(name) }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

function SummaryCell({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.summaryCell}>
      <Ionicons name={icon} size={18} color={colors.primaryLink} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function PrimaryBtn({
  icon,
  label,
  onPress,
  loading,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable style={styles.primaryWrap} onPress={onPress} disabled={disabled || loading}>
      <LinearGradient
        colors={disabled ? ['#2a2f45', '#23283c'] : [...gradients.brand]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.primaryBtn, !disabled && shadow.glow]}
      >
        <Ionicons name={icon} size={18} color={disabled ? colors.textMuted : colors.white} />
        <Text style={[styles.primaryText, disabled && { color: colors.textMuted }]}>{loading ? 'Opening…' : label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function ChatNote({ status, reason }: { status?: string; reason: string | null }) {
  if (status === ReferralStatus.ACCEPTED) {
    return (
      <View style={styles.note}>
        <Ionicons name="checkmark-circle" size={15} color={colors.success} />
        <Text style={[styles.noteText, { color: colors.success }]}>Referral accepted — chat is unlocked</Text>
      </View>
    );
  }
  if (status === ReferralStatus.REJECTED) {
    return (
      <View style={styles.note}>
        <Ionicons name="close-circle" size={15} color={colors.danger} />
        <Text style={[styles.noteText, { color: colors.danger }]} numberOfLines={2}>
          {reason ? `Request declined: ${reason}` : 'Your referral request was declined.'}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.note}>
      <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
      <Text style={styles.noteText}>Chat unlocks after referral request is accepted</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logo: { fontSize: 24, fontWeight: '800', color: colors.text },
  logoAccent: { color: colors.primaryLink },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  hero: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, alignItems: 'center' },
  avatarGlow: {
    borderRadius: 999,
    shadowColor: colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  heroInfo: { flex: 1 },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    marginBottom: spacing.sm,
  },
  topBadgeText: { ...typography.caption, color: colors.primaryLink, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...typography.h1, color: colors.text, flexShrink: 1 },
  role: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  company: { color: colors.primaryLink, fontWeight: '600' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { ...typography.caption, color: colors.textMuted },
  metaDivider: { width: 1, height: 14, backgroundColor: colors.border },

  card: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row' },
  statCell: { flex: 1, alignItems: 'center', gap: 6 },
  statBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  statValue: { ...typography.h3, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

  about: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { ...typography.small, color: colors.text },
  chipMore: { borderColor: 'rgba(124, 92, 255, 0.5)' },
  chipMoreText: { color: colors.primaryLink, fontWeight: '600' },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logoTile: {
    width: 50,
    height: 50,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontSize: 26, fontWeight: '900' },
  expInfo: { flex: 1 },
  expCompany: { ...typography.bodyStrong, color: colors.text },
  expRole: { ...typography.small, color: colors.textSecondary, marginTop: 1 },
  expDates: { ...typography.caption, color: colors.primaryLink, marginTop: 3 },
  currentPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  currentPillText: { ...typography.caption, color: colors.success, fontWeight: '600' },
  timeline: { borderRadius: radii.lg, backgroundColor: 'rgba(255,255,255,0.035)', paddingHorizontal: spacing.md },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  expRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  summary: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  summaryCell: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  summaryLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  summaryValue: { ...typography.bodyStrong, color: colors.primaryLink, marginTop: 2 },

  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  outlineBtn: {
    flex: 1,
    height: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  outlineText: { ...typography.bodyStrong, color: colors.primaryLink },
  primaryWrap: { flex: 1 },
  primaryBtn: {
    height: 54,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryText: { ...typography.bodyStrong, color: colors.white },
  editBtn: {
    marginTop: spacing.xl,
    height: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editText: { ...typography.bodyStrong, color: colors.primaryLink },
  note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  noteText: { ...typography.caption, color: colors.textMuted },
});
