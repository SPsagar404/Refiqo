import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AvailabilityScreen } from '@/features/onboarding/AvailabilityScreen';
import { BasicInfoScreen } from '@/features/onboarding/BasicInfoScreen';
import { ExperienceSkillsScreen } from '@/features/onboarding/ExperienceSkillsScreen';
import { PreferencesScreen } from '@/features/onboarding/PreferencesScreen';
import { ProfileCreatedScreen } from '@/features/onboarding/ProfileCreatedScreen';
import { ResumePortfolioScreen } from '@/features/onboarding/ResumePortfolioScreen';
import { colors } from '@/theme';
import { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitle: '',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="BasicInfo" component={BasicInfoScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ExperienceSkills" component={ExperienceSkillsScreen} />
      <Stack.Screen name="ResumePortfolio" component={ResumePortfolioScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="Availability" component={AvailabilityScreen} />
      <Stack.Screen
        name="ProfileCreated"
        component={ProfileCreatedScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
