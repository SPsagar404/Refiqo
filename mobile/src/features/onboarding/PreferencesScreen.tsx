import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Chip, Input, Screen, TagInput } from '@/components/ui';
import { OnboardingStackParamList } from '@/navigation/types';
import { colors, spacing, typography } from '@/theme';
import { ReferralCategory, REFERRAL_CATEGORY_LABELS } from '@/types/enums';
import { OnboardingHeader } from './OnboardingHeader';
import { savePreferences } from './onboardingApi';
import { Stepper } from './Stepper';
import { WhyCard } from './WhyCard';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Preferences'>;

const SUGGESTED_ROLES = [
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'DevOps Engineer',
  'UI/UX Designer',
  'Data Scientist',
];

export function PreferencesScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<ReferralCategory[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState('');
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [preferredCompanies, setPreferredCompanies] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: () =>
      savePreferences({ categories, roles, preferredCompanies, preferredLocations }),
    onSuccess: () => navigation.navigate('Availability'),
  });

  const toggleCategory = (c: ReferralCategory) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleRole = (r: string) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  const addRole = () => {
    const r = roleInput.trim();
    if (r && !roles.includes(r)) setRoles((prev) => [...prev, r]);
    setRoleInput('');
  };

  return (
    <Screen scroll>
      <OnboardingHeader
        stepMeta="STEP 4 OF 5 — TELL US WHAT YOU'RE LOOKING FOR"
        title="Referral Preferences"
        subtitle="Set your preferences so we can match you with the right referrals."
      />
      <Stepper current={4} />

      <Text style={styles.section}>Referral Categories *</Text>
      <View style={styles.wrap}>
        {(Object.keys(REFERRAL_CATEGORY_LABELS) as ReferralCategory[]).map((c) => (
          <Chip key={c} label={REFERRAL_CATEGORY_LABELS[c]} selected={categories.includes(c)} onPress={() => toggleCategory(c)} />
        ))}
      </View>

      <Text style={styles.section}>Preferred Roles *</Text>
      <Input
        icon="add-circle-outline"
        placeholder="Add a role and press done"
        value={roleInput}
        onChangeText={setRoleInput}
        onSubmitEditing={addRole}
        returnKeyType="done"
      />
      <View style={styles.wrap}>
        {SUGGESTED_ROLES.map((r) => (
          <Chip key={r} label={r} selected={roles.includes(r)} onPress={() => toggleRole(r)} />
        ))}
      </View>
      {roles.length > 0 && (
        <>
          <Text style={styles.section}>Selected Roles</Text>
          <View style={styles.wrap}>
            {roles.map((r) => (
              <Chip key={r} label={r} selected onRemove={() => toggleRole(r)} />
            ))}
          </View>
        </>
      )}

      <Text style={styles.section}>Preferred Locations</Text>
      <Text style={styles.hint}>Optional — add cities or countries you'd like referrals in.</Text>
      <TagInput
        placeholder="Add a location and press done"
        icon="location-outline"
        value={preferredLocations}
        onChange={setPreferredLocations}
      />

      <Text style={styles.section}>Preferred Companies</Text>
      <Text style={styles.hint}>Optional — companies you'd love a referral to.</Text>
      <TagInput
        placeholder="Add a company and press done"
        icon="business-outline"
        value={preferredCompanies}
        onChange={setPreferredCompanies}
      />

      <View style={{ height: spacing.xl }} />
      <WhyCard
        title="Why set referral preferences?"
        items={[
          { icon: 'locate-outline', label: 'Better Matches', text: 'We surface referrals that fit your goals.' },
          { icon: 'notifications-outline', label: 'Relevant Opportunities', text: 'Get notified about roles you actually want.' },
          { icon: 'hourglass-outline', label: "Save Everyone's Time", text: 'Referrers know exactly how to help you.' },
          { icon: 'rocket-outline', label: 'Faster Results', text: 'Targeted preferences lead to quicker referrals.' },
        ]}
      />
      <Button
        title="Continue to Next Step"
        icon="arrow-forward"
        disabled={categories.length === 0 || roles.length === 0}
        loading={mutation.isPending}
        onPress={() => mutation.mutate()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.xs },
  hint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
