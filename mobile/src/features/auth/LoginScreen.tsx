import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/authStore';
import { colors, radii, shadow, spacing, typography } from '@/theme';
import { LoginForm, loginSchema } from '@/types/schemas';
import { login } from './authApi';
import { Controller, useForm } from 'react-hook-form';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;
type Method = 'email' | 'phone';

const LOGIN_GRADIENT = ['#9346FF', '#6925F0'] as const;

const SOCIALS = [
  { id: 'google', label: 'Continue with Google', icon: 'logo-google' as const, color: '#4285F4' },
  { id: 'apple', label: 'Continue with Apple', icon: 'logo-apple' as const, color: '#FFFFFF' },
  { id: 'linkedin', label: 'Continue with LinkedIn', icon: 'logo-linkedin' as const, color: '#0A66C2' },
];

const FEATURES = [
  { icon: 'shield-checkmark-outline' as const, title: 'Verified Referrers', sub: 'Trusted professionals' },
  { icon: 'flash-outline' as const, title: 'Faster Referrals', sub: 'Save time, get referred' },
  { icon: 'lock-closed-outline' as const, title: 'Secure & Private', sub: 'Your data is safe' },
];

export function LoginScreen({ navigation }: Props) {
  const setSession = useAuthStore((s) => s.setSession);
  const [method, setMethod] = useState<Method>('email');
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const mutation = useMutation({ mutationFn: login, onSuccess: (res) => setSession(res) });

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#070B1F', '#030714']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} />
      <View style={styles.glowMid} />

      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Hero ── */}
            <View style={styles.hero}>
              <View style={styles.heroText}>
                <Text style={styles.brand}>
                  Refi<Text style={styles.brandAccent}>qo</Text>
                </Text>
                <Text style={styles.welcome}>Welcome back!</Text>
                <Text style={styles.subtitle}>
                  Login to continue your{'\n'}
                  <Text style={styles.subtitleAccent}>referral journey</Text>
                </Text>
              </View>
              <HeroArt />
            </View>

            {/* ── Auth card ── */}
            <View style={styles.card}>
              <View style={styles.tabs}>
                <TabButton icon="mail-outline" label="Email" active={method === 'email'} onPress={() => setMethod('email')} />
                <TabButton icon="phone-portrait-outline" label="Phone" active={method === 'phone'} onPress={() => setMethod('phone')} />
              </View>

              {method === 'email' ? (
                <>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value }, fieldState }) => (
                      <Field
                        icon="mail-outline"
                        placeholder="Enter your email"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value }, fieldState }) => (
                      <Field
                        icon="lock-closed-outline"
                        placeholder="Enter your password"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        error={fieldState.error?.message}
                        rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        onRightPress={() => setShowPassword((s) => !s)}
                      />
                    )}
                  />

                  <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
                    <Text style={styles.forgot}>Forgot Password?</Text>
                  </Pressable>

                  {mutation.isError && (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle" size={16} color={colors.danger} />
                      <Text style={styles.errorText}>{(mutation.error as Error).message || 'Invalid credentials'}</Text>
                    </View>
                  )}

                  <Pressable
                    onPress={handleSubmit((v) => mutation.mutate(v))}
                    disabled={mutation.isPending}
                    style={({ pressed }) => [pressed && styles.pressed]}
                    accessibilityLabel="Login"
                  >
                    <LinearGradient colors={[...LOGIN_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loginBtn}>
                      <Text style={styles.loginText}>{mutation.isPending ? 'Logging in…' : 'Login'}</Text>
                      {!mutation.isPending && <Ionicons name="arrow-forward" size={20} color={colors.white} />}
                    </LinearGradient>
                  </Pressable>
                </>
              ) : (
                <View style={styles.phonePane}>
                  <Field icon="call-outline" placeholder="Enter your phone number" keyboardType="phone-pad" value="" onChangeText={() => undefined} />
                  <View style={styles.comingSoon}>
                    <Ionicons name="time-outline" size={15} color={colors.textMuted} />
                    <Text style={styles.comingSoonText}>Phone login is coming soon — use email for now.</Text>
                  </View>
                </View>
              )}

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.or}>OR</Text>
                <View style={styles.line} />
              </View>

              {SOCIALS.map((s) => (
                <Pressable key={s.id} style={({ pressed }) => [styles.social, pressed && styles.pressed]} accessibilityLabel={s.label}>
                  <View style={styles.socialIcon}>
                    <Ionicons name={s.icon} size={22} color={s.color} />
                  </View>
                  <Text style={styles.socialLabel}>{s.label}</Text>
                </Pressable>
              ))}

              <View style={styles.signup}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <Pressable onPress={() => navigation.navigate('Signup')} hitSlop={6}>
                  <Text style={styles.signupLink}>Sign up</Text>
                </Pressable>
              </View>
            </View>

            {/* ── Trust features ── */}
            <View style={styles.features}>
              {FEATURES.map((f, i) => (
                <View key={f.title} style={[styles.feature, i < FEATURES.length - 1 && styles.featureBorder]}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={f.icon} size={20} color={colors.primaryLink} />
                  </View>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/** Decorative referral/verification illustration (no external asset). */
function HeroArt() {
  return (
    <View style={styles.art}>
      <View style={styles.orbit} />
      <View style={styles.docCard}>
        <View style={styles.docAvatar} />
        <View style={[styles.docLine, { width: '70%' }]} />
        <View style={[styles.docLine, { width: '90%' }]} />
        <View style={[styles.docLine, { width: '60%' }]} />
      </View>
      <View style={[styles.person, styles.personBlue]}>
        <Ionicons name="person" size={20} color="#fff" />
      </View>
      <View style={[styles.person, styles.personPurple]}>
        <Ionicons name="person" size={16} color="#fff" />
      </View>
      <LinearGradient colors={['#6D5CFF', '#7F39FF']} style={styles.shield}>
        <Ionicons name="checkmark" size={20} color="#fff" />
      </LinearGradient>
    </View>
  );
}

function TabButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Ionicons name={icon} size={18} color={active ? colors.primaryLink : colors.textMuted} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  icon,
  rightIcon,
  onRightPress,
  error,
  ...input
}: {
  icon: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  error?: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldWrap}>
      <View style={[styles.field, !!error && styles.fieldError]}>
        <Ionicons name={icon} size={20} color={colors.textMuted} />
        <TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...input} />
        {rightIcon && (
          <Pressable onPress={onRightPress} hitSlop={8}>
            <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.fieldErrorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030714' },
  flex: { flex: 1 },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: 'rgba(126, 63, 255, 0.28)',
  },
  glowMid: {
    position: 'absolute',
    top: 220,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: 'rgba(72, 54, 180, 0.14)',
  },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxl },

  // Hero
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroText: { flex: 1 },
  brand: { fontSize: 42, fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  brandAccent: { color: colors.primaryLink },
  welcome: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: spacing.lg },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 },
  subtitleAccent: { color: colors.primaryLink, fontWeight: '700' },

  // Illustration
  art: { width: 130, height: 150, marginLeft: spacing.sm },
  orbit: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  docCard: {
    position: 'absolute',
    right: 0,
    top: 14,
    width: 86,
    height: 96,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    padding: 10,
    transform: [{ rotate: '6deg' }],
  },
  docAvatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 8 },
  docLine: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 6 },
  person: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  personBlue: { width: 44, height: 44, left: 8, top: 18, backgroundColor: '#5B6CF0' },
  personPurple: { width: 36, height: 36, left: 6, top: 70, backgroundColor: '#8B3CF0' },
  shield: {
    position: 'absolute',
    right: 2,
    bottom: 6,
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },

  // Card
  card: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(10, 13, 32, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(155, 77, 255, 0.3)',
    ...shadow.card,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: 'rgba(145, 76, 255, 0.7)',
    backgroundColor: 'rgba(145, 76, 255, 0.08)',
    ...shadow.glow,
  },
  tabLabel: { ...typography.bodyStrong, color: colors.textMuted },
  tabLabelActive: { color: colors.text },

  fieldWrap: { marginBottom: spacing.md },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 58,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fieldError: { borderColor: colors.danger },
  input: { flex: 1, color: colors.text, ...typography.body, padding: 0 },
  fieldErrorText: { ...typography.caption, color: colors.danger, marginTop: 6, marginLeft: 4 },

  forgotWrap: { alignSelf: 'flex-end', marginTop: 2, marginBottom: spacing.lg },
  forgot: { ...typography.bodyStrong, color: colors.primaryLink },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.dangerMuted,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.small, color: colors.danger, flex: 1 },

  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: 60,
    borderRadius: radii.lg,
    ...shadow.glow,
  },
  loginText: { fontSize: 18, fontWeight: '800', color: colors.white },
  pressed: { opacity: 0.9 },

  phonePane: { marginBottom: spacing.sm },
  comingSoon: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  comingSoonText: { ...typography.caption, color: colors.textMuted },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { ...typography.small, color: colors.textMuted, marginHorizontal: spacing.lg },

  social: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: spacing.md,
  },
  socialIcon: { width: 56, alignItems: 'center', justifyContent: 'center' },
  socialLabel: { ...typography.bodyStrong, color: colors.text, flex: 1, textAlign: 'center', marginRight: 56 },

  signup: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  signupText: { ...typography.body, color: colors.textMuted },
  signupLink: { ...typography.body, color: colors.primaryLink, fontWeight: '800' },

  // Features
  features: { flexDirection: 'row', marginTop: spacing.xxl },
  feature: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  featureBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(155, 77, 255, 0.12)',
    marginBottom: spacing.sm,
  },
  featureTitle: { ...typography.caption, color: colors.primaryLink, fontWeight: '700', textAlign: 'center' },
  featureSub: { ...typography.caption, color: colors.textMuted, fontSize: 10, marginTop: 3, textAlign: 'center' },
});
