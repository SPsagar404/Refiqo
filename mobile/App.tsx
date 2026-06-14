import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { Platform } from 'react-native';
import { AppFrame } from '@/components/AppFrame';
import { queryClient } from '@/lib/queryClient';
import { RootNavigator } from '@/navigation/RootNavigator';
import { DashboardPreviewHost } from '@/preview/DashboardPreviewHost';
// initializes the auth↔api bridge as a side effect
import '@/stores/authStore';

const previewMode =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  window.location?.search?.includes('preview=dashboard');

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <AppFrame>{previewMode ? <DashboardPreviewHost /> : <RootNavigator />}</AppFrame>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
