import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chip } from './Chip';
import { Input } from './Input';
import { colors, spacing, typography } from '@/theme';

/** Free-text tag entry: type + submit to add a removable chip. */
export function TagInput({
  label,
  placeholder,
  value,
  onChange,
  icon = 'add-circle-outline',
}: {
  label?: string;
  placeholder: string;
  value: string[];
  onChange: (next: string[]) => void;
  icon?: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
}) {
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setText('');
  };
  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <Input
        icon={icon}
        placeholder={placeholder}
        value={text}
        onChangeText={setText}
        onSubmitEditing={add}
        returnKeyType="done"
        autoCapitalize="words"
        style={{ marginBottom: 0 }}
      />
      {value.length > 0 && (
        <View style={styles.tags}>
          {value.map((t) => (
            <Chip key={t} label={t} selected onRemove={() => onChange(value.filter((x) => x !== t))} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
});
