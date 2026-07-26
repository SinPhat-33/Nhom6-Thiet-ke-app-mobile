/**
 * useLocation.js — SCRUM-37: Cấp quyền Location & GPS Logic
 *
 * Hook này tách biệt toàn bộ GPS logic ra khỏi HomeScreen
 * để tái sử dụng và dễ test.
 *
 * Cung cấp:
 *  - location         : Đối tượng location từ expo-location (coords.latitude/longitude)
 *  - errorMsg         : Thông báo lỗi nếu không lấy được vị trí
 *  - permissionStatus : Trạng thái quyền ('granted' | 'denied' | 'undetermined')
 *  - requestPermission: Hàm xin quyền thủ công (dùng khi bị từ chối lần đầu)
 *  - refreshLocation  : Cập nhật vị trí theo yêu cầu
 *
 * @param {boolean} autoStart - Tự động xin quyền và lấy GPS khi mount (default: true)
 * @param {number}  watchIntervalMs - Tần suất cập nhật GPS liên tục (ms, 0 = tắt watch)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';

// ────────────────────────────────────────────────────────────
// Hằng số cấu hình
// ────────────────────────────────────────────────────────────

/** Độ chính xác GPS cao (Best for Navigation) */
const GPS_ACCURACY = Location.Accuracy.High;

/** Độ chính xác tối thiểu chấp nhận (mét) */
const MIN_ACCURACY_METERS = 50;

const useLocation = (autoStart = true, watchIntervalMs = 0) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [isLoading, setIsLoading] = useState(false);

  const watchSubscriptionRef = useRef(null);

  // ──────────────────────────────────────────────
  // Xin quyền truy cập Location
  // ──────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (error) {
      console.error('[useLocation] Lỗi xin quyền location:', error);
      setErrorMsg('Không thể xin quyền truy cập vị trí');
      return false;
    }
  }, []);

  // ──────────────────────────────────────────────
  // Lấy vị trí 1 lần
  // ──────────────────────────────────────────────
  const refreshLocation = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Kiểm tra quyền hiện tại trước
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setErrorMsg('Ứng dụng chưa được cấp quyền truy cập vị trí');
          setIsLoading(false);
          return null;
        }
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: GPS_ACCURACY,
      });

      setLocation(loc);
      return loc;
    } catch (error) {
      console.error('[useLocation] Lỗi lấy GPS:', error);
      setErrorMsg('Không thể lấy vị trí GPS. Vui lòng bật GPS và thử lại.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [requestPermission]);

  // ──────────────────────────────────────────────
  // Theo dõi vị trí liên tục (nếu watchIntervalMs > 0)
  // ──────────────────────────────────────────────
  const startWatch = useCallback(async () => {
    if (watchIntervalMs <= 0) return;

    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return;

    // Hủy subscription cũ nếu có
    if (watchSubscriptionRef.current) {
      watchSubscriptionRef.current.remove();
    }

    watchSubscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: GPS_ACCURACY,
        timeInterval: watchIntervalMs,
        distanceInterval: 10, // Cập nhật khi di chuyển >= 10m
      },
      (newLocation) => {
        setLocation(newLocation);
      }
    );
  }, [watchIntervalMs]);

  // ──────────────────────────────────────────────
  // Auto-start khi mount
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!autoStart) return;

    (async () => {
      // Kiểm tra quyền
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === 'granted') {
        setPermissionStatus('granted');
        await refreshLocation();
        await startWatch();
      } else if (status === 'undetermined') {
        // Lần đầu dùng app → xin quyền
        const granted = await requestPermission();
        if (granted) {
          await refreshLocation();
          await startWatch();
        }
      } else {
        // Đã bị từ chối → không tự xin lại, báo lỗi
        setPermissionStatus('denied');
        setErrorMsg(
          'Quyền truy cập vị trí bị từ chối. Vui lòng bật trong Cài đặt điện thoại.'
        );
      }
    })();

    // Cleanup: dừng watch khi unmount
    return () => {
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
    };
  }, [autoStart]); // chỉ chạy 1 lần khi mount

  return {
    location,
    errorMsg,
    permissionStatus,
    isLoading,
    requestPermission,
    refreshLocation,
  };
};

export default useLocation;
