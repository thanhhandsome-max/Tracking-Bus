'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Notification {
  id: string;
  type: 'arrival' | 'departure' | 'alert';
  message: string;
  createdAt: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Lấy user từ localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      window.location.href = '/login';
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Fetch notifications từ API
    fetch(`/api/notifications?userId=${parsedUser._id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotifications(data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching notifications:', err);
        setLoading(false);
      });
  }, []);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread' && notif.read) return false;
    if (filter === 'read' && !notif.read) return false;
    return true;
  });

  const markAsRead = (id: string) => {
    // Gọi API để đánh dấu đã đọc
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id })
    })
      .then(() => {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
      })
      .catch((err) => console.error('Error marking notification as read:', err));
  };

  const markAllAsRead = () => {
    // Đánh dấu tất cả chưa đọc
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    
    Promise.all(
      unreadIds.map(id => 
        fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: id })
        })
      )
    ).then(() => {
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    }).catch((err) => console.error('Error marking all as read:', err));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'departure':
        return '🚌';
      case 'arrival':
        return '🏫';
      case 'alert':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Thông báo</h1>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount} mới</span>
        )}
      </div>

      <div className={styles.actions}>
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'unread' ? styles.active : ''}`}
            onClick={() => setFilter('unread')}
          >
            Chưa đọc
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'read' ? styles.active : ''}`}
            onClick={() => setFilter('read')}
          >
            Đã đọc
          </button>
        </div>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={markAllAsRead}>
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : (
        <div className={styles.notificationList}>
          {filteredNotifications.length === 0 ? (
            <div className={styles.empty}>Không có thông báo nào</div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`${styles.notificationCard} ${
                  !notif.read ? styles.unread : ''
                }`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className={styles.notifIcon}>
                  {getNotificationIcon(notif.type)}
                </div>
                <div className={styles.notifContent}>
                  <p className={styles.notifMessage}>{notif.message}</p>
                  <span className={styles.notifTime}>
                    {new Date(notif.createdAt).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <Link
                  href={`/multi-trip-tracking`}
                  className={styles.viewTripBtn}
                  onClick={(e) => e.stopPropagation()}
                >
                  Xem bản đồ
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
