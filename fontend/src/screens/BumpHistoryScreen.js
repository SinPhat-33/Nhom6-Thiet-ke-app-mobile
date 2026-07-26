/**
 * BumpHistoryScreen.js — SCRUM-47: Dựng màn hình "Lịch sử Bump"
 *
 * Hiển thị danh sách Lịch sử Bump (Bump History) dạng FlatList:
 *  - Thông tin người đã lắc trúng (Avatar, Họ tên, Username).
 *  - Thời gian lắc trúng (định dạng ngày/giờ).
 *  - Nút bấm nhanh để nhắn tin hoặc xem vị trí của đối phương.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../theme';
import { getBumpHistoryAPI } from '../services/api';

const BumpHistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      setErrorMsg(null);
      const res = await getBumpHistoryAPI();
      setHistory(res.history || res || []);
    } catch (err) {
      console.log('Load bump history error:', err);
      setErrorMsg(err.message || 'Không thể tải lịch sử Bump');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Mới đây';
    const date = new Date(dateStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const renderItem = ({ item }) => {
    const bumpedUser = item.bumped_user || item.BumpedUser || {};
    const profile = bumpedUser.profile || bumpedUser.Profile || {};

    const name = profile.full_name || bumpedUser.username || 'Người dùng';
    const username = bumpedUser.username ? `@${bumpedUser.username}` : '';
    const avatar = profile.avatar_url || '👤';
    const timeStr = formatDate(item.bumped_at || item.CreatedAt);

    return (
      <View style={styles.card}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>{avatar}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{name}</Text>
          {username ? <Text style={styles.usernameText}>{username}</Text> : null}
          <View style={styles.timeBadge}>
            <Text style={styles.timeIcon}>🕒</Text>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => {
            navigation.navigate('Chat', {
              friendId: bumpedUser.id || item.bumped_user_id,
              friendName: name,
              friendAvatar: avatar,
            });
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.chatButtonText}>💬 Chat</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử Bump ⚡</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử va chạm...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadHistory}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📳</Text>
          <Text style={styles.emptyTitle}>Chưa có lượt Bump nào</Text>
          <Text style={styles.emptyText}>
            Hãy lắc điện thoại cùng bạn bè ở gần bạn để lưu danh sách ghép đôi nhé!
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => (item.id || item.ID || Math.random()).toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    paddingRight: SPACING.sm,
  },
  backIcon: {
    fontSize: 32,
    color: '#1E293B',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
  },
  listContent: {
    padding: SPACING.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  usernameText: {
    fontSize: FONT_SIZES.xs,
    color: '#64748B',
    marginBottom: 4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  timeText: {
    fontSize: FONT_SIZES.xs,
    color: '#94A3B8',
  },
  chatButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: FONT_SIZES.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 54,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: SPACING.lg,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.sm,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default BumpHistoryScreen;
