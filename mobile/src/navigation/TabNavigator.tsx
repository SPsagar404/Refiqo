import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarButtonProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { DiscoveryScreen } from '@/features/discovery/DiscoveryScreen';
import { MyRequestsScreen } from '@/features/referrals/MyRequestsScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { colors, shadow } from '@/theme';
import { AppStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

function EmptyFab() {
  return <View />;
}

/** Center floating action button — jumps to discovery to start a new request. */
function FabButton(_props: BottomTabBarButtonProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  return (
    <View style={styles.fabWrap} pointerEvents="box-none">
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('Tabs', { screen: 'Search' })}
        accessibilityLabel="New referral request"
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, size }) => <Ionicons name="play-circle-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={DiscoveryScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Fab"
        component={EmptyFab}
        options={{ tabBarButton: (props) => <FabButton {...props} />, tabBarLabel: () => null }}
      />
      <Tab.Screen
        name="Requests"
        component={MyRequestsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // floating, rounded, blurred pill (CSS .bottom-nav)
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    height: 70,
    borderRadius: 30,
    backgroundColor: 'rgba(28,33,46,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 10,
    paddingTop: 10,
    ...shadow.card,
  },
  tabLabel: { fontSize: 12, marginBottom: 2 },
  fabWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
});
