/**
 * CameraScreen.js — SCRUM-49 & SCRUM-54: [Tính năng Locket] Dựng UI Camera & Upload CDN
 *
 * Luồng hoạt động:
 *  1. Khi ghép đôi (Bump) thành công -> Tự động chuyển tới màn hình Camera.
 *  2. Cho phép chụp vội 1 khoảnh khắc kỷ niệm (dùng expo-camera hoặc simulator photo picker fallback).
 *  3. Preview ảnh vừa chụp.
 *  4. Upload lên Object Storage (Backend POST /api/upload) -> Nhận CDN Public URL.
 *  5. Gửi sang cho đối phương (hoặc quay về trang chủ).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../theme';
import { uploadImageAPI } from '../services/api';

const CameraScreen = ({ route, navigation }) => {
  const matchedUser = route.params?.matchedUser || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState('front');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Chụp ảnh
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        setCapturedPhoto(photo);
      } catch (err) {
        console.log('Chụp ảnh lỗi:', err);
        Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      }
    } else {
      // Fallback Simulator demo photo nếu không có phần cứng camera
      setCapturedPhoto({
        uri: 'https://picsum.photos/600/800',
        base64: null,
      });
    }
  };

  // Upload và gửi ảnh Locket
  const handleUploadAndSend = async () => {
    if (!capturedPhoto) return;

    setUploading(true);
    try {
      let res;
      if (capturedPhoto.base64) {
        res = await uploadImageAPI(capturedPhoto.base64);
      } else {
        res = await uploadImageAPI(capturedPhoto.uri);
      }

      const cdnUrl = res.image_url;

      Alert.alert(
        '🎉 Locket đã gửi!',
        `Ảnh kỷ niệm đã được upload lên CDN: ${cdnUrl}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('MainTabs', { screen: 'Home' });
            },
          },
        ]
      );
    } catch (err) {
      console.log('Upload error:', err);
      Alert.alert('Lỗi Upload', err.message || 'Không thể upload ảnh lên CDN');
    } finally {
      setUploading(false);
    }
  };

  // Toggle camera trước/sau
  const toggleCameraFacing = () => {
    setCameraType((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>Cần quyền truy cập Camera</Text>
          <Text style={styles.permissionSub}>
            Tính năng Locket cần Camera để chụp vội 1 khoảnh khắc gửi cho bạn bè ngay khi lắc trúng!
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>Cấp quyền ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Bỏ qua</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnIcon}>✕</Text>
        </TouchableOpacity>

        <View style={styles.matchedBadge}>
          <Text style={styles.matchedEmoji}>{matchedUser.avatar_url || '👤'}</Text>
          <Text style={styles.matchedName} numberOfLines={1}>
            Locket cùng {matchedUser.full_name || matchedUser.username || 'Bạn bè'}
          </Text>
        </View>

        <TouchableOpacity style={styles.flipBtn} onPress={toggleCameraFacing}>
          <Text style={styles.flipIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Main Preview / Camera View */}
      <View style={styles.cameraFrameContainer}>
        {capturedPhoto ? (
          <Image source={{ uri: capturedPhoto.uri }} style={styles.previewImage} />
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.cameraView}
            facing={cameraType}
          >
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraInstruction}>
                ⚡ Snap a moment to lock it!
              </Text>
            </View>
          </CameraView>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        {capturedPhoto ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => setCapturedPhoto(null)}
              disabled={uploading}
            >
              <Text style={styles.retakeText}>Chụp lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleUploadAndSend}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Text style={styles.sendBtnText}>Gửi Locket 🚀</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.captureRow}>
            <TouchableOpacity style={styles.captureOuterRing} onPress={takePicture}>
              <View style={styles.captureInnerCircle} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.md,
    paddingBottom: SPACING.md,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnIcon: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  matchedEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  matchedName: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONT_SIZES.xs,
    maxWidth: 160,
  },
  flipBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipIcon: {
    fontSize: 18,
  },

  // Camera preview frame
  cameraFrameContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cameraView: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cameraInstruction: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Bottom controls
  bottomBar: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  captureRow: {
    alignItems: 'center',
  },
  captureOuterRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  captureInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: COLORS.white,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.md,
  },
  retakeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
  },
  retakeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONT_SIZES.md,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONT_SIZES.md,
  },

  // Permission UI
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  permissionEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  permissionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  permissionSub: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  grantButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  grantButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONT_SIZES.md,
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZES.sm,
  },
});

export default CameraScreen;
