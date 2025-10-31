// src/app/driver/tracking/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  nextStop?: {
    stopId: string;
    name: string;
    distance: number;
    estimatedTime: number;
  };
  progress: number;
  departureTime: string;
  stops?: Array<{
    stopId: string;
    name: string;
    order: number;
    location: {
      coordinates: [number, number];
    };
    estimatedTime?: string;
  }>;
  students?: Array<{
    _id: string;
    name: string;
    avatar?: string;
    status: 'waiting' | 'on-bus' | 'arrived';
  }>;
}

export default function DriverTrackingPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [driverInfo, setDriverInfo] = useState<any>(null);

  // Check authentication and role
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'driver') {
      router.push('/');
      return;
    }

    setDriverInfo(user);
  }, [router]);

  // Fetch driver's trips
  const fetchTrips = useCallback(async () => {
    if (!driverInfo?.bus?._id) {
      console.log('⚠️  No driver bus info yet');
      return;
    }
    
    try {
      setError(null);
      const response = await fetch('/api/trips/realtime');
      
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu chuyến xe');
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`📊 Total trips from API: ${data.data.length}`);
        console.log(`🚌 My bus plate: ${driverInfo.bus.plateNumber}`);
        
        // Filter: Chỉ hiển thị trip của XE DRIVER NÀY
        // API trả về trip.bus = { plateNumber, capacity } nên match theo plateNumber
        const myTrips = data.data.filter((trip: any) => {
          const busMatch = trip.bus?.plateNumber === driverInfo.bus.plateNumber;
          
          console.log(`  🚗 Trip ${trip.tripId}: bus=${trip.bus?.plateNumber}, myBus=${driverInfo.bus.plateNumber}, match=${busMatch}`);
          return busMatch;
        });
        
        setTrips(myTrips);
        setLastUpdate(new Date());
        setLoading(false);
        
        console.log(`✅ Driver view: Showing ${myTrips.length} trip(s) for my bus ${driverInfo.bus.plateNumber}`);
      } else {
        throw new Error(data.error || 'Lỗi không xác định');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [driverInfo]);

  // Initial fetch
  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !driverInfo) return;

    const interval = setInterval(() => {
      fetchTrips();
    }, 3000); // Refresh mỗi 3 giây để xe di chuyển mượt

    return () => clearInterval(interval);
  }, [autoRefresh, fetchTrips, driverInfo]);

  const selectedTrip = trips.find((t) => t.tripId === selectedTripId);

  if (!driverInfo) {
    return <div className={styles.loading}>Đang xác thực...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>🚌 Quản lý tuyến đường</h1>
          <p className={styles.subtitle}>
            Xin chào, <strong>{driverInfo.name || driverInfo.email}</strong>
          </p>
        </div>
        <div className={styles.controls}>
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
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={() => router.push('/driver')} 
            className={styles.backBtn}
          >
            ← Về dashboard
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.error}>⚠️ {error}</div>
      )}

      <div className={styles.content}>
        {/* Map with routes */}
        <main className={styles.mapContainer}>
          <MultiTripMapView
            trips={trips}
            selectedTripId={selectedTripId}
            onTripSelect={setSelectedTripId}
            height="100%"
            showRoutes={true}
            userRole="driver"
          />

          {selectedTrip && (
            <div className={styles.mapOverlay}>
              <div className={styles.selectedTripInfo}>
                <h3>🚌 {selectedTrip.bus?.plateNumber || 'N/A'}</h3>
                <p><strong>Tuyến:</strong> {selectedTrip.route?.name || 'N/A'}</p>
                <p><strong>Từ:</strong> {selectedTrip.route?.department || 'N/A'}</p>
                <p><strong>Đến:</strong> {selectedTrip.route?.arrival || 'N/A'}</p>
                <p><strong>Khởi hành:</strong> {selectedTrip.departureTime || 'N/A'}</p>
                
                <div className={styles.progressSection}>
                  <p><strong>Tiến độ:</strong> {(selectedTrip.progress || 0).toFixed(1)}%</p>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${selectedTrip.progress || 0}%` }}
                    />
                  </div>
                </div>

                {selectedTrip.nextStop && (
                  <div className={styles.nextStop}>
                    <p><strong>📍 Trạm tiếp theo:</strong></p>
                    <p>{selectedTrip.nextStop.name}</p>
                    <p className={styles.distance}>
                      {(selectedTrip.nextStop.distance || 0).toFixed(1)} km
                    </p>
                  </div>
                )}

                {selectedTrip.stops && selectedTrip.stops.length > 0 && (
                  <div className={styles.stopsInfo}>
                    <p><strong>📋 Danh sách trạm ({selectedTrip.stops.length}):</strong></p>
                    <div className={styles.stopsList}>
                      {selectedTrip.stops
                        .sort((a, b) => a.order - b.order)
                        .map((stop) => (
                          <div key={stop.stopId} className={styles.stopItem}>
                            <span className={styles.stopOrder}>{stop.order}</span>
                            <span className={styles.stopName}>{stop.name}</span>
                            {stop.estimatedTime && (
                              <span className={styles.stopTime}>{stop.estimatedTime}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
