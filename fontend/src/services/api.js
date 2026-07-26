/**
 * api.js - Cấu hình API client
 *
 * Toàn bộ kết nối tới Backend Go thật qua localtunnel
 * KHÔNG còn dữ liệu Mock
 */

import * as SecureStore from 'expo-secure-store';

// ====================================================================
// CẤU HÌNH BASE URL — Trỏ trực tiếp về Go Backend (Port 8080)
// Sử dụng IP mạng LAN máy tính: 192.168.1.101:8080
// ====================================================================

import Constants from 'expo-constants';

// Hàm kiểm tra xem chuỗi có phải IP IPv4 hay không (vd: 192.168.1.101)
const isIPv4 = (str) => {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(str);
};

const getBackendBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    // Chỉ dùng nếu là IPv4 hợp lệ (tránh dùng domain tunnel xxx.exp.direct làm treo kết nối)
    if (ip && isIPv4(ip)) {
      return `http://${ip}:8080`;
    }
  }
  // Mặc định dùng IP LAN máy tính
  return 'http://192.168.1.101:8080';
};

export const BASE_URL = getBackendBaseUrl();

// ====================================================================
// QUẢN LÝ TOKEN — Request Interceptor & In-Memory Cache
// ====================================================================

const TOKEN_KEY = 'jwt_token';
let cachedToken = null; // In-memory RAM token cache (phát huy tác dụng ngay lập tức)

/**
 * Lưu JWT Token vào RAM cache & SecureStore
 */
export const saveToken = async (token) => {
  if (!token) return;
  cachedToken = token; // Lưu ngay vào bộ nhớ RAM (đồng bộ 100%)
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.log('[Token Save Warning] SecureStore error:', error);
  }
};

/**
 * Lấy JWT Token từ RAM cache hoặc SecureStore
 */
export const getToken = async () => {
  if (cachedToken) {
    return cachedToken;
  }
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      cachedToken = token;
    }
    return token;
  } catch (error) {
    return cachedToken;
  }
};

/**
 * Xóa JWT Token khi đăng xuất
 */
export const removeToken = async () => {
  cachedToken = null;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {}
};

// ====================================================================
// HTTP HELPER & REQUEST INTERCEPTOR — Gửi request tới Backend Go
// ====================================================================

const apiRequest = async (method, path, body = null, requireAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  };

  // ── REQUEST INTERCEPTOR: Tự động đính kèm Authorization Header ──
  const token = await getToken();
  if (requireAuth || token) {
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (requireAuth) {
      console.log(`[API INTERCEPTOR WARNING] ${method} ${path} yêu cầu xác thực nhưng chưa có Token!`);
      throw { status: 401, message: 'Bạn chưa đăng nhập hoặc token đã hết hạn.' };
    }
  }

  // Tự động hủy request (AbortController) sau 6 giây để chống treo loading
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const config = {
    method,
    headers,
    signal: controller.signal,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, config);
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        await removeToken();
      }
      console.log(`[API ERROR] ${method} ${path} (${response.status}):`, data);
      throw { status: response.status, message: data.error || 'Lỗi từ phía máy chủ' };
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.log(`[NETWORK ERROR] ${method} ${path}:`, error);

    if (error.name === 'AbortError') {
      throw { status: 0, message: `Thời gian chờ quá lâu (${BASE_URL}). Vui lòng kiểm tra kết nối Backend và thử lại.` };
    }
    if (error.status) throw error;
    throw { status: 0, message: `Không thể kết nối Backend (${BASE_URL}). Hãy đảm bảo backend đã chạy.` };
  }
};

// ====================================================================
// AUTH API
// ====================================================================

export const loginAPI = async (username, password) => {
  const data = await apiRequest('POST', '/api/login', { username, password });
  if (data.token) {
    await saveToken(data.token);
  }
  return data;
};

export const registerAPI = async (username, password) => {
  return await apiRequest('POST', '/api/register', { username, password });
};

// ====================================================================
// PROFILE API
// ====================================================================

export const getProfileAPI = async () => {
  return await apiRequest('GET', '/api/user/profile', null, true);
};

export const updateProfileAPI = async (profileData) => {
  return await apiRequest('PUT', '/api/user/profile', profileData, true);
};

export const upsertSocialLinkAPI = async (platform, linkUrl) => {
  return await apiRequest('POST', '/api/user/social-links', { platform, link_url: linkUrl }, true);
};

// ====================================================================
// LOCATION API
// ====================================================================

export const updateLocationAPI = async (latitude, longitude, battery = 100) => {
  return await apiRequest('POST', '/api/user/location', { latitude, longitude, battery }, true);
};

