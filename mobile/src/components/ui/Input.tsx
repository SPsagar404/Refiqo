import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
}

// react-native-web renders a native <input>/<textarea> that shows the browser's
// default focus outline; the violet border is our focus indicator, so suppress it.
const noOutline = Platform.select({ web: { outlineStyle: 'none' } }) as object | undefined;

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, icon, secure, style, ...props },
  ref,
) {
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);
  const multiline = !!props.multiline;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={colors.textMuted}
            style={[styles.leftIcon, multiline && styles.leftIconTop]}
          />
        )}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && styles.inputMultiline, noOutline, style]}
          {...props}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  fieldFocused: { borderColor: '#6A3EFF', borderWidth: 1.5 },
  fieldError: { borderColor: colors.danger },
  leftIcon: { marginRight: spacing.sm },
  leftIconTop: { marginTop: spacing.xs },
  input: { flex: 1, color: colors.text, ...typography.body, paddingVertical: 0 },
  inputMultiline: { minHeight: 88, paddingTop: 2, textAlignVertical: 'top' },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
});
