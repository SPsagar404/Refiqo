import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { JobCard as JobType, toggleSaveJob } from './jobsApi';
import { timeAgo } from '@/lib/format';

export function JobCard({
  job,
  onPress,
}: {
  job: JobType;
  onPress: () => void;
}) {
  const qc = useQueryClient();
  const [localSaved, setLocalSaved] = useState(job.isSaved);

  React.useEffect(() => {
    setLocalSaved(job.isSaved);
  }, [job.isSaved]);

  const toggleSave = useMutation({
    mutationFn: () => toggleSaveJob(job.id),
    onMutate: async () => {
      const next = !localSaved;
      setLocalSaved(next);
      return { prev: !next };
    },
    onError: (err, variables, context) => {
      if (context) setLocalSaved(context.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['jobs', 'saved'] });
    },
  });

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="briefcase" size={24} color="#6A3EFF" />
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
            <Pressable onPress={() => toggleSave.mutate()} hitSlop={8}>
              <Ionicons 
                name={localSaved ? 'heart' : 'heart-outline'} 
                size={22} 
                color={localSaved ? colors.danger : colors.textMuted} 
              />
            </Pressable>
          </View>
          <Text style={styles.company} numberOfLines={1}>
            {job.company ?? 'Unknown Company'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{job.location ?? 'Remote'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{job.workMode ?? 'Full-time'}</Text>
        </View>
        <Text style={styles.time}>{timeAgo(job.createdAt)}</Text>
      </View>

      {job.description && (
        <Text style={styles.description} numberOfLines={2}>
          {job.description}
        </Text>
      )}
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
  header: { flexDirection: 'row', alignItems: 'center' },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(106, 62, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, marginLeft: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  company: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  time: { fontSize: 12, color: colors.textMuted, marginLeft: 'auto' },
  description: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md, lineHeight: 18 },
});
