import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip, EmptyState, Input, Loader, Screen } from '@/components/ui';
import { ReferrerListCard } from '@/components/ReferrerListCard';
import { qk } from '@/lib/queryClient';
import { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { AvailabilityStatus, AVAILABILITY_LABELS } from '@/types/enums';
import { discoverReferrers } from '@/features/referrers/referrersApi';
import { discoverJobs } from './jobsApi';
import { JobCard } from './JobCard';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function DiscoveryScreen() {
  const navigation = useNavigation<Nav>();
  const [mode, setMode] = useState<'referrers' | 'jobs'>('referrers');
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState<AvailabilityStatus | null>(null);

  const referrerParams = { search: search || undefined, availability: availability || undefined, limit: 20 };
  const jobParams = { search: search || undefined, limit: 20 };

  const referrersQuery = useQuery({
    queryKey: qk.referrers(referrerParams),
    queryFn: () => discoverReferrers(referrerParams),
    enabled: mode === 'referrers',
  });

  const jobsQuery = useQuery({
    queryKey: ['jobs', jobParams],
    queryFn: () => discoverJobs(jobParams),
    enabled: mode === 'jobs',
  });

  const isLoading = mode === 'referrers' ? referrersQuery.isLoading : jobsQuery.isLoading;
  const data = mode === 'referrers' ? referrersQuery.data?.data : jobsQuery.data?.data;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Discovery</Text>
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

        <Input
          icon="search"
          placeholder={mode === 'referrers' ? "Search roles, skills or companies" : "Search job titles or description"}
          autoCapitalize="none"
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 0 }}
        />

        {mode === 'referrers' && (
          <View style={styles.filters}>
            <Chip 
              label="All" 
              selected={!availability} 
              onPress={() => setAvailability(null)} 
              size="sm" 
              style={!availability ? styles.chipSelected : styles.chipUnselected}
            />
            {(Object.keys(AVAILABILITY_LABELS) as AvailabilityStatus[]).map((a) => (
              <Chip
                key={a}
                label={AVAILABILITY_LABELS[a]}
                selected={availability === a}
                onPress={() => setAvailability(a)}
                size="sm"
                style={availability === a ? styles.chipSelected : styles.chipUnselected}
              />
            ))}
          </View>
        )}
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
              <ReferrerListCard referrer={item} onPress={() => navigation.navigate('ReferrerProfile', { id: item.id })} />
            ) : (
              <JobCard job={item} onPress={() => undefined /* TODO: Job Detail */} />
            )
          )}
          ListEmptyComponent={
            <EmptyState 
              icon="search" 
              title={mode === 'referrers' ? "No referrers found" : "No jobs found"} 
              subtitle="Try adjusting your search or filters." 
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, backgroundColor: '#040914' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  modeToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  modeBtnActive: { backgroundColor: '#6A3EFF' },
  modeText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  modeTextActive: { color: '#fff' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.lg, marginBottom: spacing.sm },
  chipSelected: { backgroundColor: '#6A3EFF', borderColor: '#6A3EFF' },
  chipUnselected: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 110, paddingTop: spacing.lg, backgroundColor: '#040914' },
});
