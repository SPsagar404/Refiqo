import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, gradients, radii, shadow, spacing, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
  fullWidth = true,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const palette = VARIANTS[variant];
  const isGradient = variant === 'primary';

  const inner = loading ? (
    <ActivityIndicator color={palette.fg} />
  ) : (
    <View style={styles.content}>
      {icon && <Ionicons name={icon} size={18} color={palette.fg} style={styles.icon} />}
      <Text style={[styles.label, { color: palette.fg }]}>{title}</Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        fullWidth && { alignSelf: 'stretch' },
        isGradient && !isDisabled && shadow.glow,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={[...gradients.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.base}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View style={[styles.base, { backgroundColor: palette.bg, borderColor: palette.border, borderWidth: 1 }]}>
          {inner}
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  secondary: { bg: colors.surfaceAlt, fg: colors.text, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  danger: { bg: colors.dangerMuted, fg: colors.danger, border: 'transparent' },
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  label: { ...typography.bodyStrong },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
