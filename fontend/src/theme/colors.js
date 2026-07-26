/**
 * colors.js — Theme Tokens cho Light Mode Minimalism (Zenly Clean Style)
 * Sử dụng: import { COLORS } from '../theme/colors';
 */

export const COLORS = {
  // === Nền ===
  background: '#F8F9FA',         // Nền chính (xám sáng nhẹ Minimalist)
  surface: '#FFFFFF',            // Nền card / modal / container (trắng thuần)
  surfaceLight: '#F1F3F5',       // Nền xám nhạt cho phân tầng
  inputBackground: '#F1F3F5',    // Nền input field

  // === Chữ ===
  textPrimary: '#1E293B',        // Chữ chính (Dark Slate)
  textSecondary: '#64748B',      // Chữ phụ (Slate Grey)
  textMuted: '#94A3B8',          // Chữ mờ / placeholder

  // === Nhấn mạnh (Accent - Zenly Clean Style) ===
  primary: '#4F46E5',            // Tím Indigo cao cấp - nút bấm, highlight chính
  primaryLight: '#6366F1',       // Tím Indigo sáng
  primaryDark: '#4338CA',        // Tím Indigo đậm
  accentPink: '#EC4899',         // Electric Pink (hồng neon Zenly)
  gradient1: '#4F46E5',          // Gradient bắt đầu (Indigo)
  gradient2: '#EC4899',          // Gradient kết thúc (Electric Pink)

  // === Trạng thái ===
  success: '#10B981',            // Thành công (xanh ngọc Emerald)
  error: '#EF4444',              // Lỗi (đỏ hồng)
  warning: '#F59E0B',            // Cảnh báo (vàng hổ phách)

  // === Viền & Phân cách ===
  border: '#E2E8F0',             // Viền input, card sáng
  borderFocus: '#4F46E5',        // Viền khi focus
  divider: '#F1F3F5',            // Đường phân cách

  // === Đặc biệt ===
  overlay: 'rgba(15, 23, 42, 0.4)', // Overlay mờ tối nhẹ
  overlayLight: 'rgba(255, 255, 255, 0.88)', // Overlay mờ đục xám trắng
  shadow: 'rgba(0, 0, 0, 0.08)',   // Bóng mờ êm dịu (Soft Shadow)
  tabBarBg: 'rgba(255, 255, 255, 0.92)', // Glassmorphism Tab bar
  white: '#FFFFFF',
  black: '#000000',
};
