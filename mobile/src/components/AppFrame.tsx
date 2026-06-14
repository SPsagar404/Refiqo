import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

/**
 * On web, the app would otherwise stretch to the full browser width and look
 * misaligned. This centers it in a phone-sized frame (matching the mockups).
 * On native it's a passthrough.
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.backdrop}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05050A',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: colors.background,
    overflow: 'hidden',
    // subtle device frame on wide screens
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
