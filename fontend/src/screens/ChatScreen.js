import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
import { getChatHistoryAPI, sendMessageAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChatScreen = ({ route, navigation }) => {
  const { friendId, friendName, friendAvatar } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef();

  // Để đơn giản, ta dùng polling mỗi 2 giây để check tin nhắn mới
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const res = await getChatHistoryAPI(friendId);
      setMessages(res.messages || []);
    } catch (err) {
      console.log('Load chat history error:', err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Giả lập hiện ngay trên UI cho mượt
    const tempMsg = {
      ID: Date.now(),
      sender_id: 0, // 0 = mình (chỉ là cờ tạm để render)
      receiver_id: friendId,
      content: inputText.trim(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');

    try {
      await sendMessageAPI(friendId, tempMsg.content);
      loadMessages(); // Load lại ID thật từ server
    } catch (err) {
      console.log('Send message error:', err);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.receiver_id === friendId || item.sender_id === 0;

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}>
        {!isMe && (
          <View style={styles.smallAvatar}>
            <Text style={styles.smallAvatarEmoji}>{friendAvatar}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleThem]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerEmoji}>{friendAvatar}</Text>
            <Text style={styles.headerName}>{friendName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Danh sách tin nhắn */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.ID.toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Khu vực nhập text */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={COLORS.textMuted}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? SPACING.sm : SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backIcon: {
    fontSize: 32,
    color: COLORS.primary,
    marginTop: -8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  headerName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chatContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.sm,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowThem: {
    justifyContent: 'flex-start',
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  smallAvatarEmoji: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleThem: {
    backgroundColor: COLORS.surfaceLight,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
  },
  messageTextMe: {
    color: COLORS.white,
  },
  messageTextThem: {
    color: COLORS.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: FONT_SIZES.md,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    marginBottom: 2, // Căn giữa với input 1 dòng
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
  },
  sendIcon: {
    color: COLORS.white,
    fontSize: 18,
    marginLeft: 2, // Chỉnh icon mũi tên ra giữa
  },
});

export default ChatScreen;
