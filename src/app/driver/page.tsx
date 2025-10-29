'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

interface Bus {
  _id: string;
  plateNumber: string;
  capacity: number;
}

interface ActiveTrip {
  tripId: string;
  route: {
    name: string;
    department: string;
    arrival: string;
  };
  direction: 'departure' | 'arrival';
  status: string;
  currentStop?: string;
}

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bus, setBus] = useState<Bus | null>(null);
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Auto simulate GPS every 10 seconds for ALL buses
  useEffect(() => {
    if (loading) return;

    // Update function cho TẤT CẢ buses
    const updateAllBusesGPS = async () => {
      try {
        const res = await fetch('/api/buses/simulate-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log(`📍 GPS updated for ${data.updated} buses automatically`);
        } else {
          console.error('GPS update failed:', res.status);
        }
      } catch (error) {
        console.error('Failed to update GPS:', error);
      }
    };

    // Chạy ngay lập tức
    updateAllBusesGPS();

    // Sau đó chạy mỗi 3 giây để xe di chuyển mượt
    const interval = setInterval(updateAllBusesGPS, 3000);

    return () => clearInterval(interval);
  }, [loading]);

  const handleSimulateGPS = async () => {
    if (!bus?._id) return;
    
    setSimulating(true);
    try {
      const res = await fetch('/api/buses/simulate-gps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busId: bus._id })
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`✅ Vị trí GPS đã cập nhật!\nĐộ: ${data.data.latitude.toFixed(6)}, Kinh: ${data.data.longitude.toFixed(6)}\nTốc độ: ${data.data.speed} km/h`);
      }
    } catch (error) {
      alert('❌ Lỗi cập nhật GPS');
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    // Check authentication and role
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // Check if user is driver
    if (parsedUser.role !== 'driver') {
      router.push('/'); // Redirect to parent dashboard
      return;
    }
    
    setUser(parsedUser);
    setBus(parsedUser.bus);
    setLoading(false);

    // Fetch active trips for this driver's bus
    if (parsedUser.bus) {
      fetch('/api/trips/active')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // Filter trips for this driver's bus
            const driverTrips = data.data.filter(
              (trip: any) => trip.bus._id === parsedUser.bus._id
            );
            setActiveTrips(driverTrips);
          }
        })
        .catch((err) => console.error('Error fetching trips:', err));
    }
  }, [router]);

  if (loading) {
    return <div className={styles.loading}>Đang tải...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>🚌 Bảng điều khiển tài xế</h1>
          <p className={styles.subtitle}>
            Xin chào {user?.name} - Tài xế xe {bus?.plateNumber}
          </p>
        </div>
      </header>

      <main className={styles.main}>
        {/* Driver Info Card */}
        <section className={styles.driverInfo}>
          <h2>👤 Thông tin tài xế</h2>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Họ tên:</span>
              <span className={styles.value}>{user?.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{user?.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Số điện thoại:</span>
              <span className={styles.value}>{user?.phone}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Số bằng lái:</span>
              <span className={styles.value}>{user?.licenseNumber}</span>
            </div>
          </div>
        </section>

        {/* Bus Info Card */}
        {bus && (
          <section className={styles.busInfo}>
            <h2>🚍 Thông tin xe bus</h2>
            <div className={styles.infoCard}>
              <div className={styles.busHeader}>
                <div className={styles.busIcon}>🚌</div>
                <div>
                  <h3 className={styles.plateNumber}>{bus.plateNumber}</h3>
                  <p className={styles.capacity}>Sức chứa: {bus.capacity} chỗ</p>
                </div>
              </div>
              <div className={styles.busActions}>
                <Link href="/driver/tracking" className={styles.trackBtn}>
                  📍 Xem bản đồ & Route
                </Link>
                <button 
                  onClick={handleSimulateGPS}
                  disabled={simulating}
                  className={styles.updateBtn}
                >
                  {simulating ? '⏳ Đang cập nhật...' : '� Cập nhật GPS (Test)'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Active Trips */}
        <section className={styles.tripsSection}>
          <h2>🚌 Chuyến xe hôm nay</h2>
          {activeTrips.length === 0 ? (
            <div className={styles.empty}>
              <p>Không có chuyến xe nào đang hoạt động</p>
            </div>
          ) : (
            <div className={styles.tripsList}>
              {activeTrips.map((trip, index) => (
                <div key={trip.tripId || `trip-${index}`} className={styles.tripCard}>
                  <div className={styles.tripHeader}>
                    <span className={styles.tripStatus}>
                      {trip.direction === 'departure' ? '🏫 Đến trường' : '🏠 Về nhà'}
                    </span>
                    <span className={`${styles.statusBadge} ${styles[trip.status]}`}>
                      {trip.status === 'active' ? 'Đang chạy' : 'Hoàn thành'}
                    </span>
                  </div>
                  <h4 className={styles.routeName}>{trip.route.name}</h4>
                  <div className={styles.routeInfo}>
                    <div className={styles.stop}>
                      <span className={styles.icon}>📍</span>
                      <span>{trip.route.department}</span>
                    </div>
                    <span className={styles.arrow}>→</span>
                    <div className={styles.stop}>
                      <span className={styles.icon}>🎯</span>
                      <span>{trip.route.arrival}</span>
                    </div>
                  </div>
                  {trip.currentStop && (
                    <div className={styles.currentStop}>
                      <span className={styles.icon}>📍</span>
                      <span>Điểm hiện tại: {trip.currentStop}</span>
                    </div>
                  )}
                  <Link
                    href={`/multi-trip-tracking?trip=${trip.tripId}`}
                    className={styles.viewMapBtn}
                  >
                    Xem trên bản đồ
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className={styles.quickActions}>
          <h2>⚡ Truy cập nhanh</h2>
          <div className={styles.actionGrid}>
            <Link href="/messages" className={styles.actionCard}>
              <div className={styles.actionIcon}>💬</div>
              <h3>Tin nhắn</h3>
              <p>Nhắn tin với phụ huynh</p>
            </Link>

            <Link href="/notifications" className={styles.actionCard}>
              <div className={styles.actionIcon}>🔔</div>
              <h3>Thông báo</h3>
              <p>Gửi thông báo cho phụ huynh</p>
            </Link>

            <Link href="/routes" className={styles.actionCard}>
              <div className={styles.actionIcon}>🛣️</div>
              <h3>Tuyến đường</h3>
              <p>Xem thông tin tuyến đường</p>
            </Link>

            <Link href="/history" className={styles.actionCard}>
              <div className={styles.actionIcon}>📊</div>
              <h3>Lịch sử</h3>
              <p>Xem lịch sử các chuyến đi</p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
