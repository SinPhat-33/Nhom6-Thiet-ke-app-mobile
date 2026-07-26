/**
 * AuthContext.js - Quản lý trạng thái xác thực toàn cục
 *
 * Cung cấp:
 * - userToken: JWT token (null = chưa đăng nhập)
 * - isLoading: Đang kiểm tra token từ storage
 * - login(): Đăng nhập và lưu token
 * - register(): Đăng ký tài khoản mới
 * - logout(): Đăng xuất và xóa token
 *
 * Sử dụng:
 * - Wrap App với <AuthProvider>
 * - Trong component con: const { login, logout, ... } = useAuth();
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { loginAPI, registerAPI, getProfileAPI, getToken, removeToken } from '../services/api';

// ====================================================================
// TẠO CONTEXT
// ====================================================================

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong <AuthProvider>');
  }
  return context;
};

// ====================================================================
// PROVIDER
// ====================================================================

export const AuthProvider = ({ children }) => {
  // === State ===
  const [userToken, setUserToken] = useState(null);               // JWT token
  const [isProfileCompleted, setIsProfileCompleted] = useState(false); // Đã điền Profile/Onboarding
  const [isLoading, setIsLoading] = useState(true);                // Đang kiểm tra token khi khởi động

  // ================================================================
  // BƯỚC 1: Kiểm tra token & profile status khi app khởi động
  // ================================================================

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await getToken();

      if (token) {
        setUserToken(token);

        // Kiểm tra flag onboarding đã lưu trong storage
        const savedStatus = await SecureStore.getItemAsync('is_profile_completed');
        if (savedStatus === 'true') {
          setIsProfileCompleted(true);
        } else {
          // Thử gọi API profile kiểm tra nếu user đã có full_name trong DB
          try {
            const data = await getProfileAPI();
            if (data && data.profile && data.profile.full_name) {
              setIsProfileCompleted(true);
              await SecureStore.setItemAsync('is_profile_completed', 'true');
            } else {
              setIsProfileCompleted(false);
            }
          } catch (e) {
            setIsProfileCompleted(false);
          }
        }
      } else {
        setUserToken(null);
        setIsProfileCompleted(false);
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra token:', error);
      setUserToken(null);
      setIsProfileCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đánh dấu user đã hoàn tất Profile (Lưu thông tin hoặc Bỏ qua)
   */
  const markProfileCompleted = async () => {
    setIsProfileCompleted(true);
    try {
      await SecureStore.setItemAsync('is_profile_completed', 'true');
    } catch (e) {}
  };

  // ================================================================
  // BƯỚC 2: Hàm đăng nhập
  // ================================================================

  /**
   * Đăng nhập bằng username + password
   * Gọi API POST /api/login → lưu token → cập nhật state
   *
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {boolean} true nếu thành công
   */
  const login = async (username, password) => {
    // Validate input trước khi gọi API
    if (!username.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên đăng nhập!');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu!');
      return false;
    }

    try {
      // Gọi API đăng nhập
      const data = await loginAPI(username.trim(), password);

      // API thành công → token đã được lưu vào SecureStore bên trong loginAPI
      // Cập nhật state để chuyển sang AppStack
      setUserToken(data.token);

      return true;
    } catch (error) {
      // Xử lý lỗi theo HTTP status
      if (error.status === 401) {
        // Sai mật khẩu hoặc tên đăng nhập
        Alert.alert(
          'Đăng nhập thất bại',
          'Sai tên đăng nhập hoặc mật khẩu. Vui lòng thử lại.',
        );
      } else if (error.status === 0) {
        // Lỗi mạng
        Alert.alert(
          'Lỗi kết nối',
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
        );
      } else {
        // Lỗi khác
        Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }

      return false;
    }
  };

  // ================================================================
  // BƯỚC 3: Hàm đăng ký
  // ================================================================

  /**
   * Đăng ký tài khoản mới
   * Gọi API POST /api/register → sau đó tự động đăng nhập
   *
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @param {string} confirmPassword - Xác nhận mật khẩu
   * @returns {boolean} true nếu thành công
   */
  const register = async (username, password, confirmPassword) => {
    // === Validate input ===
    if (!username.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên đăng nhập!');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu!');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự!');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp!');
      return false;
    }

    try {
      // Bước 1: Gọi API đăng ký
      await registerAPI(username.trim(), password);

      // Bước 2: Đăng ký thành công → tự động đăng nhập luôn
      const loginResult = await login(username.trim(), password);

      return loginResult;
    } catch (error) {
      // Xử lý lỗi
      if (error.status === 409) {
        // Tên đăng nhập đã tồn tại
        Alert.alert(
          'Đăng ký thất bại',
          'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.',
        );
      } else if (error.status === 0) {
        // Lỗi mạng
        Alert.alert(
          'Lỗi kết nối',
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
        );
      } else {
        Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi khi đăng ký.');
      }

      return false;
    }
  };

  // ================================================================
  // BƯỚC 4: Hàm đăng xuất
  // ================================================================

  /**
   * Đăng xuất: Xóa token khỏi SecureStore + reset state
   * → Tự động chuyển về AuthStack (do userToken = null)
   */
  const logout = async () => {
    try {
      await removeToken();
      await SecureStore.deleteItemAsync('is_profile_completed');
      setUserToken(null);
      setIsProfileCompleted(false);
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      setUserToken(null);
      setIsProfileCompleted(false);
    }
  };

  // ================================================================
  // CUNG CẤP GIÁ TRỊ CHO CONTEXT
  // ================================================================

  const authContextValue = useMemo(
    () => ({
      userToken,
      isProfileCompleted,
      isLoading,
      login,
      register,
      logout,
      markProfileCompleted,
    }),
    [userToken, isProfileCompleted, isLoading],
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
