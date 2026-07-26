/**
 * AppNavigator.js - Bộ điều hướng chính của ứng dụng
 *
 * Quyết định hiển thị stack nào dựa trên trạng thái xác thực:
 * ┌─────────────────────────────────────────┐
 * │ isLoading = true  → SplashScreen       │
 * │ userToken = null  → AuthStack          │
 * │ userToken != null → AppStack           │
 * └─────────────────────────────────────────┘
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import SplashScreen from '../screens/SplashScreen';

const AppNavigator = () => {
  const { userToken, isLoading } = useAuth();

  // ────────────────────────────────────────
  // TRƯỜNG HỢP 1: Đang kiểm tra token
  // Hiển thị SplashScreen (loading)
  // ────────────────────────────────────────
  if (isLoading) {
    return <SplashScreen />;
  }

  // ────────────────────────────────────────
  // TRƯỜNG HỢP 2 & 3: Đã kiểm tra xong
  // Chuyển stack dựa trên có token hay không
  // ────────────────────────────────────────
  return (
    <NavigationContainer>
      {userToken == null ? (
        // Chưa đăng nhập → hiển thị màn hình Auth
        <AuthStack />
      ) : (
        // Đã đăng nhập → hiển thị app chính
        <AppStack />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
