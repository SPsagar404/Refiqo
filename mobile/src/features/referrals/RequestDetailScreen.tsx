import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card, Loader, Screen, StatusBadge } from '@/components/ui';
import { qk } from '@/lib/queryClient';
import { timeAgo } from '@/lib/format';
import { AppStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';
import { ReferralStatus } from '@/types/enums';
import { StatusEvent } from '@/types/models';
import { getOrCreateConversation } from '@/features/chat/chatApi';
import { fetchReferral } from './referralsApi';

type Props = NativeStackScreenProps<AppStackParamList, 'RequestDetail'>;

export function RequestDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: qk.referral(id), queryFn: () => fetchReferral(id) });

  const openChat = useMutation({
    mutationFn: () => getOrCreateConversation(data!.party.id),
    onSuccess: (conv) => navigation.navigate('Chat', { conversationId: conv.id, title: data!.party.fullName }),
  });

  if (isLoading || !data) return <Screen><Loader /></Screen>;

  return (
    <Screen scroll>
      <View style={styles.head}>
        <Avatar name={data.party.fullName} uri={data.party.avatarUrl} size={56} />
        <View style={styles.headInfo}>
          <Text style={styles.name}>{data.party.fullName}</Text>
          <Text style={styles.sub}>{data.party.jobTitle}{data.party.company ? ` · ${data.party.company}` : ''}</Text>
        </View>
        <StatusBadge status={data.status} />
      </View>

      <Card style={styles.card}>
        <Row label="Role" value={data.jobRole} />
        {data.jobLink && <Row label="Job Link" value={data.jobLink} />}
        <Row label="Message" value={data.message} />
        {data.note && <Row label="Note" value={data.note} />}
        {data.resume && <Row label="Resume" value={data.resume.fileName} />}
      </Card>

      <Text style={styles.section}>Status Timeline</Text>
      <View style={styles.timeline}>
        {data.statusHistory.map((e: StatusEvent, i: number) => (
          <View key={i} style={styles.event}>
            <View style={styles.dotCol}>
              <View style={styles.dot} />
              {i < data.statusHistory.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventStatus}>{e.status.replace(/_/g, ' ')}</Text>
              <Text style={styles.eventTime}>{timeAgo(e.at)}</Text>
              {e.reason && <Text style={styles.eventReason}>{e.reason}</Text>}
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: spacing.xl }} />
      {data.status === ReferralStatus.ACCEPTED ? (
        <Button
          title="Message"
          icon="chatbubble-ellipses-outline"
          variant="secondary"
          loading={openChat.isPending}
          onPress={() => openChat.mutate()}
        />
      ) : (
        <View style={styles.lockBox}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
          <Text style={styles.lockText}>
            {data.status === ReferralStatus.REJECTED
              ? 'This request was declined, so messaging is not available.'
              : 'Messaging unlocks once the referrer accepts your request.'}
          </Text>
        </View>
      )}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  headInfo: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.h3, color: colors.text },
  sub: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  card: { marginTop: spacing.xl },
  detailRow: { marginBottom: spacing.md },
  detailLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  detailValue: { ...typography.body, color: colors.text },
  section: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  timeline: { paddingLeft: spacing.xs },
  event: { flexDirection: 'row' },
  dotCol: { alignItems: 'center', width: 24 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginTop: 4 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  eventInfo: { flex: 1, paddingBottom: spacing.lg, marginLeft: spacing.sm },
  eventStatus: { ...typography.bodyStrong, color: colors.text, textTransform: 'capitalize' },
  eventTime: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  eventReason: { ...typography.small, color: colors.danger, marginTop: 4 },
  lockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  lockText: { ...typography.small, color: colors.textSecondary, flex: 1 },
});
