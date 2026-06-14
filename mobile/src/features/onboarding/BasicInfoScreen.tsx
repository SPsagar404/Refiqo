import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { Control, Controller, useForm } from 'react-hook-form';
import { Button, FormSection, Input, Screen } from '@/components/ui';
import { OnboardingStackParamList } from '@/navigation/types';
import { BasicInfoForm, basicInfoSchema } from '@/types/schemas';
import { OnboardingHeader } from './OnboardingHeader';
import { saveBasicInfo } from './onboardingApi';
import { Stepper } from './Stepper';
import { WhyCard } from './WhyCard';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'BasicInfo'>;
type FieldName = keyof BasicInfoForm;

interface FieldSpec {
  name: FieldName;
  label: string;
  placeholder: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'url';
  multiline?: boolean;
  caps?: 'none' | 'words' | 'sentences';
}

function Field({ control, spec }: { control: Control<BasicInfoForm>; spec: FieldSpec }) {
  return (
    <Controller
      control={control}
      name={spec.name}
      render={({ field: { onChange, value }, fieldState }) => (
        <Input
          label={spec.label}
          placeholder={spec.placeholder}
          icon={spec.icon}
          keyboardType={spec.keyboard === 'url' ? 'default' : spec.keyboard}
          autoCapitalize={spec.caps ?? 'sentences'}
          value={value === undefined ? '' : String(value)}
          onChangeText={onChange}
          error={fieldState.error?.message}
          multiline={spec.multiline}
          style={spec.multiline ? { height: 96, textAlignVertical: 'top' } : undefined}
        />
      )}
    />
  );
}

export function BasicInfoScreen({ navigation }: Props) {
  const { control, handleSubmit } = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: { fullName: '', city: '', country: '', phone: '' },
  });

  const mutation = useMutation({
    mutationFn: saveBasicInfo,
    onSuccess: () => navigation.navigate('ExperienceSkills'),
  });

  return (
    <Screen scroll>
      <OnboardingHeader
        stepMeta="STEP 1 OF 5 — TELL US ABOUT YOURSELF"
        title="Basic Information"
        subtitle="Build your Refiqo profile so referrers can get to know you."
      />
      <Stepper current={1} />

      <FormSection icon="person-outline" title="Personal Details" subtitle="Tell us your basic details">
        <Field control={control} spec={{ name: 'fullName', label: 'Full Name *', placeholder: 'Aarav Sharma', icon: 'person-outline', caps: 'words' }} />
        <Field control={control} spec={{ name: 'city', label: 'City *', placeholder: 'Bengaluru', icon: 'location-outline', caps: 'words' }} />
        <Field control={control} spec={{ name: 'country', label: 'Country *', placeholder: 'India', icon: 'flag-outline', caps: 'words' }} />
      </FormSection>

      <FormSection icon="link-outline" title="Contact & Links" subtitle="How we can reach you">
        <Field control={control} spec={{ name: 'phone', label: 'Phone Number *', placeholder: '+91 90000 00000', icon: 'call-outline', keyboard: 'phone-pad' }} />
        <Field control={control} spec={{ name: 'linkedinUrl', label: 'LinkedIn Profile', placeholder: 'https://linkedin.com/in/…', icon: 'logo-linkedin', keyboard: 'url', caps: 'none' }} />
        <Field control={control} spec={{ name: 'portfolioUrl', label: 'Portfolio / Website', placeholder: 'https://your-site.com', icon: 'globe-outline', keyboard: 'url', caps: 'none' }} />
      </FormSection>

      <FormSection icon="school-outline" title="Education" subtitle="Your highest education">
        <Field control={control} spec={{ name: 'degree', label: 'Highest Degree', placeholder: 'B.Tech Computer Science', icon: 'ribbon-outline' }} />
        <Field control={control} spec={{ name: 'fieldOfStudy', label: 'Field of Study', placeholder: 'Computer Science', icon: 'book-outline' }} />
        <Field control={control} spec={{ name: 'institution', label: 'University / College', placeholder: 'XYZ University', icon: 'business-outline' }} />
      </FormSection>

      <FormSection icon="happy-outline" title="About You" subtitle="Help us understand you better">
        <Field control={control} spec={{ name: 'about', label: 'About Me', placeholder: 'A short intro (max 500 chars)', icon: 'document-text-outline', multiline: true }} />
      </FormSection>

      <WhyCard
        title="Why this information?"
        items={[
          { icon: 'locate-outline', label: 'Better Matches', text: 'We connect you with the most relevant referrers.' },
          { icon: 'shield-checkmark-outline', label: 'Build Trust', text: 'Complete profiles get more referral responses.' },
          { icon: 'flash-outline', label: 'Faster Replies', text: 'Referrers reach you through the right channel.' },
          { icon: 'lock-closed-outline', label: 'Private & Safe', text: 'Your data is encrypted and never sold.' },
        ]}
      />

      <Button
        title="Continue to Next Step"
        icon="arrow-forward"
        loading={mutation.isPending}
        onPress={handleSubmit((v) => mutation.mutate(v))}
      />
    </Screen>
  );
}
