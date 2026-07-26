/**
 * App.js - Điểm vào chính của ứng dụng
 *
 * Cấu trúc:
 * AuthProvider (quản lý JWT token)
 *   └── AppNavigator (điều hướng theo trạng thái auth)
 *         ├── SplashScreen (isLoading = true)
 *         ├── AuthStack (userToken = null)
 *         └── AppStack (userToken != null)
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <AppNavigator />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

