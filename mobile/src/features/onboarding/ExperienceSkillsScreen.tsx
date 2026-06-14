import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Chip, FormSection, Input, Screen } from '@/components/ui';
import { qk } from '@/lib/queryClient';
import { OnboardingStackParamList } from '@/navigation/types';
import { colors, spacing, typography } from '@/theme';
import { Skill } from '@/types/models';
import { ExperienceCard, ExperienceErrors, ExperienceForm } from './ExperienceCard';
import { OnboardingHeader } from './OnboardingHeader';
import { ExperiencePayload, saveExperienceSkills, searchSkills } from './onboardingApi';
import { Stepper } from './Stepper';
import { WhyCard } from './WhyCard';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ExperienceSkills'>;
type Selected = { id?: string; name: string };

const MIN_SKILLS = 3;
const MM_YYYY = /^(0[1-9]|1[0-2])\/(\d{4})$/;

let uid = 0;
const blankExperience = (): ExperienceForm => ({
  id: `exp-${++uid}`,
  companyName: '',
  title: '',
  employmentType: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
});

/** "MM/YYYY" → ISO string (first of month, UTC), or null if invalid. */
function monthYearToISO(s: string): string | null {
  const m = MM_YYYY.exec(s.trim());
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const year = parseInt(m[2], 10);
  if (year < 1950 || year > 2100) return null;
  return new Date(Date.UTC(year, month - 1, 1)).toISOString();
}

