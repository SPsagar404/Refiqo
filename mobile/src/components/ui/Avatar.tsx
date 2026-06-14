import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/theme';

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
  online?: boolean;
}

const PALETTE = ['#7C5CFF', '#F59E0B', '#22C55E', '#38BDF8', '#EF4444', '#EC4899'];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ name, uri, size = 48, online }: AvatarProps) {
  const colorIndex = name.charCodeAt(0) % PALETTE.length;
  const dot = Math.max(10, size * 0.28);
  return (
    <View>
      {uri ? (
        <Image source={{ uri }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: PALETTE[colorIndex] },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials(name) || '?'}</Text>
        </View>
      )}
      {online !== undefined && (
        <View
          style={[
            styles.dot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: online ? colors.success : colors.textMuted,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: colors.surfaceAlt },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.white, fontWeight: '700' },
  dot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    borderWidth: 2,
    borderColor: colors.background,
  },
});
