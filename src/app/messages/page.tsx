'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  isOwnMessage: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface Chat {
  chatId: string;
  driverName: string;
  driverAvatar: string;
  busNumber: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data
  useEffect(() => {
    const mockChats: Chat[] = [
      {
        chatId: '1',
        driverName: 'Trương Thế Vinh',
        driverAvatar: '👨‍✈️',
        busNumber: '51B-123.45',
        lastMessage: 'Xe đã đến trạm Xin mời học sinh ra xe',
        lastMessageTime: new Date('2025-10-28T07:15:00'),
        unreadCount: 2,
      },
      {
        chatId: '2',
        driverName: 'Nguyễn Văn An',
        driverAvatar: '👨‍✈️',
        busNumber: '51B-678.90',
        lastMessage: 'Chào buổi sáng! Xe đang trên đường đến',
        lastMessageTime: new Date('2025-10-28T06:50:00'),
        unreadCount: 0,
      },
      {
        chatId: '3',
        driverName: 'Lê Thị Mai',
        driverAvatar: '👩‍✈️',
        busNumber: '51B-111.22',
        lastMessage: 'Cảm ơn phụ huynh đã tin tưởng',
        lastMessageTime: new Date('2025-10-27T16:30:00'),
        unreadCount: 0,
      },
    ];

    const mockMessages: Record<string, Message[]> = {
      '1': [
        {
          id: '1',
          senderId: 'driver-1',
          senderName: 'Trương Thế Vinh',
          senderAvatar: '👨‍✈️',
          content: 'Chào Bố nhật',
          timestamp: new Date('2025-10-28T07:10:00'),
          isOwnMessage: false,
          status: 'read',
        },
        {
          id: '2',
          senderId: 'driver-1',
          senderName: 'Trương Thế Vinh',
          senderAvatar: '👨‍✈️',
          content: 'Xe đã đến trạm Xin mời học sinh ra xe',
          timestamp: new Date('2025-10-28T07:15:00'),
          isOwnMessage: false,
          status: 'delivered',
        },
      ],
      '2': [
        {
          id: '1',
          senderId: 'driver-2',
          senderName: 'Nguyễn Văn An',
          senderAvatar: '👨‍✈️',
          content: 'Chào buổi sáng! Xe đang trên đường đến',
          timestamp: new Date('2025-10-28T06:50:00'),
          isOwnMessage: false,
          status: 'read',
        },
        {
          id: '2',
          senderId: 'parent-1',
          senderName: 'Phụ huynh',
          senderAvatar: 'PH',
          content: 'Dạ cảm ơn tài xế',
          timestamp: new Date('2025-10-28T06:52:00'),
          isOwnMessage: true,
          status: 'read',
        },
      ],
    };

    setChats(mockChats);
    setLoading(false);

    // Set first chat as selected
    if (mockChats.length > 0) {
      setSelectedChat(mockChats[0].chatId);
      setMessages(mockMessages[mockChats[0].chatId] || []);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId);
    
    // Mock messages for selected chat
    const mockMessages: Record<string, Message[]> = {
      '1': [
        {
          id: '1',
          senderId: 'driver-1',
          senderName: 'Trương Thế Vinh',
          senderAvatar: '👨‍✈️',
          content: 'Chào Bố nhật',
          timestamp: new Date('2025-10-28T07:10:00'),
          isOwnMessage: false,
          status: 'read',
        },
        {
          id: '2',
          senderId: 'driver-1',
          senderName: 'Trương Thế Vinh',
          senderAvatar: '👨‍✈️',
          content: 'Xe đã đến trạm Xin mời học sinh ra xe',
          timestamp: new Date('2025-10-28T07:15:00'),
          isOwnMessage: false,
          status: 'delivered',
        },
      ],
      '2': [
        {
          id: '1',
          senderId: 'driver-2',
          senderName: 'Nguyễn Văn An',
          senderAvatar: '👨‍✈️',
          content: 'Chào buổi sáng! Xe đang trên đường đến',
          timestamp: new Date('2025-10-28T06:50:00'),
          isOwnMessage: false,
          status: 'read',
        },
      ],
      '3': [
        {
          id: '1',
          senderId: 'driver-3',
          senderName: 'Lê Thị Mai',
          senderAvatar: '👩‍✈️',
          content: 'Cảm ơn phụ huynh đã tin tưởng',
          timestamp: new Date('2025-10-27T16:30:00'),
          isOwnMessage: false,
          status: 'read',
        },
      ],
    };

    setMessages(mockMessages[chatId] || []);

    // Mark chat as read
    setChats(prev =>
      prev.map(chat =>
        chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'parent-1',
      senderName: 'Phụ huynh',
      senderAvatar: 'PH',
      content: newMessage,
      timestamp: new Date(),
      isOwnMessage: true,
      status: 'sent',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Update last message in chat list
    setChats(prev =>
      prev.map(chat =>
        chat.chatId === selectedChat
          ? { ...chat, lastMessage: newMessage, lastMessageTime: new Date() }
          : chat
      )
    );
  };

  const selectedChatData = chats.find(chat => chat.chatId === selectedChat);

  return (
    <div className={styles.container}>
      <div className={styles.chatLayout}>
        {/* Chat List Sidebar */}
        <div className={styles.chatList}>
          <div className={styles.chatListHeader}>
            <h2>Tin nhắn</h2>
          </div>

          {loading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : (
            <div className={styles.chatItems}>
              {chats.map(chat => (
                <div
                  key={chat.chatId}
                  className={`${styles.chatItem} ${
                    selectedChat === chat.chatId ? styles.active : ''
                  }`}
                  onClick={() => handleChatSelect(chat.chatId)}
                >
                  <div className={styles.chatAvatar}>{chat.driverAvatar}</div>
                  <div className={styles.chatInfo}>
                    <div className={styles.chatHeader}>
                      <h3>{chat.driverName}</h3>
                      <span className={styles.chatTime}>
                        {chat.lastMessageTime.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className={styles.chatPreview}>
                      <p>{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <span className={styles.unreadBadge}>
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className={styles.busNumber}>🚌 {chat.busNumber}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className={styles.chatWindow}>
          {selectedChatData ? (
            <>
              {/* Chat Header */}
              <div className={styles.chatWindowHeader}>
                <button className={styles.backButton} onClick={() => setSelectedChat(null)}>
                  ←
                </button>
                <div className={styles.chatAvatar}>
                  {selectedChatData.driverAvatar}
                </div>
                <div className={styles.chatHeaderInfo}>
                  <h2>Tài xế: {selectedChatData.driverName}</h2>
                  <p>🚌 {selectedChatData.busNumber}</p>
                </div>
                <div className={styles.chatActions}>
                  <button className={styles.actionButton} title="Xem chi tiết">
                    ℹ️
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className={styles.messagesContainer}>
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`${styles.message} ${
                      message.isOwnMessage ? styles.ownMessage : styles.otherMessage
                    }`}
                  >
                    {!message.isOwnMessage && (
                      <div className={styles.messageAvatar}>
                        {message.senderAvatar}
                      </div>
                    )}
                    <div className={styles.messageBubble}>
                      <p>{message.content}</p>
                      <span className={styles.messageTime}>
                        {message.timestamp.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {message.isOwnMessage && message.status === 'read' && ' ✓✓'}
                        {message.isOwnMessage && message.status === 'delivered' && ' ✓'}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div className={styles.quickReplies}>
                <button
                  className={styles.quickReplyBtn}
                  onClick={() => setNewMessage('Chào Bố nhật')}
                >
                  Chào Bố nhật
                </button>
                <button
                  className={styles.quickReplyBtn}
                  onClick={() => setNewMessage('Xe đã đến trạm Xin mời học sinh ra xe')}
                >
                  Xe đã đến trạm Xin mời học sinh ra xe
                </button>
              </div>

              {/* Message Input */}
              <div className={styles.messageInput}>
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  className={styles.sendButton}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  ✈️
                </button>
              </div>
            </>
          ) : (
            <div className={styles.emptyChat}>
              <p>💬 Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