export const getFriendsLocationsAPI = async () => {
  return await apiRequest('GET', '/api/friends/locations', null, true);
};

// ====================================================================
// MATCHING API — Tìm người gần đây trong bán kính 100m
// ====================================================================

export const getMatchNearbyAPI = async () => {
  return await apiRequest('GET', '/api/user/match', null, true);
};

// ====================================================================
// BUMP HISTORY API — Lịch sử va chạm
// ====================================================================

export const getBumpHistoryAPI = async () => {
  return await apiRequest('GET', '/api/user/bump-history', null, true);
};

// ====================================================================
// BUMP API — Tính năng Lắc / Va chạm (SCRUM-36 & SCRUM-43)
// ====================================================================

/**
 * bumpAPI — Gọi khi phát hiện điện thoại bị lắc
 * @param {number} latitude  - Vĩ độ GPS hiện tại
 * @param {number} longitude - Kinh độ GPS hiện tại
 * @returns {Promise<BumpResponse>} { status, message, matches[] }
 */
export const bumpAPI = async (latitude, longitude) => {
  return await apiRequest('POST', '/api/bump', { latitude, longitude }, true);
};

/**
 * uploadImageAPI — Upload ảnh lên CDN / Object Storage (SCRUM-54)
 * @param {string} imageUriOrBase64 - Đường dẫn URI hoặc Base64 string của ảnh
 * @returns {Promise<{ image_url: string, file_name: string }>}
 */
export const uploadImageAPI = async (imageUriOrBase64) => {
  const token = await getToken();
  const headers = {
    'Bypass-Tunnel-Reminder': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Nếu là Base64
  if (typeof imageUriOrBase64 === 'string' && (imageUriOrBase64.startsWith('data:') || imageUriOrBase64.length > 500)) {
    return await apiRequest('POST', '/api/upload', { image_base64: imageUriOrBase64 }, true);
  }

  // Nếu là Form Data
  const formData = new FormData();
  const filename = imageUriOrBase64.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image/jpeg`;

  formData.append('image', { uri: imageUriOrBase64, name: filename, type });

  try {
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw { status: response.status, message: data.error || 'Lỗi upload ảnh' };
    }
    return data;
  } catch (err) {
    if (err.status) throw err;
    throw { status: 0, message: 'Không thể kết nối server để upload ảnh' };
  }
};

// ====================================================================
// FRIENDS API
// ====================================================================

export const searchUsersAPI = async (query) => {
  const data = await apiRequest('GET', `/api/users/search?q=${encodeURIComponent(query)}`, null, true);
  const users = (data.users || []).map(u => ({
    user_id: u.user_id,
    username: u.username,
    full_name: u.full_name,
    emoji: u.avatar_url || '👤',
  }));
  return { users };
};

export const sendFriendRequestAPI = async (friendId) => {
  return await apiRequest('POST', '/api/friends/request', { friend_id: friendId }, true);
};

export const respondFriendRequestAPI = async (requestId, action) => {
  return await apiRequest('PUT', '/api/friends/respond', { request_id: requestId, action }, true);
};

export const getFriendsAPI = async () => {
  const data = await apiRequest('GET', '/api/friends', null, true);
  const friends = (data.friends || []).map(f => ({
    user_id: f.user_id,
    username: f.username,
    full_name: f.full_name,
    emoji: f.avatar_url || '👤',
    latitude: f.latitude,
    longitude: f.longitude,
    battery: f.battery,
  }));
  return { friends };
};

export const getPendingRequestsAPI = async () => {
  const data = await apiRequest('GET', '/api/friends/pending', null, true);
  const requests = (data.requests || []).map(r => ({
    request_id: r.request_id,
    user_id: r.user_id,
    username: r.username,
    full_name: r.full_name,
    emoji: r.avatar_url || '👤',
    created_at: r.created_at,
  }));
  return { requests };
};

// ====================================================================
// POI API — Địa điểm
// ====================================================================

export const getFriendsPOIsAPI = async () => {
  return await apiRequest('GET', '/api/poi', null, true);
};

export const createPOIAPI = async (type, name, latitude, longitude) => {
  return await apiRequest('POST', '/api/poi', { type, name, latitude, longitude }, true);
};

// ====================================================================
// MESSAGE API — Tin nhắn
// ====================================================================

export const getChatListAPI = async () => {
  return await apiRequest('GET', '/api/chat-list', null, true);
};

export const getChatHistoryAPI = async (friendId) => {
  return await apiRequest('GET', `/api/messages/${friendId}`, null, true);
};

export const sendMessageAPI = async (receiverId, content) => {
  return await apiRequest('POST', '/api/messages', { receiver_id: receiverId, content }, true);
};
