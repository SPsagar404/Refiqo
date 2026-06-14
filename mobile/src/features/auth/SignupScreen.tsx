import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Input, Screen } from '@/components/ui';
import { AuthStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, typography } from '@/theme';
import { SignupForm, signupSchema } from '@/types/schemas';
import { signup } from './authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const setSession = useAuthStore((s) => s.setSession);
  const { control, handleSubmit } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const mutation = useMutation({ mutationFn: signup, onSuccess: (res) => setSession(res) });

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.sub}>Join Refiqo and start getting referrals.</Text>

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value }, fieldState }) => (
            <Input
              label="Full name"
              icon="person-outline"
              placeholder="Aarav Sharma"
              value={value}
              onChangeText={onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value }, fieldState }) => (
            <Input
              label="Email address"
              icon="mail-outline"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value }, fieldState }) => (
            <Input
              label="Password"
              icon="lock-closed-outline"
              placeholder="At least 8 characters"
              secure
              value={value}
              onChangeText={onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        {mutation.isError && (
          <Text style={styles.formError}>{(mutation.error as Error).message}</Text>
        )}

        <Button
          title="Create account"
          loading={mutation.isPending}
          onPress={handleSubmit((values) => mutation.mutate(values))}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Sign in</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text, marginTop: spacing.xxl },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl },
  formError: { ...typography.small, color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { ...typography.small, color: colors.textSecondary },
  link: { ...typography.small, color: colors.primary, fontWeight: '700' },
});
