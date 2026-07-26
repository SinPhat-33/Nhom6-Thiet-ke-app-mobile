/**
 * ProfileSetupScreen.js - Màn hình cập nhật thông tin cá nhân
 *
 * Tính năng:
 * - Chọn ảnh đại diện (avatar tròn lớn ở giữa)
 * - Nhập tên hiển thị
 * - Dán link Facebook
 * - Dán link Zalo
 * - Nút "Lưu Thông Tin" nổi bật ở dưới cùng
 * - Các hàm placeholder để gắn API sau
 *
 * Props:
 * @param {function} onSaveSuccess - Callback khi lưu thành công
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SIZES } from '../theme';
import { CustomInput, CustomButton, AvatarPicker } from '../components/common';
import { updateProfileAPI, upsertSocialLinkAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfileSetupScreen = ({ navigation }) => {
  const { markProfileCompleted } = useAuth();

  // === State ===
  const [avatarUri, setAvatarUri] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [zaloLink, setZaloLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // === Animation ===
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Hiệu ứng xuất hiện khi vào màn hình
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePickAvatar = () => {
    console.log('=== CHỌN ẢNH ĐẠI DIỆN ===');
  };

  /**
   * Xử lý lưu thông tin hồ sơ
   */
  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Cập nhật profile lên backend nếu có điền tên
      if (displayName.trim()) {
        await updateProfileAPI({
          full_name: displayName.trim(),
          avatar_url: avatarUri || '',
          bio: '',
        });
      }

      // Cập nhật social links nếu có
      if (facebookLink.trim()) {
        await upsertSocialLinkAPI('facebook', facebookLink.trim());
      }
      if (zaloLink.trim()) {
        await upsertSocialLinkAPI('zalo', zaloLink.trim());
      }

      // Đánh dấu đã hoàn tất Profile trong Storage
      await markProfileCompleted();
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Xử lý bỏ qua cập nhật profile
   */
  const handleSkip = async () => {
    // Đánh dấu đã hoàn tất Onboarding trong Storage khi bấm Bỏ qua
    await markProfileCompleted();
    navigation.replace('MainTabs');
  };

  // ===================================================================

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Nút bỏ qua */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>

          <Text style={styles.stepIndicator}>Bước 2/2</Text>
          <Text style={styles.title}>Hoàn tất hồ sơ</Text>
          <Text style={styles.subtitle}>
            Thêm thông tin cá nhân để bạn bè dễ dàng nhận ra bạn
          </Text>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Vòng trang trí nền */}
          <View style={styles.decorCircle1} />

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Avatar Picker */}
            <AvatarPicker
              imageUri={avatarUri}
              onPickImage={handlePickAvatar}
              size={SIZES.avatarLarge}
            />

            {/* Gợi ý dưới avatar */}
            <Text style={styles.avatarHint}>
              Nhấn vào để tải ảnh đại diện
            </Text>

            {/* Phân cách */}
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Input tên hiển thị */}
            <CustomInput
              label="Tên hiển thị"
              placeholder="Nhập tên bạn muốn hiển thị"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              iconName="✨"
            />

            {/* Phân cách */}
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.sectionTitle}>Liên kết mạng xã hội</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Input link Facebook */}
            <CustomInput
              label="Link Facebook"
              placeholder="https://facebook.com/username"
              value={facebookLink}
              onChangeText={setFacebookLink}
              keyboardType="url"
              iconName="📘"
            />

            {/* Input link Zalo */}
            <CustomInput
              label="Link Zalo"
              placeholder="https://zalo.me/phone-number"
              value={zaloLink}
              onChangeText={setZaloLink}
              keyboardType="url"
              iconName="🔵"
            />

            {/* Ghi chú */}
            <View style={styles.noteContainer}>
              <Text style={styles.noteIcon}>💡</Text>
              <Text style={styles.noteText}>
                Thông tin mạng xã hội là tùy chọn. Bạn có thể cập nhật sau trong phần Cài đặt.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Nút Lưu Thông Tin - cố định ở dưới cùng */}
        <Animated.View
          style={[
            styles.bottomButtonContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <CustomButton
            title="✅  Lưu Thông Tin"
            onPress={handleSaveProfile}
            loading={isLoading}
            size="large"
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  flex: {
    flex: 1,
  },

  // === Trang trí nền ===
  decorCircle1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    top: -60,
    left: -80,
  },

  // === Header ===
  header: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  skipText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: '#94A3B8',
  },
  stepIndicator: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: SPACING.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: '#64748B',
    lineHeight: 22,
  },

  // === Scroll content ===
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },

  // === Avatar hint ===
  avatarHint: {
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    color: '#94A3B8',
    marginTop: -SPACING.lg,
    marginBottom: SPACING.xxl,
  },

  // === Phân cách section ===
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#94A3B8',
    marginHorizontal: SPACING.md,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // === Ghi chú ===
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  noteIcon: {
    fontSize: 16,
    marginRight: SPACING.md,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: '#64748B',
    lineHeight: 18,
  },

  // === Nút cố định dưới cùng ===
  bottomButtonContainer: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ProfileSetupScreen;
