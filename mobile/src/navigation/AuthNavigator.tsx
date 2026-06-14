import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { SignupScreen } from '@/features/auth/SignupScreen';
import { colors } from '@/theme';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: '' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
