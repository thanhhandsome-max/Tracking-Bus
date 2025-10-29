'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './HomePage.module.css';

interface Student {
  _id?: string;
  studentId?: string;
  name: string;
  class: string;
  school: string;
  age?: number;
}

interface ActiveTrip {
  tripId: string;
  route: {
    name: string;
    department: string;
    arrival: string;
  };
  bus: {
    plateNumber: string;
  };
  direction: 'departure' | 'arrival';
  progress: number;
  status: string;
}

interface Notification {
  id: string;
  type: 'arrival' | 'departure' | 'alert';
  message: string;
  createdAt: string;
  read: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check authentication on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // Redirect driver to driver dashboard
    if (parsedUser.role === 'driver') {
      router.push('/driver');
      return;
    }
    
    // Redirect admin to admin dashboard (if needed)
    if (parsedUser.role === 'admin') {
      // You can create admin dashboard later
      // router.push('/admin');
    }
    
    setUser(parsedUser);
    
    // Load user's students
    if (parsedUser.students) {
      setStudents(parsedUser.students);
    }
    
    setLoading(false);

    // Fetch active trips
    fetch('/api/trips/realtime')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setActiveTrips(data.data);
        }
      })
      .catch((err) => console.error('Error fetching trips:', err));

    // Fetch notifications
    fetch(`/api/notifications?userId=${parsedUser._id}&limit=5`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotifications(data.data);
        }
      })
      .catch((err) => console.error('Error fetching notifications:', err));
  }, [router]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>🚌 Hệ thống theo dõi xe bus</h1>
          <p className={styles.subtitle}>
            Chào mừng phụ huynh {user?.name ? `- ${user.name}` : ''}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Quick Actions */}
        <section className={styles.quickActions}>
          <h2>⚡ Truy cập nhanh</h2>
          <div className={styles.actionGrid}>
            <Link href="/multi-trip-tracking" className={styles.actionCard}>
              <div className={styles.actionIcon}>🗺️</div>
              <h3>Theo dõi xe bus</h3>
              <p>Xem vị trí tất cả xe bus real-time</p>
              {activeTrips.length > 0 && (
                <span className={styles.badge}>{activeTrips.length} chuyến đang chạy</span>
              )}
            </Link>

            <Link href="/routes" className={styles.actionCard}>
              <div className={styles.actionIcon}>🛣️</div>
              <h3>Tuyến đường</h3>
              <p>Xem các tuyến xe bus và lịch trình</p>
            </Link>

            <Link href="/history" className={styles.actionCard}>
              <div className={styles.actionIcon}>📊</div>
              <h3>Lịch sử</h3>
              <p>Xem lại lịch trình các chuyến đi</p>
            </Link>

            <Link href="/notifications" className={styles.actionCard}>
              <div className={styles.actionIcon}>🔔</div>
              <h3>Thông báo</h3>
              <p>Quản lý thông báo và cảnh báo</p>
            </Link>

            <Link href="/messages" className={styles.actionCard}>
              <div className={styles.actionIcon}>💬</div>
              <h3>Tin nhắn</h3>
              <p>Nhắn tin với tài xế xe bus</p>
            </Link>
          </div>
        </section>

        {/* Students Info */}
        <section className={styles.studentsSection}>
          <div className={styles.sectionHeader}>
            <h2>👨‍🎓 Học sinh của tôi</h2>
            {students.length > 1 && (
              <select 
                className={styles.studentSelect}
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(e.target.value || null)}
              >
                <option value="">Tất cả học sinh</option>
                {students.map((student, index) => (
                  <option 
                    key={student._id || student.studentId || `student-${index}`}
                    value={student._id || student.studentId}
                  >
                    {student.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {loading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : students.length === 0 ? (
            <div className={styles.empty}>
              <p>Chưa có thông tin học sinh</p>
              <button className={styles.addBtn}>+ Thêm học sinh</button>
            </div>
          ) : (
            <div className={styles.studentGrid}>
              {students
                .filter(student => 
                  !selectedStudentId || 
                  student._id === selectedStudentId || 
                  student.studentId === selectedStudentId
                )
                .map((student, index) => (
                <div key={student._id || student.studentId || `student-${index}`} className={styles.studentCard}>
                  <div className={styles.studentAvatar}>
                    {student.name.charAt(0)}
                  </div>
                  <div className={styles.studentInfo}>
                    <h3>{student.name}</h3>
                    <p className={styles.studentClass}>Lớp {student.class}</p>
                    <p className={styles.studentSchool}>{student.school}</p>
                    {student.age && <p className={styles.studentAge}>Tuổi: {student.age}</p>}
                  </div>
                  <div className={styles.studentActions}>
                    <Link
                      href={`/multi-trip-tracking?studentId=${student._id || student.studentId}`}
                      className={styles.trackBtn}
                    >
                      📍 Theo dõi
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Trips */}
        {activeTrips.length > 0 && (
          <section className={styles.tripsSection}>
            <div className={styles.sectionHeader}>
              <h2>🚌 Chuyến xe đang chạy</h2>
              <Link href="/multi-trip-tracking" className={styles.viewAllBtn}>
                Xem tất cả →
              </Link>
            </div>
            <div className={styles.tripsList}>
              {activeTrips.slice(0, 3).map((trip, index) => (
                <div key={trip.tripId || `trip-${index}`} className={styles.tripCard}>
                  <div className={styles.tripHeader}>
                    <span className={styles.busNumber}>
                      🚌 {trip.bus.plateNumber}
                    </span>
                    <span className={styles.tripStatus}>
                      {trip.direction === 'departure' ? '🏫 Đến trường' : '🏠 Về nhà'}
                    </span>
                  </div>
                  <h4 className={styles.routeName}>{trip.route?.name || 'N/A'}</h4>
                  <div className={styles.routeInfo}>
                    <span>📍 {trip.route?.department || 'N/A'}</span>
                    <span>→</span>
                    <span>🎯 {trip.route?.arrival || 'N/A'}</span>
                  </div>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${trip.progress || 0}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {(trip.progress || 0).toFixed(0)}%
                    </span>
                  </div>
                  <Link
                    href={`/multi-trip-tracking?trip=${trip.tripId}`}
                    className={styles.viewMapBtn}
                  >
                    Xem trên bản đồ
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Notifications */}
        <section className={styles.notificationsSection}>
          <div className={styles.sectionHeader}>
            <h2>🔔 Thông báo gần đây</h2>
            <Link href="/notifications" className={styles.viewAllBtn}>
              Xem tất cả →
            </Link>
          </div>
          {notifications.length === 0 ? (
            <div className={styles.empty}>
              <p>Không có thông báo nào</p>
            </div>
          ) : (
            <div className={styles.notificationsList}>
              {notifications.slice(0, 3).map((notif) => (
                <div key={notif.id} className={styles.notificationItem}>
                  <div className={styles.notifIcon}>
                    {notif.type === 'departure' ? '🚌' : notif.type === 'arrival' ? '🏫' : '⚠️'}
                  </div>
                  <div className={styles.notifContent}>
                    <p className={styles.notifTitle}>{notif.message}</p>
                    <p className={styles.notifTime}>
                      {formatTimeAgo(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className={styles.unreadDot} style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      marginLeft: '0.5rem'
                    }}></span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Helper function để format thời gian
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Vừa xong';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