export function ExperienceSkillsScreen({ navigation }: Props) {
  // ── Professional experience ──────────────────────────────────────────────
  const [experiences, setExperiences] = useState<ExperienceForm[]>([blankExperience()]);
  const [expErrors, setExpErrors] = useState<ExperienceErrors[]>([{}]);

  const updateExp = (i: number, patch: Partial<ExperienceForm>) =>
    setExperiences((prev) =>
      prev.map((e, idx) => {
        // Only one experience may be marked "current".
        if (idx !== i) return patch.current === true ? { ...e, current: false } : e;
        return { ...e, ...patch };
      }),
    );
  const addExp = () => {
    setExperiences((prev) => [...prev, blankExperience()]);
    setExpErrors((prev) => [...prev, {}]);
  };
  const removeExp = (i: number) => {
    setExperiences((prev) => prev.filter((_, idx) => idx !== i));
    setExpErrors((prev) => prev.filter((_, idx) => idx !== i));
  };

  // ── Skills ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Selected[]>([]);
  const [skillsError, setSkillsError] = useState<string>();
  const { data: results = [] } = useQuery({ queryKey: qk.skills(search), queryFn: () => searchSkills(search) });

  const isSelected = (name: string) => selected.some((s) => s.name.toLowerCase() === name.toLowerCase());
  const toggleSkill = (skill: Selected) =>
    setSelected((prev) =>
      isSelected(skill.name)
        ? prev.filter((s) => s.name.toLowerCase() !== skill.name.toLowerCase())
        : [...prev, skill],
    );
  const noMatch = useMemo(
    () => search.trim().length > 1 && !results.some((r: Skill) => r.name.toLowerCase() === search.toLowerCase()),
    [search, results],
  );

  // ── Validation + submit ─────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (body: { experiences: ExperiencePayload[]; skillIds: string[]; customSkills: string[] }) =>
      saveExperienceSkills(body),
    onSuccess: () => navigation.navigate('ResumePortfolio'),
  });

  const validate = (): boolean => {
    const errs: ExperienceErrors[] = experiences.map(() => ({}));
    const seen = new Set<string>();
    experiences.forEach((e, i) => {
      if (!e.companyName.trim()) errs[i].companyName = 'Company name is required';
      if (!e.title.trim()) errs[i].title = 'Job title is required';
      if (!e.employmentType) errs[i].employmentType = 'Select an employment type';

      const start = monthYearToISO(e.startDate);
      if (!e.startDate.trim()) errs[i].startDate = 'Start date is required';
      else if (!start) errs[i].startDate = 'Use MM/YYYY';

      if (!e.current) {
        if (!e.endDate.trim()) errs[i].endDate = 'End date is required';
        else {
          const end = monthYearToISO(e.endDate);
          if (!end) errs[i].endDate = 'Use MM/YYYY';
          else if (start && end < start) errs[i].endDate = 'Must be after start date';
        }
      }

      // Duplicate company + title + start date
      if (e.companyName.trim() && e.title.trim() && e.startDate.trim()) {
        const key = `${e.companyName.trim().toLowerCase()}|${e.title.trim().toLowerCase()}|${e.startDate.trim()}`;
        if (seen.has(key)) errs[i].companyName = 'Duplicate experience entry';
        seen.add(key);
      }
    });
    setExpErrors(errs);

    const skillsOk = selected.length >= MIN_SKILLS;
    setSkillsError(skillsOk ? undefined : `Select at least ${MIN_SKILLS} skills`);

    return errs.every((x) => Object.keys(x).length === 0) && skillsOk;
  };

  const onContinue = () => {
    if (!validate()) return;
    const payloadExp: ExperiencePayload[] = experiences.map((e) => ({
      companyName: e.companyName.trim(),
      title: e.title.trim(),
      employmentType: e.employmentType as ExperiencePayload['employmentType'],
      location: e.location.trim() || undefined,
      startDate: monthYearToISO(e.startDate)!,
      endDate: e.current ? null : monthYearToISO(e.endDate),
      current: e.current,
      description: e.description.trim() || undefined,
    }));
    mutation.mutate({
      experiences: payloadExp,
      skillIds: selected.filter((s) => s.id).map((s) => s.id!),
      customSkills: selected.filter((s) => !s.id).map((s) => s.name),
    });
  };

  return (
    <Screen scroll>
      <OnboardingHeader
        stepMeta="STEP 2 OF 5 — YOUR EXPERIENCE & SKILLS"
        title="Experience & Skills"
        subtitle="Add your work history and the skills that make you stand out."
      />
      <Stepper current={2} />

      {/* ── Professional Experience ── */}
      <FormSection
        icon="briefcase-outline"
        title="Professional Experience"
        subtitle="Add your current and previous work experience"
      >
        {experiences.map((exp, i) => (
          <ExperienceCard
            key={exp.id}
            index={i}
            value={exp}
            errors={expErrors[i]}
            canRemove={experiences.length > 1}
            onChange={(patch) => updateExp(i, patch)}
            onRemove={() => removeExp(i)}
          />
        ))}
        <Button title="Add Another Experience" variant="secondary" icon="add" onPress={addExp} />
      </FormSection>

      {/* ── Skills & Expertise ── */}
      <FormSection
        icon="sparkles-outline"
        title="Skills & Expertise"
        subtitle="Add at least 3 skills you're best at"
      >
        <Input
          icon="search-outline"
          placeholder="Search skills e.g. Java, Python, AWS"
          autoCapitalize="none"
          value={search}
          onChangeText={setSearch}
        />

        <Text style={styles.section}>{search ? 'Search Results' : 'Popular Skills'}</Text>
        <View style={styles.wrap}>
          {results.map((s: Skill) => (
            <Chip key={s.id} label={s.name} selected={isSelected(s.name)} onPress={() => toggleSkill({ id: s.id, name: s.name })} />
          ))}
          {noMatch && <Chip label={`+ Add "${search.trim()}"`} onPress={() => toggleSkill({ name: search.trim() })} />}
        </View>

        <Text style={styles.section}>Your Selected Skills ({selected.length})</Text>
        {selected.length === 0 ? (
          <Text style={styles.empty}>No skills added yet</Text>
        ) : (
          <View style={styles.wrap}>
            {selected.map((s) => (
              <Chip key={s.name} label={s.name} selected onRemove={() => toggleSkill(s)} />
            ))}
          </View>
        )}
        {!!skillsError && <Text style={styles.errText}>{skillsError}</Text>}
      </FormSection>

      <WhyCard
        title="Why we ask for this"
        items={[
          { icon: 'shield-checkmark-outline', label: 'Verify Referrers', text: 'Work history helps confirm who can refer you.' },
          { icon: 'locate-outline', label: 'Better Matches', text: 'We match you using real experience and skills.' },
          { icon: 'trending-up-outline', label: 'Stronger Profile', text: 'Complete profiles get more referral responses.' },
          { icon: 'sparkles-outline', label: 'Stand Out', text: 'Show the depth behind your skills.' },
        ]}
      />

      <Button
        title="Continue to Next Step"
        icon="arrow-forward"
        loading={mutation.isPending}
        onPress={onContinue}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  empty: { ...typography.small, color: colors.textMuted },
  errText: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
});
