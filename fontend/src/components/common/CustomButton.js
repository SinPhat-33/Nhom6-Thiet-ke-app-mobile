/**
 * CustomButton.js - Component nút bấm tái sử dụng
 * Nút với gradient (giả lập), hiệu ứng nhấn, loading state
 *
 * Props:
 * @param {string} title - Text hiển thị trên nút
 * @param {function} onPress - Hàm xử lý khi bấm
 * @param {boolean} loading - Hiển thị loading spinner
 * @param {boolean} disabled - Vô hiệu hóa nút
 * @param {string} variant - Loại nút: 'primary' | 'outline' | 'ghost'
 * @param {string} size - Kích thước: 'large' | 'medium' | 'small'
 * @param {object} style - Style bổ sung
 */

import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SIZES, FONT_SIZES, FONT_WEIGHTS } from '../../theme';

const CustomButton = ({
  title = 'Nút bấm',
  onPress = () => {},
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'large',
  style = {},
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Hiệu ứng nhấn nút (scale down nhẹ)
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  // Xác định style theo variant
  const getButtonStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineButton;
      case 'ghost':
        return styles.ghostButton;
      case 'primary':
      default:
        return styles.primaryButton;
    }
  };

  // Xác định style text theo variant
  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'ghost':
        return styles.ghostText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  // Xác định chiều cao theo size
  const getHeightStyle = () => {
    switch (size) {
      case 'small':
        return { height: SIZES.buttonSmallHeight };
      case 'medium':
        return { height: 46 };
      case 'large':
      default:
        return { height: SIZES.buttonHeight };
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.baseButton,
          getButtonStyle(),
          getHeightStyle(),
          disabled && styles.disabledButton,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? COLORS.white : COLORS.primary}
            size="small"
          />
        ) : (
          <Text
            style={[
              styles.baseText,
              getTextStyle(),
              size === 'small' && { fontSize: FONT_SIZES.sm },
              disabled && styles.disabledText,
            ]}
          >
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },

  // === Variant: Primary (Indigo) ===
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  primaryText: {
    color: '#FFFFFF',
  },

  // === Variant: Outline ===
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    shadowOpacity: 0,
    elevation: 0,
  },
  outlineText: {
    color: '#4F46E5',
  },

  // === Variant: Ghost ===
  ghostButton: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  ghostText: {
    color: '#4F46E5',
  },

  // === Disabled ===
  disabledButton: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: '#94A3B8',
  },

  // === Base Text ===
  baseText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default CustomButton;
