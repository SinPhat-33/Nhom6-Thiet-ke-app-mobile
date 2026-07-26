/**
 * useShakeDetector.js — SCRUM-36: Đọc dữ liệu Accelerometer & bắt sự kiện Lắc
 *
 * Cách hoạt động:
 *  1. Subscribe vào Accelerometer từ expo-sensors với update interval 100ms
 *  2. Tính magnitude = sqrt(x² + y² + z²) của vector gia tốc
 *  3. Nếu magnitude > SHAKE_THRESHOLD (G-force) → coi là đang lắc
 *  4. Phải duy trì lắc liên tục >= 150ms để confirm (tránh false positive)
 *  5. Sau khi trigger, áp dụng COOLDOWN_MS để tránh fire liên tục
 *
 * Tham số ngưỡng:
 *  - SHAKE_THRESHOLD = 2.5G → Chuẩn cho cử chỉ lắc điện thoại
 *  - SHAKE_DURATION_MS = 150ms → Thời gian lắc tối thiểu để xác nhận
 *  - COOLDOWN_MS = 3000ms → Cooldown sau mỗi lần trigger
 *
 * @param {function} onShake - Callback được gọi khi phát hiện lắc xác nhận
 * @param {boolean} enabled  - Bật/tắt detector (default: true)
 *
 * Ví dụ sử dụng:
 *   useShakeDetector(() => {
 *     console.log('Đã phát hiện lắc!');
 *     callBumpAPI();
 *   });
 */

import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

// ────────────────────────────────────────────────────────────
// Hằng số cấu hình
// ────────────────────────────────────────────────────────────

/** Ngưỡng G-force để phát hiện lắc (2.5 = khá mạnh, 1.8 = nhẹ hơn) */
const SHAKE_THRESHOLD = 2.5;

/** Thời gian lắc tối thiểu (ms) để confirm không phải giật tay nhẹ */
const SHAKE_DURATION_MS = 150;

/** Thời gian chờ giữa 2 lần trigger (ms) để tránh spam */
const COOLDOWN_MS = 3000;

/** Tần suất cập nhật cảm biến (ms) */
const UPDATE_INTERVAL_MS = 100;

// ────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────

const useShakeDetector = (onShake, enabled = true) => {
  const subscriptionRef = useRef(null);

  /** Timestamp lúc bắt đầu phát hiện lắc (để đo duration) */
  const shakeStartRef = useRef(null);

  /** Đang trong cooldown → không trigger lại */
  const cooldownRef = useRef(false);

  /** Stable callback ref để tránh stale closure */
  const onShakeRef = useRef(onShake);
  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  const handleAccelerometerData = useCallback(({ x, y, z }) => {
    // Tính độ lớn vector gia tốc
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    const now = Date.now();

    if (magnitude > SHAKE_THRESHOLD) {
      // Đang lắc — ghi nhận thời điểm bắt đầu nếu chưa có
      if (shakeStartRef.current === null) {
        shakeStartRef.current = now;
      }

      // Kiểm tra đã lắc đủ lâu chưa
      const shakeDuration = now - shakeStartRef.current;
      if (shakeDuration >= SHAKE_DURATION_MS && !cooldownRef.current) {
        // ✅ XÁC NHẬN: Đây là cử chỉ lắc thật sự
        cooldownRef.current = true;
        shakeStartRef.current = null;

        // Gọi callback
        if (onShakeRef.current) {
          onShakeRef.current();
        }

        // Reset cooldown sau COOLDOWN_MS
        setTimeout(() => {
          cooldownRef.current = false;
        }, COOLDOWN_MS);
      }
    } else {
      // Không còn lắc → reset bộ đếm thời gian
      shakeStartRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Tắt → hủy subscription nếu có
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      return;
    }

    // Kiểm tra thiết bị hỗ trợ Accelerometer
    Accelerometer.isAvailableAsync().then((available) => {
      if (!available) {
        console.warn('[useShakeDetector] Accelerometer không khả dụng trên thiết bị này.');
        return;
      }

      // Đặt tần suất cập nhật
      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);

      // Bắt đầu lắng nghe
      subscriptionRef.current = Accelerometer.addListener(handleAccelerometerData);
    });

    // Cleanup: hủy subscription khi component unmount hoặc enabled = false
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [enabled, handleAccelerometerData]);
};

export default useShakeDetector;
