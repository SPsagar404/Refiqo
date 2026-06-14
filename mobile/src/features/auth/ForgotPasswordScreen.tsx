import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Input, Screen } from '@/components/ui';
import { AuthStackParamList } from '@/navigation/types';
import { colors, spacing, typography } from '@/theme';
import { forgotPassword } from './authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const mutation = useMutation({ mutationFn: forgotPassword });

  return (
    <Screen scroll>
      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.sub}>
        Enter your email and we'll send you a link to reset your password.
      </Text>

      {mutation.isSuccess ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            If an account exists for {email}, a reset link is on its way.
          </Text>
          <Button title="Back to sign in" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      ) : (
        <>
          <Input
            label="Email address"
            icon="mail-outline"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Button
            title="Send reset link"
            loading={mutation.isPending}
            disabled={!email.includes('@')}
            onPress={() => mutation.mutate(email.trim())}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text, marginTop: spacing.xxl },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl },
  successBox: { gap: spacing.lg },
  successText: { ...typography.body, color: colors.success },
});
