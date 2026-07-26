/**
 * SplashScreen.js - Màn hình khởi động ứng dụng
 *
 * Tính năng:
 * - Logo/tên app ở giữa màn hình
 * - Vòng loading (ActivityIndicator)
 * - Hiệu ứng fade-in mượt mà khi mới mở
 * - Tự động chuyển sang màn hình tiếp theo sau 3 giây
 *
 * Props:
 * @param {function} onFinish - Callback khi splash hoàn tất (chuyển màn hình)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish = () => {} }) => {
  // === Animation values ===
  const fadeAnim = useRef(new Animated.Value(0)).current;           // Fade toàn màn hình
  const logoScale = useRef(new Animated.Value(0.3)).current;        // Scale logo
  const logoOpacity = useRef(new Animated.Value(0)).current;        // Fade logo
  const subtitleTranslate = useRef(new Animated.Value(20)).current; // Slide subtitle lên
  const subtitleOpacity = useRef(new Animated.Value(0)).current;    // Fade subtitle
  const loadingOpacity = useRef(new Animated.Value(0)).current;     // Fade loading
  const glowAnim = useRef(new Animated.Value(0.3)).current;        // Hiệu ứng phát sáng

  useEffect(() => {
    // Chuỗi animation tuần tự
    Animated.sequence([
      // Bước 1: Fade in toàn màn hình (300ms)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),

      // Bước 2: Logo xuất hiện + scale lên (song song)
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // Bước 3: Subtitle slide lên + fade in (song song)
      Animated.parallel([
        Animated.timing(subtitleTranslate, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // Bước 4: Loading spinner xuất hiện
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Hiệu ứng glow lặp lại (pulsating)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Tự động chuyển màn hình sau 3 giây
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Các vòng trang trí nền (decorative circles) */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      {/* Khu vực logo chính */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Vòng phát sáng phía sau logo */}
        <Animated.View
          style={[
            styles.glowRing,
            { opacity: glowAnim },
          ]}
        />

        {/* Logo icon */}
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>🚀</Text>
        </View>

        {/* Tên ứng dụng */}
        <Text style={styles.appName}>MyApp</Text>
      </Animated.View>

      {/* Subtitle / Slogan */}
      <Animated.View
        style={{
          opacity: subtitleOpacity,
          transform: [{ translateY: subtitleTranslate }],
        }}
      >
        <Text style={styles.slogan}>Kết nối • Chia sẻ • Trải nghiệm</Text>
      </Animated.View>

      {/* Loading spinner */}
      <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </Animated.View>

      {/* Phiên bản ở dưới cùng */}
      <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },

  // === Vòng trang trí nền ===
  decorCircle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
    top: -90,
    right: -90,
  },
  decorCircle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(236, 72, 153, 0.05)',
    bottom: -50,
    left: -70,
  },
  decorCircle3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(79, 70, 229, 0.04)',
    top: height * 0.35,
    left: -40,
  },

  // === Logo ===
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  glowRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    top: -20,
  },
  logoIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5',
    marginBottom: SPACING.xl,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: FONT_SIZES.display,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 3,
  },

  // === Slogan ===
  slogan: {
    fontSize: FONT_SIZES.md,
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: SPACING.massive,
  },

  // === Loading ===
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: '#94A3B8',
    marginTop: SPACING.md,
    letterSpacing: 0.5,
  },

  // === Phiên bản ===
  versionText: {
    position: 'absolute',
    bottom: SPACING.huge,
    fontSize: FONT_SIZES.xs,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
