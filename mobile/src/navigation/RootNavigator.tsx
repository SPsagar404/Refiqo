import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
    notification: colors.primary,
  },
};

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const onboardingComplete = useAuthStore((s) => s.user?.onboardingComplete ?? false);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (status === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {status !== 'authenticated' ? (
        <AuthNavigator />
      ) : !onboardingComplete ? (
        <OnboardingNavigator />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
