import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip, Input } from '@/components/ui';
import { colors, radii, spacing, typography } from '@/theme';
import { EmploymentType, EMPLOYMENT_TYPE_LABELS } from '@/types/enums';

export interface ExperienceForm {
  id: string; // local key only
  companyName: string;
  title: string;
  employmentType: EmploymentType | '';
  location: string;
  startDate: string; // "MM/YYYY"
  endDate: string; // "MM/YYYY"
  current: boolean;
  description: string;
}

export type ExperienceErrors = Partial<Record<keyof ExperienceForm, string>>;

const EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[];

/** A single editable work-experience entry used in onboarding Step 2. */
export function ExperienceCard({
  index,
  value,
  errors,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  value: ExperienceForm;
  errors?: ExperienceErrors;
  canRemove: boolean;
  onChange: (patch: Partial<ExperienceForm>) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.headTitle}>Experience {index + 1}</Text>
        {canRemove && (
          <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        )}
      </View>

      <Input
        label="Company Name *"
        placeholder="e.g. Google"
        icon="business-outline"
        value={value.companyName}
        onChangeText={(t) => onChange({ companyName: t })}
        error={errors?.companyName}
      />
      <Input
        label="Job Title *"
        placeholder="e.g. Backend Developer"
        icon="briefcase-outline"
        value={value.title}
        onChangeText={(t) => onChange({ title: t })}
        error={errors?.title}
      />

      <Text style={styles.fieldLabel}>Employment Type *</Text>
      <View style={styles.chips}>
        {EMPLOYMENT_TYPES.map((t) => (
          <Chip
            key={t}
            label={EMPLOYMENT_TYPE_LABELS[t]}
            selected={value.employmentType === t}
            onPress={() => onChange({ employmentType: t })}
            size="sm"
          />
        ))}
      </View>
      {!!errors?.employmentType && <Text style={styles.errText}>{errors.employmentType}</Text>}

      <Input
        label="Location"
        placeholder="e.g. Bengaluru, India"
        icon="location-outline"
        value={value.location}
        onChangeText={(t) => onChange({ location: t })}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Input
            label="Start Date *"
            placeholder="MM/YYYY"
            icon="calendar-outline"
            keyboardType="numbers-and-punctuation"
            value={value.startDate}
            onChangeText={(t) => onChange({ startDate: t })}
            error={errors?.startDate}
          />
        </View>
        <View style={styles.rowItem}>
          {value.current ? (
            <>
              <Text style={styles.fieldLabel}>End Date</Text>
              <View style={styles.presentBox}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.presentText}>Present</Text>
              </View>
            </>
          ) : (
            <Input
              label="End Date *"
              placeholder="MM/YYYY"
              icon="calendar-outline"
              keyboardType="numbers-and-punctuation"
              value={value.endDate}
              onChangeText={(t) => onChange({ endDate: t })}
              error={errors?.endDate}
            />
          )}
        </View>
      </View>

      <Pressable style={styles.toggleRow} onPress={() => onChange({ current: !value.current })}>
        <Ionicons
          name={value.current ? 'checkbox' : 'square-outline'}
          size={22}
          color={value.current ? colors.primary : colors.textMuted}
        />
        <Text style={styles.toggleText}>I currently work here</Text>
      </Pressable>

      <Input
        label="Description / Responsibilities"
        placeholder="Briefly describe your role and key responsibilities"
        icon="document-text-outline"
        multiline
        value={value.description}
        onChangeText={(t) => onChange({ description: t })}
        style={{ height: 84, textAlignVertical: 'top' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headTitle: { ...typography.bodyStrong, color: colors.text },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removeText: { ...typography.caption, color: colors.danger, fontWeight: '600' },
  fieldLabel: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  errText: { ...typography.caption, color: colors.danger, marginTop: 2, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },
  presentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: colors.successMuted,
  },
  presentText: { ...typography.body, color: colors.success, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, marginBottom: spacing.sm },
  toggleText: { ...typography.body, color: colors.text },
});
