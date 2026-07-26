/**
 * AuthStack.js - Stack điều hướng cho luồng xác thực
 *
 * Chứa các màn hình:
 * - AuthScreen (Đăng nhập / Đăng ký)
 *
 * Chỉ hiển thị khi userToken == null (chưa đăng nhập)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/AuthScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Ẩn header mặc định
        animation: 'fade',  // Hiệu ứng chuyển màn hình
      }}
    >
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
