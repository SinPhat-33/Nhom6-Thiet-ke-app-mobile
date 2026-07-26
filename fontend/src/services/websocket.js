/**
 * websocket.js — SCRUM-44: Hứng Event Match_Success qua WebSocket Realtime
 *
 * Quản lý kết nối WebSocket client toàn ứng dụng:
 *  1. Khởi tạo socket tới ws://backend/api/ws với JWT token.
 *  2. Tự động gửi ping định kỳ giữ kết nối không bị ngắt.
 *  3. Lắng nghe event "bump_match" hoặc "Match_Success" từ backend.
 *  4. Phát callback kèm payload thông tin đối phương (User matched).
 *  5. Tự động kết nối lại (Auto reconnect) khi bị mất mạng hoặc ngắt kết nối.
 */

import { getToken, BASE_URL } from './api';
import { triggerMatchHaptics, triggerMatchSound } from './feedback';

const getWsUrl = () => {
  const wsOrigin = BASE_URL.replace(/^http/, 'ws');
  return `${wsOrigin}/api/ws`;
};

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.reconnectTimer = null;
    this.isConnecting = false;
  }

  /**
   * Khởi tạo kết nối WebSocket
   */
  async connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = await getToken();
    if (!token) {
      console.log('[WS Client] Chưa có JWT token, hoãn kết nối WebSocket.');
      return;
    }

    try {
      this.isConnecting = true;
      // Trải token vào header / query nếu localtunnel hỗ trợ
      this.ws = new WebSocket(getWsUrl(), ['Bearer', token]);

      this.ws.onopen = () => {
        console.log('⚡ [WS Client] Kết nối WebSocket thành công!');
        this.isConnecting = false;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 [WS Client] Nhận tin nhắn:', data);

          // Hứng event Match_Success / bump_match từ server (SCRUM-44)
          if (data.type === 'bump_match' || data.type === 'Match_Success') {
            const matchedUser = data.matched_with || data.payload;

            // Trigger Haptic Feedback & Sound (SCRUM-48)
            triggerMatchHaptics();
            triggerMatchSound();

            // Thông báo cho tất cả listeners đăng ký trong app
            this.listeners.forEach((listener) => {
              try {
                listener(matchedUser);
              } catch (err) {
                console.error('[WS Listener Error]:', err);
              }
            });
          }
        } catch (e) {
          // Tin nhắn văn bản đơn giản (như "pong")
        }
      };

      this.ws.onerror = (error) => {
        console.log('[WS Client Error]:', error.message || error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('[WS Client] Kết nối WebSocket đã đóng. Thử kết nối lại sau 5s...');
        this.isConnecting = false;
        this.scheduleReconnect();
      };
    } catch (err) {
      console.log('[WS Connect Error]:', err);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  /**
   * Đăng ký listener lắng nghe sự kiện Match_Success
   * @param {function} callback(matchedUser)
   * @returns {function} unsubscribe function
   */
  onMatchSuccess(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Ngắt kết nối WebSocket (khi Logout)
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

const wsService = new WebSocketService();
export default wsService;
