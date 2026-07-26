/**
 * AvatarPicker.js - Component chọn ảnh đại diện
 * Vòng tròn lớn ở giữa, bấm vào để chọn ảnh (placeholder)
 *
 * Props:
 * @param {string|null} imageUri - URI ảnh đã chọn
 * @param {function} onPickImage - Hàm gọi khi bấm chọn ảnh
 * @param {number} size - Kích thước avatar (default: 120)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SIZES } from '../../theme';

const AvatarPicker = ({
  imageUri = null,
  onPickImage = () => {},
  size = SIZES.avatarLarge,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPickImage}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.avatarCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {imageUri ? (
          // Hiển thị ảnh đã chọn
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.avatarImage,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
            resizeMode="cover"
          />
        ) : (
          // Placeholder khi chưa chọn ảnh
          <View style={styles.placeholderContainer}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.placeholderText}>Tải ảnh lên</Text>
          </View>
        )}

        {/* Badge camera nhỏ ở góc */}
        <View style={styles.cameraBadge}>
          <Text style={styles.cameraBadgeIcon}>✏️</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: SPACING.xxl,
  },
  avatarCircle: {
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    // Shadow nhẹ
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarImage: {
    // Được set dynamic qua prop
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  placeholderText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.background,
    // Shadow cho badge
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraBadgeIcon: {
    fontSize: 14,
  },
});

export default AvatarPicker;
