/**
 * typography.js - Hệ thống typography cho ứng dụng
 * Định nghĩa kích thước chữ, font weight chuẩn
 */

import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 34,
  display: 42,
};

export const FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

export const TYPOGRAPHY = StyleSheet.create({
  // Tiêu đề lớn (tên app, tiêu đề trang)
  displayTitle: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },

  // Tiêu đề màn hình
  screenTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  // Tiêu đề phụ
  subtitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },

  // Nội dung chính
  body: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },

  // Chữ nhỏ (ghi chú, caption)
  caption: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textMuted,
  },

  // Nhãn nút bấm
  buttonLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // Nhãn input
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },

  // Text liên kết
  linkText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primary,
  },
});
