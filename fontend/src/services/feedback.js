/**
 * feedback.js — SCRUM-48: Haptic Feedback & Sound Effects
 *
 * Tích hợp rung (Haptic Feedback) và hiệu ứng âm thanh (Sound Effect)
 * khi hứng được sự kiện Match_Success thành công hoặc lắc ghép đôi.
 *
 * Thiết kế phòng thủ (Defensive): Nếu thư viện hoặc phần cứng thiết bị không hỗ trợ,
 * ứng dụng sẽ tự động fallback mà KHÔNG BỊ CRASH.
 */

import { Platform } from 'react-native';

/**
 * Triggers Haptic Feedback mừng chiến thắng / match thành công
 */
export const triggerMatchHaptics = async () => {
  try {
    // Thử load expo-haptics động nếu khả dụng
    const Haptics = require('expo-haptics');
    if (Haptics && Haptics.notificationAsync) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      return;
    }
  } catch (error) {
    // Nếu chưa cài expo-haptics hoặc thiết bị không hỗ trợ → rung nhẹ qua Vibration API của React Native
    try {
      const { Vibration } = require('react-native');
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 100, 50, 100, 50, 200]);
      } else {
        Vibration.vibrate();
      }
    } catch (e) {
      console.log('[Feedback] Haptic unavailable:', e);
    }
  }
};

/**
 * Trigger âm thanh mừng ghép đôi thành công (Match Success Sound)
 */
export const triggerMatchSound = async () => {
  try {
    const { Audio } = require('expo-av');
    if (Audio && Audio.Sound) {
      // Load & Play victory sound
      const { sound } = await Audio.Sound.createAsync(
        // URL âm thanh thông báo ngắn công khai (Tada / Victory chime)
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3' },
        { shouldPlay: true, volume: 0.8 }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    }
  } catch (error) {
    console.log('[Feedback] Sound effect played with fallback:', error);
  }
};
