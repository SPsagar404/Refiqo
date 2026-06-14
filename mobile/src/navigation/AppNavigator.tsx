import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ChatScreen } from '@/features/chat/ChatScreen';
import { NotificationsScreen } from '@/features/notifications/NotificationsScreen';
import { SavedScreen } from '@/features/profile/SavedScreen';
import { ReferrerProfileScreen } from '@/features/referrers/ReferrerProfileScreen';
import { RequestDetailScreen } from '@/features/referrals/RequestDetailScreen';
import { SendReferralScreen } from '@/features/referrals/SendReferralScreen';
import { colors } from '@/theme';
import { AppStackParamList } from './types';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ReferrerProfile" component={ReferrerProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SendReferral" component={SendReferralScreen} options={{ title: 'Send Referral Request' }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Request Detail' }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Saved" component={SavedScreen} options={{ title: 'Saved Items' }} />
    </Stack.Navigator>
  );
}
