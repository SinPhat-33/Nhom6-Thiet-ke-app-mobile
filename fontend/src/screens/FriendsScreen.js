import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../theme';
import {
  getFriendsAPI,
  getPendingRequestsAPI,
  searchUsersAPI,
  sendFriendRequestAPI,
  respondFriendRequestAPI,
} from '../services/api';

// ====================================================================
// TÍNH KHOẢNG CÁCH HAVERSINE
// ====================================================================
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // bán kính Trái Đất (mét)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

// ====================================================================
// MAIN COMPONENT
// ====================================================================
const FriendsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'pending'
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // ── Load dữ liệu ban đầu ──
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        getFriendsAPI(),
        getPendingRequestsAPI(),
      ]);
      setFriends(friendsRes.friends || []);
      setPendingRequests(pendingRes.requests || []);
      setPendingCount((pendingRes.requests || []).length);
    } catch (err) {
      console.log('Load friends error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Tìm kiếm user ──
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchUsersAPI(text);
      setSearchResults(res.users || []);
    } catch (err) {
      console.log('Search error:', err);
    }
  };

  // ── Gửi lời mời kết bạn ──
  const handleSendRequest = async (userId, username) => {
    try {
      await sendFriendRequestAPI(userId);
      Alert.alert('🎉 Thành công', `Đã gửi lời mời kết bạn cho ${username}`);
    } catch (err) {
      Alert.alert('⚠️ Lỗi', err.message || 'Không thể gửi lời mời');
    }
  };

  // ── Phản hồi lời mời ──
  const handleRespond = async (requestId, action, name) => {
    try {
      await respondFriendRequestAPI(requestId, action);
      Alert.alert(
        action === 'accept' ? '🤝 Đã chấp nhận' : '❌ Đã từ chối',
        action === 'accept'
          ? `${name} giờ là bạn của bạn!`
          : `Đã từ chối lời mời từ ${name}`
      );
      loadData(); // Reload cả 2 list
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể xử lý');
    }
  };

  // ── Nhấn vào bạn bè để xem trên bản đồ ──
  const handleFriendClick = (friend) => {
    // Nếu bạn bè chưa có tọa độ thì báo lỗi
    if (!friend.latitude || !friend.longitude) {
      Alert.alert('Chưa có vị trí', 'Người bạn này chưa cập nhật vị trí.');
      return;
    }
    
    // Chuyển sang tab Home và truyền tọa độ
    navigation.navigate('Home', {
      friendLat: friend.latitude,
      friendLng: friend.longitude,
      friendName: friend.full_name || friend.username,
      friendEmoji: friend.emoji
    });
  };

  // ── Render từng bạn bè ──
  const renderFriendItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendCard}
      activeOpacity={0.7}
      onPress={() => handleFriendClick(item)}
    >
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarEmoji}>{item.emoji || '👤'}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.full_name || item.username}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
      </View>
      <View style={styles.statusBadge}>
        <View style={styles.onlineDot} />
        <Text style={styles.statusText}>Online</Text>
      </View>
    </TouchableOpacity>
  );

  // ── Render từng lời mời ──
  const renderPendingItem = ({ item }) => (
    <View style={styles.friendCard}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarEmoji}>{item.emoji || '👤'}</Text>
      </View>
      <View style={[styles.friendInfo, { flex: 1 }]}>
        <Text style={styles.friendName}>{item.full_name || item.username}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleRespond(item.request_id, 'accept', item.full_name)}
        >
          <Text style={styles.acceptText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => handleRespond(item.request_id, 'reject', item.full_name)}
        >
          <Text style={styles.rejectText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Render kết quả tìm kiếm ──
  const renderSearchItem = ({ item }) => {
    const isFriend = friends.some((f) => f.user_id === item.user_id);
    return (
      <View style={styles.friendCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>{item.emoji || '👤'}</Text>
        </View>
        <View style={[styles.friendInfo, { flex: 1 }]}>
          <Text style={styles.friendName}>{item.full_name}</Text>
          <Text style={styles.friendUsername}>@{item.username}</Text>
        </View>
        {isFriend ? (
          <View style={styles.alreadyFriendBadge}>
            <Text style={styles.alreadyFriendText}>Bạn bè</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleSendRequest(item.user_id, item.full_name)}
          >
            <Text style={styles.addBtnText}>Kết bạn</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ====================================================================
  // RENDER
  // ====================================================================
  return (
    <SafeAreaView style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bạn Bè</Text>
        <Text style={styles.headerSubtitle}>
          {friends.length} bạn bè
        </Text>
      </View>

      {/* ── THANH TÌM KIẾM ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên hoặc username..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setIsSearching(false);
              }}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── KẾT QUẢ TÌM KIẾM ── */}
      {isSearching ? (
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>KẾT QUẢ TÌM KIẾM</Text>
          {searchResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔎</Text>
              <Text style={styles.emptyText}>Không tìm thấy ai</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.user_id.toString()}
              renderItem={renderSearchItem}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        <>
          {/* ── TAB CHUYỂN ĐỔI ── */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
              onPress={() => setActiveTab('friends')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'friends' && styles.tabTextActive,
                ]}
              >
                👥 Bạn bè
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
              onPress={() => setActiveTab('pending')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'pending' && styles.tabTextActive,
                ]}
              >
                📩 Lời mời
              </Text>
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── DANH SÁCH ── */}
          <View style={styles.listContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : activeTab === 'friends' ? (
              friends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>👋</Text>
                  <Text style={styles.emptyText}>Chưa có bạn bè nào</Text>
                  <Text style={styles.emptySubtext}>
                    Tìm kiếm username để kết bạn nhé!
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={friends}
                  keyExtractor={(item) => item.user_id.toString()}
                  renderItem={renderFriendItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )
            ) : pendingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>Không có lời mời nào</Text>
              </View>
            ) : (
              <FlatList
                data={pendingRequests}
                keyExtractor={(item) => item.request_id.toString()}
                renderItem={renderPendingItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

// ====================================================================
// STYLES
// ====================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ──
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? SPACING.md : SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // ── Search ──
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
  },
  clearIcon: {
    fontSize: 16,
    color: COLORS.textMuted,
    padding: 4,
  },

  // ── Tabs ──
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 5,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },

  // ── List ──
  listContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },

  // ── Friend Card ──
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  friendInfo: {
    marginLeft: SPACING.md,
  },
  friendName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  friendUsername: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // ── Status badge ──
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },

  // ── Action Buttons (Pending) ──
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 8,
  },
  acceptBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  rejectBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectText: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // ── Add friend button (Search) ──
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  alreadyFriendBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  alreadyFriendText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 6,
  },
});

export default FriendsScreen;
