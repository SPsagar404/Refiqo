import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState, Loader, Screen } from '@/components/ui';
import { ReferrerListCard } from '@/components/ReferrerListCard';
import { fetchSavedReferrers } from '@/features/referrers/referrersApi';
import { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { fetchSavedJobs } from '@/features/discovery/jobsApi';
import { JobCard } from '@/features/discovery/JobCard';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function SavedScreen() {
  const navigation = useNavigation<Nav>();
  const [mode, setMode] = useState<'referrers' | 'jobs'>('referrers');

  const referrersQuery = useQuery({
    queryKey: ['referrers', 'saved'],
    queryFn: fetchSavedReferrers,
    enabled: mode === 'referrers',
  });

  const jobsQuery = useQuery({
    queryKey: ['jobs', 'saved'],
    queryFn: fetchSavedJobs,
    enabled: mode === 'jobs',
  });

  const isLoading = mode === 'referrers' ? referrersQuery.isLoading : jobsQuery.isLoading;
  const data = mode === 'referrers' ? referrersQuery.data : jobsQuery.data;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Saved Items</Text>
          <View style={styles.modeToggle}>
            <Pressable 
              style={[styles.modeBtn, mode === 'referrers' && styles.modeBtnActive]} 
              onPress={() => setMode('referrers')}
            >
              <Text style={[styles.modeText, mode === 'referrers' && styles.modeTextActive]}>Referrers</Text>
            </Pressable>
            <Pressable 
              style={[styles.modeBtn, mode === 'jobs' && styles.modeBtnActive]} 
              onPress={() => setMode('jobs')}
            >
              <Text style={[styles.modeText, mode === 'jobs' && styles.modeTextActive]}>Jobs</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {isLoading ? (
        <Loader />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            mode === 'referrers' ? (
              <ReferrerListCard 
                referrer={item as any} 
                onPress={() => navigation.navigate('ReferrerProfile', { id: item.id })} 
              />
            ) : (
              <JobCard job={item as any} onPress={() => undefined} />
            )
          )}
          ListEmptyComponent={
            <EmptyState 
              icon="heart-outline" 
              title={mode === 'referrers' ? "No saved referrers" : "No saved jobs"} 
              subtitle={`Tap the heart icon on a ${mode === 'referrers' ? 'referrer' : 'job'} to save it for later.`} 
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  modeToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  modeBtnActive: { backgroundColor: '#6A3EFF' },
  modeText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  modeTextActive: { color: '#fff' },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 110, paddingTop: spacing.sm },
});
