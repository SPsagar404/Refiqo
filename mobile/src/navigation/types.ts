import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  BasicInfo: undefined;
  ExperienceSkills: undefined;
  ResumePortfolio: undefined;
  Preferences: undefined;
  Availability: undefined;
  ProfileCreated: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Fab: undefined;
  Requests: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  ReferrerProfile: { id: string };
  SendReferral: { referrerId: string; referrerName: string };
  RequestDetail: { id: string };
  Chat: { conversationId: string; title: string };
  Notifications: undefined;
  Saved: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};
