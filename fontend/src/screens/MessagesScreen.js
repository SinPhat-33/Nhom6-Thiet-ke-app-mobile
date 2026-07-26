import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../theme';
import { getChatListAPI } from '../services/api';

const MessagesScreen = ({ navigation }) => {
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reload danh sách mỗi khi vào tab này
  useFocusEffect(
    useCallback(() => {
      loadChatList();
    }, [])
  );

  const loadChatList = async () => {
    try {
      const res = await getChatListAPI();
      setChatList(res.chat_list || []);
    } catch (err) {
      console.log('Load chat list error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Chat', {
        friendId: item.user_id,
        friendName: item.full_name || item.username,
        friendAvatar: item.avatar_url || '👤'
      })}
    >
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarEmoji}>{item.avatar_url || '👤'}</Text>
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.full_name || item.username}</Text>
          {/* Format time đơn giản */}
          <Text style={styles.chatTime}>
            {item.last_time ? new Date(item.last_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
          </Text>
        </View>
        <View style={styles.chatMessageRow}>
          <Text 
            style={[styles.chatLastMessage, item.unread > 0 && styles.chatLastMessageUnread]}
            numberOfLines={1}
          >
            {item.last_msg || 'Chưa có tin nhắn'}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin Nhắn</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : chatList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
          <Text style={styles.emptySubtext}>Hãy ra bản đồ và nhắn tin cho bạn bè nhé!</Text>
        </View>
      ) : (
        <FlatList
          data={chatList}
          keyExtractor={(item) => item.user_id.toString()}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? SPACING.md : SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 20,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  chatInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  chatName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chatMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatLastMessage: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    paddingRight: SPACING.sm,
  },
  chatLastMessageUnread: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});

export default MessagesScreen;
