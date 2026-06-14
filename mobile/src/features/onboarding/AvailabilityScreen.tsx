import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '@/components/ui';
import { OnboardingStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';
import {
  AvailabilityStatus,
  AVAILABILITY_LABELS,
  ContactMethod,
  CONTACT_METHOD_LABELS,
  ResponseTime,
  RESPONSE_TIME_LABELS,
} from '@/types/enums';
import { saveAvailability } from './onboardingApi';
import { OnboardingHeader } from './OnboardingHeader';
import { Stepper } from './Stepper';
import { WhyCard } from './WhyCard';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Availability'>;
type IconName = keyof typeof Ionicons.glyphMap;

const AVAILABILITY_META: Record<AvailabilityStatus, { icon: IconName; sub: string }> = {
  AVAILABLE_NOW: { icon: 'checkmark-circle-outline', sub: "I'm actively open to helping with referrals." },
  AVAILABLE_1_2_WEEKS: { icon: 'calendar-outline', sub: "I'll be free to help soon." },
  LIMITED: { icon: 'hourglass-outline', sub: 'I can help occasionally when time allows.' },
  NOT_AVAILABLE: { icon: 'close-circle-outline', sub: "I'm currently not taking referral requests." },
};

const RESPONSE_META: Record<ResponseTime, { icon: IconName; sub: string }> = {
  WITHIN_24H: { icon: 'flash-outline', sub: 'I usually respond within a day.' },
  WITHIN_2_3_DAYS: { icon: 'calendar-outline', sub: 'I respond within a few days.' },
  WITHIN_A_WEEK: { icon: 'time-outline', sub: 'I respond within a week.' },
  MORE_THAN_A_WEEK: { icon: 'hourglass-outline', sub: 'I may take longer to respond.' },
};

const CONTACT_META: Record<ContactMethod, { icon: IconName; sub: string }> = {
  IN_APP_CHAT: { icon: 'chatbubble-ellipses-outline', sub: 'Chat directly inside Refiqo.' },
  EMAIL: { icon: 'mail-outline', sub: 'Reach me via email.' },
  LINKEDIN: { icon: 'logo-linkedin', sub: 'Connect with me on LinkedIn.' },
  PHONE_CALL: { icon: 'call-outline', sub: 'Call me for quick conversations.' },
  VIDEO_CALL: { icon: 'videocam-outline', sub: 'Schedule a video call with me.' },
};

export function AvailabilityScreen({ navigation }: Props) {
  const [availability, setAvailability] = useState<AvailabilityStatus>(AvailabilityStatus.AVAILABLE_NOW);
  const [responseTime, setResponseTime] = useState<ResponseTime>(ResponseTime.WITHIN_24H);
  const [methods, setMethods] = useState<ContactMethod[]>([ContactMethod.IN_APP_CHAT]);

  const mutation = useMutation({
    mutationFn: () =>
      saveAvailability({ availabilityStatus: availability, responseTime, contactMethods: methods }),
    onSuccess: () => navigation.navigate('ProfileCreated'),
  });

  const toggleMethod = (m: ContactMethod) =>
    setMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <Screen scroll>
      <OnboardingHeader
        stepMeta="STEP 5 OF 5 — LET US KNOW WHEN YOU'RE AVAILABLE"
        title="Referral Availability"
        subtitle="Tell referrers when and how you'd like to be reached."
      />
      <Stepper current={5} />

      <Text style={styles.section}>Availability Status</Text>
      {(Object.keys(AVAILABILITY_LABELS) as AvailabilityStatus[]).map((a) => (
        <Option
          key={a}
          icon={AVAILABILITY_META[a].icon}
          label={AVAILABILITY_LABELS[a]}
          subtitle={AVAILABILITY_META[a].sub}
          selected={availability === a}
          success={a === AvailabilityStatus.AVAILABLE_NOW}
          onPress={() => setAvailability(a)}
        />
      ))}

      <Text style={styles.section}>Response Time</Text>
      {(Object.keys(RESPONSE_TIME_LABELS) as ResponseTime[]).map((r) => (
        <Option
          key={r}
          icon={RESPONSE_META[r].icon}
          label={RESPONSE_TIME_LABELS[r]}
          subtitle={RESPONSE_META[r].sub}
          selected={responseTime === r}
          onPress={() => setResponseTime(r)}
        />
      ))}

      <Text style={styles.section}>Preferred Contact Method</Text>
      {(Object.keys(CONTACT_METHOD_LABELS) as ContactMethod[]).map((m) => (
        <Option
          key={m}
          icon={CONTACT_META[m].icon}
          label={CONTACT_METHOD_LABELS[m]}
          subtitle={CONTACT_META[m].sub}
          selected={methods.includes(m)}
          checkbox
          onPress={() => toggleMethod(m)}
        />
      ))}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Availability Summary</Text>
        <SummaryRow label="Availability Status" value={AVAILABILITY_LABELS[availability]} />
        <SummaryRow label="Response Time" value={RESPONSE_TIME_LABELS[responseTime]} />
        <SummaryRow
          label="Contact Method"
          value={methods.map((m) => CONTACT_METHOD_LABELS[m]).join(', ') || '—'}
        />
      </View>

      <WhyCard
        title="Why do we ask this?"
        items={[
          { icon: 'time-outline', label: 'Set Expectations', text: 'Seekers know when to expect a reply.' },
          { icon: 'people-outline', label: 'Better Matches', text: "We connect you when you're available." },
          { icon: 'happy-outline', label: 'Happier Network', text: 'Clear availability keeps everyone in sync.' },
          { icon: 'options-outline', label: "You're in Control", text: 'Update your availability anytime.' },
        ]}
      />

      <Button
        title="Complete Profile"
        icon="checkmark"
        disabled={methods.length === 0}
        loading={mutation.isPending}
        onPress={() => mutation.mutate()}
      />
    </Screen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function Option({
  icon,
  label,
  subtitle,
  selected,
  onPress,
  checkbox,
  success,
}: {
  icon: IconName;
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  checkbox?: boolean;
  success?: boolean;
}) {
  const accent = success ? colors.success : colors.primary;
  const markerName: IconName = checkbox
    ? selected
      ? 'checkbox'
      : 'square-outline'
    : selected
      ? 'radio-button-on'
      : 'radio-button-off';
  return (
    <Pressable
      style={[
        styles.option,
        selected && { borderColor: accent, backgroundColor: success ? colors.successMuted : colors.primaryMuted },
      ]}
      onPress={onPress}
    >
      <View style={[styles.optionIcon, selected && { backgroundColor: success ? colors.successMuted : colors.primaryMuted }]}>
        <Ionicons name={icon} size={18} color={selected ? accent : colors.textSecondary} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
        <Text style={styles.optionSub}>{subtitle}</Text>
      </View>
      <Ionicons name={markerName} size={22} color={selected ? accent : colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionText: { flex: 1 },
  optionLabel: { ...typography.bodyStrong, color: colors.textSecondary },
  optionLabelSelected: { color: colors.text },
  optionSub: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  summary: {
    marginTop: spacing.xl,
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  summaryTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: spacing.lg },
  summaryLabel: { ...typography.small, color: colors.textMuted },
  summaryValue: { ...typography.small, color: colors.success, flex: 1, textAlign: 'right', fontWeight: '600' },
});
