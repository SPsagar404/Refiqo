import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { qk, queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme';
import { ConversationSummary, ReferrerCard } from '@/types/models';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { referrerToFeedItem } from '@/features/dashboard/feedApi';

/**
 * Dev-only: renders the real DashboardScreen with Figma-matching mock data and
 * no backend/auth, so the design can be screenshotted and compared to the
 * mockup. Activated on web via `?preview=dashboard`.
 */
const Stack = createNativeStackNavigator();

const navTheme: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.primary, notification: colors.primary },
};

const card = (o: Partial<ReferrerCard> & { id: string; fullName: string }): ReferrerCard => ({
  jobTitle: null, avatarUrl: null, company: null, companyLogoUrl: null, location: null,
  experienceYears: null, canRefer: true, verificationStatus: 'VERIFIED', availabilityStatus: 'AVAILABLE_NOW',
  avgResponseHours: 4, ratingAvg: 4.8, skills: [], ...o,
});

const MATCHES: ReferrerCard[] = [
  card({ id: 'm1', fullName: 'Sahil Mehta', jobTitle: 'Java Backend Developer', company: 'TCS', location: 'Pune, India', skills: ['Java', 'Spring Boot', 'Microservices', 'AWS', 'MySQL'], matchScore: 92 }),
  card({ id: 'm2', fullName: 'Rahul Verma', jobTitle: 'Backend Developer', company: 'Infosys', location: 'Bengaluru, India', skills: ['Java', 'Spring Boot', 'Docker'], matchScore: 85 }),
  card({ id: 'm3', fullName: 'Priya Singh', jobTitle: 'Java Developer', company: 'Wipro', location: 'Hyderabad, India', skills: ['Java', 'SQL', 'Hibernate'], matchScore: 80 }),
];

const RECO: ReferrerCard[] = [
  card({ id: 'r1', fullName: 'Amit Sharma', jobTitle: 'Senior Java Developer', company: 'TCS', canRefer: true }),
  card({ id: 'r2', fullName: 'Priya Singh', jobTitle: 'Software Engineer', company: 'Infosys', canRefer: false }),
  card({ id: 'r3', fullName: 'Rahul Verma', jobTitle: 'Backend Developer', company: 'Wipro', canRefer: true }),
];

const now = Date.now();
const CHATS: ConversationSummary[] = [
  { id: 'c1', participant: { id: 'p1', fullName: 'Amit Sharma', avatarUrl: null, jobTitle: null, lastSeenAt: new Date(now).toISOString() }, lastMessage: { body: 'Hey Sagar, I can definitely refer you for this role.', type: 'TEXT', createdAt: new Date(now - 120000).toISOString(), senderId: 'p1' }, lastMessageAt: new Date(now - 120000).toISOString(), unreadCount: 2 },
  { id: 'c2', participant: { id: 'p2', fullName: 'Priya Singh', avatarUrl: null, jobTitle: null, lastSeenAt: new Date(now - 9_000_000).toISOString() }, lastMessage: { body: 'Sure, please share your resume.', type: 'TEXT', createdAt: new Date(now - 3_600_000).toISOString(), senderId: 'me' }, lastMessageAt: new Date(now - 3_600_000).toISOString(), unreadCount: 0 },
];

export function DashboardPreviewHost() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    queryClient.setQueryData(qk.topMatches, MATCHES);
    queryClient.setQueryData(qk.recommended, RECO);
    queryClient.setQueryData(qk.feed, [...MATCHES, ...RECO].map(referrerToFeedItem));
    queryClient.setQueryData(qk.conversations, CHATS);
    queryClient.setQueryData(qk.unreadCount, 3);
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'sagar@example.com', fullName: 'Sagar Jadhav', avatarUrl: null, role: 'USER', isVerified: true, onboardingStep: 5, onboardingComplete: true, createdAt: new Date().toISOString() },
    });
    setReady(true);
  }, []);
  if (!ready) return null;
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
