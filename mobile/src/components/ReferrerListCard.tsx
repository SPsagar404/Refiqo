import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Badge, Card } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { AVAILABILITY_LABELS } from '@/types/enums';
import { ReferrerCard } from '@/types/models';

/** Compact referrer card used in dashboard carousels and discovery lists. */
export function ReferrerListCard({
  referrer,
  onPress,
}: {
  referrer: ReferrerCard;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Avatar name={referrer.fullName} uri={referrer.avatarUrl} size={52} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{referrer.fullName}</Text>
            {referrer.matchScore !== undefined && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchText}>{referrer.matchScore}% match</Text>
              </View>
            )}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {referrer.jobTitle}
            {referrer.company ? ` · ${referrer.company}` : ''}
          </Text>
          {referrer.location && (
            <View style={styles.metaRow}>
              <Ionicons name="location-sharp" size={12} color={colors.textSecondary} />
              <Text style={styles.meta}>{referrer.location}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.tags}>
        {referrer.skills.slice(0, 3).map((s) => (
          <View key={s} style={styles.tag}>
            <Text style={styles.tagText}>{s}</Text>
          </View>
        ))}
        {referrer.skills.length > 3 && (
          <Text style={styles.more}>+{referrer.skills.length - 3} skills</Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: referrer.canRefer ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
           <Text style={[styles.statusText, { color: referrer.canRefer ? '#10B981' : '#F59E0B' }]}>
             {referrer.canRefer ? 'Can Refer' : 'Pending'}
           </Text>
        </View>
        {referrer.availabilityStatus && (
          <Text style={styles.avail}>{AVAILABILITY_LABELS[referrer.availabilityStatus]}</Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    backgroundColor: '#111827',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 16,
  },
  header: { flexDirection: 'row' },
  headerInfo: { flex: 1, marginLeft: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 17, fontWeight: '700', color: colors.text, flexShrink: 1, marginRight: spacing.sm },
  matchBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  matchText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
  title: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  meta: { fontSize: 12, color: colors.textMuted, marginLeft: 4 },
  tags: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: spacing.md, gap: 8 },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tagText: { fontSize: 12, color: colors.textSecondary },
  more: { fontSize: 12, color: colors.textMuted, marginLeft: 4 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  avail: { fontSize: 12, color: colors.textMuted },
});
