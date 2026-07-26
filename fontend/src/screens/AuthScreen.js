import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../theme';
import { CustomInput, CustomButton } from '../components/common';
import { useAuth } from '../context/AuthContext';

const AuthScreen = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // States — Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // States — Register
  // registerName = tên hiển thị (full name), có thể cập nhật sau trong Profile
  // registerUsername = tên đăng nhập (username) — là thứ backend cần
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      // Truyền username (registerUsername) vào hàm register, không phải email
      await register(registerUsername, registerPassword, registerConfirmPassword);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Trang trí nền */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.header}>
          <Text style={styles.welcomeText}>Xin chào! 👋</Text>
          <Text style={styles.subtitle}>
            {isLoginMode ? 'Đăng nhập để tiếp tục sử dụng ứng dụng' : 'Tạo tài khoản mới để bắt đầu'}
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, isLoginMode && styles.tabActive]}
            onPress={() => setIsLoginMode(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, isLoginMode && styles.tabTextActive]}>Đăng Nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, !isLoginMode && styles.tabActive]}
            onPress={() => setIsLoginMode(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, !isLoginMode && styles.tabTextActive]}>Đăng Ký</Text>
          </TouchableOpacity>
        </View>

        {isLoginMode ? (
          <View style={styles.formContainer}>
            <CustomInput
              id="loginEmail"
              label="Số điện thoại / Email"
              placeholder="Nhập SĐT hoặc email của bạn"
              value={loginEmail}
              onChangeText={setLoginEmail}
              keyboardType="email-address"
              iconName="📧"
            />
            <CustomInput
              id="loginPassword"
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry={true}
              iconName="🔒"
            />
            
            <TouchableOpacity style={styles.forgotPasswordButton}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <View style={styles.buttonWrapper}>
              <CustomButton title="Đăng Nhập" onPress={handleLogin} loading={isLoading} />
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <CustomInput
              id="regName"
              label="Họ và tên (hiển thị)"
              placeholder="Nhập họ và tên đầy đủ"
              value={registerName}
              onChangeText={setRegisterName}
              autoCapitalize="words"
              iconName="👤"
            />
            <CustomInput
              id="regUsername"
              label="Tên đăng nhập (username)"
              placeholder="Chọn tên đăng nhập duy nhất"
              value={registerUsername}
              onChangeText={setRegisterUsername}
              autoCapitalize="none"
              iconName="🆔"
            />
            <CustomInput
              id="regPassword"
              label="Mật khẩu"
              placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
              value={registerPassword}
              onChangeText={setRegisterPassword}
              secureTextEntry={true}
              iconName="🔒"
            />
            <CustomInput
              id="regConfirm"
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={registerConfirmPassword}
              onChangeText={setRegisterConfirmPassword}
              secureTextEntry={true}
              iconName="🔐"
            />
            <View style={styles.buttonWrapper}>
              <CustomButton title="Đăng Ký" onPress={handleRegister} loading={isLoading} />
            </View>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 100,
    paddingBottom: 40,
  },
  decorCircle1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(79, 70, 229, 0.06)', top: -80, right: -90,
  },
  decorCircle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(236, 72, 153, 0.05)', bottom: 100, left: -70,
  },
  header: {
    marginBottom: SPACING.xxl,
  },
  welcomeText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: SPACING.xxl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  formContainer: {
    marginBottom: SPACING.xl,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xl,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonWrapper: {
    marginTop: 8,
  },
});

export default AuthScreen;
