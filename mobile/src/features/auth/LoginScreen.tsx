import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Input, Screen } from '@/components/ui';
import { AuthStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/authStore';
import { colors, radii, spacing, typography } from '@/theme';
import { LoginForm, loginSchema } from '@/types/schemas';
import { login } from './authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const OAUTH = [
  { id: 'google', label: 'Continue with Google', icon: 'logo-google' as const },
  { id: 'linkedin', label: 'Continue with LinkedIn', icon: 'logo-linkedin' as const },
  { id: 'github', label: 'Continue with GitHub', icon: 'logo-github' as const },
];

export function LoginScreen({ navigation }: Props) {
  const setSession = useAuthStore((s) => s.setSession);
  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (res) => setSession(res),
  });

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Ionicons name="people" size={20} color={colors.white} />
          </View>
          <Text style={styles.brand}>Refiqo</Text>
        </View>

        <Text style={styles.headline}>
          Get the right{'\n'}referral. <Text style={{ color: colors.primary }}>Faster.</Text>
        </Text>
        <Text style={styles.sub}>
          Connect with professionals and get referred to your dream company.
        </Text>

        <View style={styles.oauthGroup}>
          {OAUTH.map((p) => (
            <Pressable
              key={p.id}
              style={styles.oauthBtn}
              onPress={() => mutation.reset()}
              accessibilityLabel={p.label}
            >
              <Ionicons name={p.icon} size={18} color={colors.textInverse} />
              <Text style={styles.oauthLabel}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.or}>OR</Text>
          <View style={styles.line} />
        </View>

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
              placeholder="••••••••"
              secure
              value={value}
              onChangeText={onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        {mutation.isError && (
          <Text style={styles.formError}>
            {(mutation.error as Error).message || 'Invalid credentials'}
          </Text>
        )}

        <Button
          title="Sign In"
          loading={mutation.isPending}
          onPress={handleSubmit((values) => mutation.mutate(values))}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.link}>Sign up</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  brand: { ...typography.h2, color: colors.text },
  headline: { ...typography.display, color: colors.text, marginTop: spacing.xl },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl },
  oauthGroup: { gap: spacing.md },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    height: 52,
    gap: spacing.sm,
  },
  oauthLabel: { ...typography.bodyStrong, color: colors.textInverse },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { ...typography.small, color: colors.textMuted, marginHorizontal: spacing.lg },
  forgot: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  forgotText: { ...typography.small, color: colors.primary, fontWeight: '600' },
  formError: { ...typography.small, color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { ...typography.small, color: colors.textSecondary },
  link: { ...typography.small, color: colors.primary, fontWeight: '700' },
});
