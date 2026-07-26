/**
 * AppStack.js - Stack điều hướng cho app chính (sau đăng nhập)
 *
 * Chứa các màn hình:
 * - ProfileSetup: Cập nhật hồ sơ (lần đầu sau đăng ký)
 * - MainTabs: Bottom Tab Navigator (Home, Friends, Profile)
 *
 * Chỉ hiển thị khi userToken != null (đã đăng nhập)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import BumpHistoryScreen from '../screens/BumpHistoryScreen';
import CameraScreen from '../screens/CameraScreen';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZES } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ====================================================================
// BOTTOM TAB NAVIGATOR - Điều hướng tab dưới cùng
// ====================================================================

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        // Icon placeholder bằng emoji
        tabBarIcon: ({ focused, color }) => {
          let icon = '🏠';
          if (route.name === 'Home') icon = '🏠';
          if (route.name === 'Messages') icon = '💬';
          if (route.name === 'Friends') icon = '👥';
          if (route.name === 'Profile') icon = '👤';

          return (
            <Text style={{ fontSize: focused ? 24 : 20 }}>
              {icon}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Trang chủ' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarLabel: 'Tin nhắn' }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ tabBarLabel: 'Bạn bè' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
};

// ====================================================================
// APP STACK - Stack chính sau đăng nhập
// ====================================================================

const AppStack = () => {
  const { isProfileCompleted } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={isProfileCompleted ? 'MainTabs' : 'ProfileSetup'}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {/* Màn hình chính với Bottom Tabs */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
      />

      {/* Màn hình cập nhật hồ sơ (chỉ hiển thị khi chưa xong Profile) */}
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
      />

      {/* Màn hình Chat (ẩn bottom tab) */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ animation: 'slide_from_right' }}
      />

      {/* Màn hình Lịch sử Bump (SCRUM-47) */}
      <Stack.Screen
        name="BumpHistory"
        component={BumpHistoryScreen}
        options={{ animation: 'slide_from_bottom' }}
      />

      {/* Màn hình Camera Locket (SCRUM-49) */}
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 30,
    height: 66,
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  tabLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
});

export default AppStack;
