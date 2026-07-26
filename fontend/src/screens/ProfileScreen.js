import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { CustomButton } from '../components/common';
import { getProfileAPI, updateProfileAPI, upsertSocialLinkAPI } from '../services/api';

// ====================================================================
// EMOJI AVATAR PICKER
// ====================================================================
const EMOJI_LIST = [
  '😎', '🧑', '👩', '👨', '🦊', '🐱', '🐶', '🦄',
  '🌸', '🎮', '👨‍💻', '👩‍💻', '🎭', '🎨', '🏀', '⚽',
  '🎵', '🎤', '📷', '✈️', '🌟', '💎', '🔥', '🚀',
];

const ProfileScreen = ({ navigation }) => {
  const { logout } = useAuth();

  // === State ===
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Data từ backend
  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: '',
    bio: '',
  });
  const [socialLinks, setSocialLinks] = useState([]);

  // Edit form
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editZalo, setEditZalo] = useState('');

  // Emoji picker modal
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ── Load profile từ backend ──
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfileAPI();
      const p = data.profile || {};
      const s = data.social_links || [];

      setProfile(p);
      setSocialLinks(s);

      // Pre-fill edit form
      setEditName(p.full_name || '');
      setEditBio(p.bio || '');
      setEditAvatar(p.avatar_url || '');

      // Tìm link facebook & zalo từ social_links
      const fb = s.find(l => l.platform === 'facebook');
      const zl = s.find(l => l.platform === 'zalo');
      setEditFacebook(fb ? fb.link_url : '');
      setEditZalo(zl ? zl.link_url : '');
    } catch (err) {
      console.log('Load profile error:', err);
      // Nếu lỗi 404 (chưa có profile) thì không sao, cho user tạo mới
    } finally {
      setLoading(false);
    }
  };

  // ── Lưu profile ──
  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên hiển thị');
      return;
    }

    setSaving(true);
    try {
      // Cập nhật profile
      await updateProfileAPI({
        full_name: editName.trim(),
        avatar_url: editAvatar,
        bio: editBio.trim(),
      });

      // Cập nhật social links
      if (editFacebook.trim()) {
        await upsertSocialLinkAPI('facebook', editFacebook.trim());
      }
      if (editZalo.trim()) {
        await upsertSocialLinkAPI('zalo', editZalo.trim());
      }

      Alert.alert('✅ Thành công', 'Đã cập nhật hồ sơ');
      setIsEditing(false);
      loadProfile(); // Reload lại data mới
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  // ── Chọn emoji avatar ──
  const handleSelectEmoji = (emoji) => {
    setEditAvatar(emoji);
    setShowEmojiPicker(false);
  };

  // ── Đăng xuất ──
  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  // ── Tìm social link ──
  const getFacebookLink = () => {
    const fb = socialLinks.find(l => l.platform === 'facebook');
    return fb ? fb.link_url : '';
  };
  const getZaloLink = () => {
    const zl = socialLinks.find(l => l.platform === 'zalo');
    return zl ? zl.link_url : '';
  };

  // Hiển thị avatar (emoji hoặc default)
  const displayAvatar = profile.avatar_url || '👤';

  // ====================================================================
  // RENDER — CHẾ ĐỘ XEM
  // ====================================================================
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ====================================================================
  // RENDER — CHẾ ĐỘ CHỈNH SỬA
  // ====================================================================
  if (isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header chỉnh sửa */}
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.editHeaderTitle}>Chỉnh sửa hồ sơ</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>
                {saving ? '...' : 'Lưu'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar chọn emoji */}
            <TouchableOpacity
              style={styles.editAvatarContainer}
              onPress={() => setShowEmojiPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.editAvatarCircle}>
                <Text style={styles.editAvatarEmoji}>{editAvatar || '👤'}</Text>
              </View>
              <View style={styles.editAvatarBadge}>
                <Text style={styles.editAvatarBadgeIcon}>✏️</Text>
              </View>
              <Text style={styles.editAvatarHint}>Nhấn để đổi avatar</Text>
            </TouchableOpacity>

            {/* Tên hiển thị */}
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Tên hiển thị</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nhập tên của bạn"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Bio */}
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Giới thiệu</Text>
              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Viết vài dòng về bản thân..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Social Links */}
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>📘 Link Facebook</Text>
              <TextInput
                style={styles.editInput}
                value={editFacebook}
                onChangeText={setEditFacebook}
                placeholder="https://facebook.com/username"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>🔵 Link Zalo</Text>
              <TextInput
                style={styles.editInput}
                value={editZalo}
                onChangeText={setEditZalo}
                placeholder="https://zalo.me/phone-number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── EMOJI PICKER MODAL ── */}
        <Modal
          visible={showEmojiPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEmojiPicker(false)}
        >
          <TouchableOpacity
            style={styles.emojiOverlay}
            activeOpacity={1}
            onPress={() => setShowEmojiPicker(false)}
          >
            <View style={styles.emojiPickerContainer}>
              <Text style={styles.emojiPickerTitle}>Chọn Avatar</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_LIST.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.emojiItem,
                      editAvatar === emoji && styles.emojiItemActive,
                    ]}
                    onPress={() => handleSelectEmoji(emoji)}
                  >
                    <Text style={styles.emojiItemText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  // ====================================================================
  // RENDER — CHẾ ĐỘ XEM (MẶC ĐỊNH)
  // ====================================================================
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header (Avatar & Name) */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{displayAvatar}</Text>
          </View>
          <Text style={styles.nameText}>
            {profile.full_name || 'Chưa đặt tên'}
          </Text>
          <Text style={styles.bioText}>
            {profile.bio || 'Chưa có giới thiệu'}
          </Text>
        </View>

        {/* Nút chỉnh sửa hồ sơ */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => setIsEditing(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileIcon}>✏️</Text>
          <Text style={styles.editProfileText}>Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>

        {/* Thông tin Mạng xã hội */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MẠNG XÃ HỘI</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>📘</Text>
                <Text style={styles.rowText}>Facebook</Text>
              </View>
              <Text style={styles.rowValue} numberOfLines={1}>
                {getFacebookLink() || 'Chưa liên kết'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>🔵</Text>
                <Text style={styles.rowText}>Zalo</Text>
              </View>
              <Text style={styles.rowValue} numberOfLines={1}>
                {getZaloLink() || 'Chưa liên kết'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cài đặt chung */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TÍNH NĂNG & CÀI ĐẶT</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.row}
              onPress={() => navigation.navigate('BumpHistory')}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>📳</Text>
                <Text style={styles.rowText}>Lịch sử Bump (Va chạm)</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.row}
              onPress={() => setIsEditing(true)}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>✏️</Text>
                <Text style={styles.rowText}>Cập nhật thông tin</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>🔒</Text>
                <Text style={styles.rowText}>Đổi mật khẩu</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nút đăng xuất */}
        <View style={styles.logoutWrapper}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Đăng Xuất</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? SPACING.lg : SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.primary,
    // Glow effect
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarEmoji: {
    fontSize: 50,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  bioText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.xl,
  },

  // Edit profile button
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginBottom: SPACING.xxl,
  },
  editProfileIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  editProfileText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },

  // Sections
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
    width: 24,
    textAlign: 'center',
  },
  rowText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  rowValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    maxWidth: '50%',
  },
  arrow: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 54,
  },

  // Logout
  logoutWrapper: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xxxl,
  },

  // ====================================================================
  // EDIT MODE STYLES
  // ====================================================================
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? SPACING.md : SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  editHeaderTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cancelText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  saveText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Edit Avatar
  editAvatarContainer: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  editAvatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  editAvatarEmoji: {
    fontSize: 50,
  },
  editAvatarBadge: {
    position: 'absolute',
    top: 70,
    right: '35%',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  editAvatarBadgeIcon: {
    fontSize: 13,
  },
  editAvatarHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },

  // Edit form
  editSection: {
    marginBottom: SPACING.lg,
  },
  editLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  editInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editTextArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },

  // Emoji Picker Modal
  emojiOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  emojiPickerContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  emojiPickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  emojiItem: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
  },
  emojiItemText: {
    fontSize: 28,
  },
});

export default ProfileScreen;
