import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Input, Loader, Screen } from '@/components/ui';
import { qk } from '@/lib/queryClient';
import { AppStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';
import { SendReferralForm, sendReferralSchema } from '@/types/schemas';
import { FullProfile, getMyProfile } from '@/features/profile/usersApi';
import { createReferral } from './referralsApi';

type Resume = FullProfile['resumes'][number];

type Props = NativeStackScreenProps<AppStackParamList, 'SendReferral'>;

export function SendReferralScreen({ route, navigation }: Props) {
  const { referrerId, referrerName } = route.params;
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: qk.me, queryFn: getMyProfile });
  const resume = profile.data?.resumes.find((r: Resume) => r.isPrimary) ?? profile.data?.resumes[0];

  const { control, handleSubmit } = useForm<SendReferralForm>({
    resolver: zodResolver(sendReferralSchema),
    defaultValues: {
      jobRole: '',
      message: `Hi ${referrerName.split(' ')[0]}, I'd really appreciate a referral. I believe I'm a strong fit and have attached my resume. Thank you!`,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: SendReferralForm) =>
      createReferral({
        referrerId,
        jobRole: values.jobRole,
        jobLink: values.jobLink || undefined,
        message: values.message,
        note: values.note || undefined,
        resumeId: resume!.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referrals'] });
      navigation.navigate('Tabs', { screen: 'Requests' });
    },
  });

  if (profile.isLoading) return <Screen><Loader /></Screen>;

  return (
    <Screen scroll>
      <Card style={styles.summary}>
        <Text style={styles.summaryLabel}>Requesting a referral from</Text>
        <Text style={styles.summaryName}>{referrerName}</Text>
      </Card>

      <Controller
        control={control}
        name="jobRole"
        render={({ field: { onChange, value }, fieldState }) => (
          <Input
            label="Job Role *"
            icon="briefcase-outline"
            placeholder="e.g. Backend Developer"
            value={value}
            onChangeText={onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="jobLink"
        render={({ field: { onChange, value }, fieldState }) => (
          <Input
            label="Job Link"
            icon="link-outline"
            placeholder="https://…"
            autoCapitalize="none"
            value={value ?? ''}
            onChangeText={onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="message"
        render={({ field: { onChange, value }, fieldState }) => (
          <Input
            label="Message * (max 500)"
            placeholder="Why you're a good fit…"
            multiline
            value={value}
            onChangeText={onChange}
            error={fieldState.error?.message}
            style={{ height: 110, textAlignVertical: 'top' }}
          />
        )}
      />

      <Text style={styles.label}>Attach Resume *</Text>
      {resume ? (
        <Card style={styles.resume}>
          <Ionicons name="document-text" size={20} color={colors.primary} />
          <Text style={styles.resumeName} numberOfLines={1}>{resume.fileName}</Text>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        </Card>
      ) : (
        <Text style={styles.noResume}>
          No resume on file. Add one from your profile before requesting.
        </Text>
      )}

      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, value }, fieldState }) => (
          <Input
            label="Add a Note (max 200)"
            placeholder="Anything else…"
            value={value ?? ''}
            onChangeText={onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <View style={styles.tips}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb-outline" size={16} color={colors.primary} />
          <Text style={styles.tipsTitle}>Tips to increase your chances</Text>
        </View>
        {[
          'Personalize your message',
          'Attach your latest resume',
          'Mention the specific job role',
          'Be professional and concise',
        ].map((t) => (
          <View key={t} style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.tipText}>{t}</Text>
          </View>
        ))}
      </View>

      {mutation.isError && <Text style={styles.error}>{(mutation.error as Error).message}</Text>}

      <Button
        title="Send Referral Request"
        icon="paper-plane-outline"
        disabled={!resume}
        loading={mutation.isPending}
        onPress={handleSubmit((v) => mutation.mutate(v))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: spacing.sm, marginBottom: spacing.xl },
  summaryLabel: { ...typography.caption, color: colors.textMuted },
  summaryName: { ...typography.h3, color: colors.text, marginTop: 2 },
  label: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.sm },
  resume: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  resumeName: { ...typography.body, color: colors.text, flex: 1 },
  noResume: {
    ...typography.small,
    color: colors.warning,
    backgroundColor: colors.warningMuted,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  error: { ...typography.small, color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  tips: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  tipsTitle: { ...typography.bodyStrong, color: colors.text },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  tipText: { ...typography.small, color: colors.textSecondary },
});
