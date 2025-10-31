// src/app/multi-trip-tracking/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import MultiTripMapView from '@/components/MultiTripMapView';
import styles from './page.module.css';

interface TripData {
  tripId: string;
  tripDate: string;
  direction: 'departure' | 'arrival';
  status: string;
  route: {
    routeId: string;
    name: string;
    department: string;
    arrival: string;
  };
  bus: {
    busId: string;
    plateNumber: string;
    capacity: number;
    status: string;
  };
  position: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
  };
  nextStop: {
    stopId: string;
    name: string;
    distance: number;
    estimatedTime: number;
  };
  progress: number;
  departureTime: string;
  students?: Array<{
    _id: string;
    name: string;
    avatar?: string;
    status: 'waiting' | 'on-bus' | 'arrived';
  }>;
}

interface Student {
  _id: string;
  name: string;
  class?: string;
  school?: string;
}

export default function MultiTripTrackingPage() {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [userRole, setUserRole] = useState<'driver' | 'parent'>('parent');
  const [students, setStudents] = useState<Student[]>([]); // Danh sách con của parent
  const [allStudentIds, setAllStudentIds] = useState<string[]>([]); // Tất cả studentIds

  // Get user role and students from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role === 'driver' ? 'driver' : 'parent');
      
      // Nếu là parent, lưu danh sách con
      if (user.role === 'parent' && user.students) {
        setStudents(user.students);
        setAllStudentIds(user.studentIds || []);
        
        // Mặc định chọn tất cả con (không filter)
        // Nếu muốn mặc định chọn con đầu tiên: setSelectedStudentId(user.studentIds[0])
      }
    }
  }, []);

  // Get studentId from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('studentId');
    if (studentId) {
      setSelectedStudentId(studentId);
    }
  }, []);

  // 🚀 AUTO GPS SIMULATION - Tự động update vị trí xe mỗi 3 giây
  useEffect(() => {
    const updateAllBusesGPS = async () => {
      try {
        const res = await fetch('/api/buses/simulate-all', {
          method: 'POST'
        });
        const data = await res.json();
        console.log(`📍 GPS auto-updated for ${data.updated} buses`);
      } catch (err) {
        console.error('❌ GPS update error:', err);
      }
    };

    // Chạy ngay lập tức
    updateAllBusesGPS();
    
    // Sau đó chạy mỗi 3 giây
    const gpsInterval = setInterval(updateAllBusesGPS, 3000);
    
    return () => clearInterval(gpsInterval);
  }, []);

  // School location (ví dụ: trường THPT)
  const schoolLocation = {
    name: 'Trường THPT',
    latitude: 10.762622,
    longitude: 106.660172,
  };

  // Fetch trips
  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      
      // Lấy thông tin user để biết là parent hay driver
      const userData = localStorage.getItem('user');
      let url = '/api/trips/realtime';
      
      if (userData) {
        const user = JSON.parse(userData);
        
        // ===== PARENT =====
        if (user.role === 'parent' && user.studentIds && user.studentIds.length > 0) {
          if (selectedStudentId) {
            // Chọn 1 con cụ thể → filter theo con đó
            url = `/api/trips/realtime?studentId=${selectedStudentId}`;
            console.log(`👨‍👩‍👧 Parent view: Filtering trips for student ${selectedStudentId}`);
          } else {
            // Chọn "Tất cả" → Lấy tất cả trips (không filter), sẽ filter ở client
            url = '/api/trips/realtime';
            console.log(`👨‍👩‍👧 Parent view: Loading all trips (will filter for ${user.studentIds.length} students)`);
          }
        }
        
        // ===== DRIVER: Chỉ lấy trips của xe mình =====
        if (user.role === 'driver' && user.bus?.plateNumber) {
          url = `/api/trips/realtime?plateNumber=${user.bus.plateNumber}`;
          console.log(`🚗 Driver view: Filtering trips for bus ${user.bus.plateNumber}`);
        }
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`📊 Loaded ${data.data.length} trip(s)`);
        
        let filteredTrips = data.data;
        
        // ===== CLIENT-SIDE FILTER cho Parent chọn "Tất cả" =====
        if (userData) {
          const user = JSON.parse(userData);
          if (user.role === 'parent' && !selectedStudentId && allStudentIds.length > 0) {
            // Filter chỉ lấy trips có chứa ít nhất 1 con của parent
            filteredTrips = data.data.filter((trip: any) => {
              // Giả sử API trả về trip.studentIds (array of student IDs in this trip)
              // Nếu không có, bỏ qua bước filter này
              return true; // Tạm thời cho qua hết, cần check API response structure
            });
            console.log(`✅ Filtered to ${filteredTrips.length} trips for parent's students`);
          }
        }
        
        // Thêm mock data cho học sinh
        const tripsWithStudents = filteredTrips.map((trip: TripData, index: number) => {
          const mockStudents = [
            {
              _id: `student-${index}-1`,
              name: 'Trần Trọng Duy',
              avatar: '👦',
              status: index === 0 ? 'waiting' : 'on-bus',
            },
            {
              _id: `student-${index}-2`,
              name: 'Nguyễn Thị Mai',
              avatar: '👧',
              status: 'on-bus',
            },
            {
              _id: `student-${index}-3`,
              name: 'Lê Văn Nam',
              avatar: '👦',
              status: trip.progress > 80 ? 'arrived' : 'on-bus',
            },
          ];

          return {
            ...trip,
            students: mockStudents.slice(0, Math.floor(Math.random() * 3) + 1),
          };
        });

        setTrips(tripsWithStudents);
        setLastUpdate(new Date());

        // Kiểm tra và gửi notifications
        if (data.data.length > 0) {
          await fetch('/api/notifications/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trips: data.data,
              schoolLocation,
            }),
          });
        }
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Không thể tải dữ liệu chuyến xe');
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId, allStudentIds]);

  // Initial fetch
  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTrips();
    }, 3000); // Refresh mỗi 3 giây để xe di chuyển mượt

    return () => clearInterval(interval);
  }, [autoRefresh, fetchTrips]);

  const selectedTrip = trips.find((t) => t.tripId === selectedTripId);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>
            {userRole === 'driver' ? '🚌 Quản lý tuyến đường' : '👨‍👩‍👧 Theo dõi xe bus'}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#718096' }}>
            {userRole === 'driver' 
              ? 'Xem route và vị trí xe của bạn' 
              : selectedStudentId 
                ? `Theo dõi xe của ${students.find(s => s._id === selectedStudentId)?.name || 'con bạn'}` 
                : 'Theo dõi vị trí các chuyến xe'}
          </p>
        </div>
        <div className={styles.controls}>
          {/* Dropdown chọn con - CHỈ hiển thị cho Parent có nhiều con */}
          {userRole === 'parent' && students.length > 0 && (
            <div className={styles.studentSelector}>
              <label style={{ marginRight: '8px', fontWeight: '500' }}>👶 Chọn con:</label>
              <select 
                value={selectedStudentId || 'all'} 
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all') {
                    setSelectedStudentId(null);
                  } else {
                    setSelectedStudentId(value);
                  }
                }}
                className={styles.studentDropdown}
              >
                <option value="all">Tất cả ({students.length} con)</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} {student.class ? `- ${student.class}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className={styles.autoRefresh}>
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span>Tự động cập nhật (10s)</span>
            </label>
          </div>
          <button onClick={fetchTrips} className={styles.refreshBtn}>
            🔄 Làm mới
          </button>
          {lastUpdate && (
            <span className={styles.lastUpdate}>
              Cập nhật: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {selectedStudentId && (
        <div className={styles.filterInfo}>
          <span>🎓 Đang xem chuyến xe của {students.find(s => s._id === selectedStudentId)?.name || 'con bạn'}</span>
          <button 
            onClick={() => {
              setSelectedStudentId(null);
            }}
            className={styles.clearFilterBtn}
          >
            ✕ Xem tất cả
          </button>
        </div>
      )}

      {error && (
        <div className={styles.error}>⚠️ {error}</div>
      )}

      <div className={styles.content}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <h2>Chuyến xe ({trips.length})</h2>
          
          {loading && trips.length === 0 ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : trips.length === 0 ? (
            <div className={styles.noTrips}>
              Không có chuyến xe nào đang hoạt động
            </div>
          ) : (
            <div className={styles.tripList}>
              {trips.map((trip, index) => (
                <div
                  key={trip.tripId}
                  className={`${styles.tripCard} ${
                    selectedTripId === trip.tripId ? styles.selected : ''
                  }`}
                  onClick={() => setSelectedTripId(trip.tripId)}
                >
                  <div className={styles.tripHeader}>
                    <div
                      className={styles.tripColor}
                      style={{
                        background: [
                          '#4299e1',
                          '#48bb78',
                          '#ed8936',
                          '#9f7aea',
                          '#f56565',
                          '#38b2ac',
                        ][index % 6],
                      }}
                    />
                    <div>
                      <h3>{trip.bus.plateNumber}</h3>
                      <p className={styles.routeName}>{trip.route.name}</p>
                    </div>
                  </div>

                  <div className={styles.tripInfo}>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Hướng:</span>
                      <span className={styles.badge}>
                        {trip.direction === 'departure' ? '🏫 Đến trường' : '🏠 Về nhà'}
                      </span>
                    </div>

                    <div className={styles.infoRow}>
                      <span className={styles.label}>Tiến độ:</span>
                      <span>{(trip.progress || 0).toFixed(1)}%</span>
                    </div>

                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${trip.progress || 0}%` }}
                      />
                    </div>

                    <div className={styles.infoRow}>
                      <span className={styles.label}>Trạm kế:</span>
                      <span>{trip.nextStop?.name || 'N/A'}</span>
                    </div>

                    <div className={styles.infoRow}>
                      <span className={styles.label}>Khoảng cách:</span>
                      <span>{(trip.nextStop?.distance || 0).toFixed(1)} km</span>
                    </div>

                    <div className={styles.infoRow}>
                      <span className={styles.label}>Tốc độ:</span>
                      <span>{trip.position?.speed || 0} km/h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Map */}
        <main className={styles.mapContainer}>
          <MultiTripMapView
            trips={trips}
            selectedTripId={selectedTripId}
            onTripSelect={setSelectedTripId}
            height="100%"
            showRoutes={userRole === 'driver'}
            userRole={userRole}
          />

          {selectedTrip && (
            <div className={styles.mapOverlay}>
              <div className={styles.selectedTripInfo}>
                <h3>🚌 {selectedTrip.bus?.plateNumber || 'N/A'}</h3>
                <p><strong>Tuyến:</strong> {selectedTrip.route?.name || 'N/A'}</p>
                <p><strong>Từ:</strong> {selectedTrip.route?.department || 'N/A'}</p>
                <p><strong>Đến:</strong> {selectedTrip.route?.arrival || 'N/A'}</p>
                <p><strong>Khởi hành:</strong> {selectedTrip.departureTime || 'N/A'}</p>
                <p><strong>Sức chứa:</strong> {selectedTrip.bus?.capacity || 0} người</p>
                <div className={styles.progressSection}>
                  <p><strong>Tiến độ:</strong> {(selectedTrip.progress || 0).toFixed(1)}%</p>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${selectedTrip.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
