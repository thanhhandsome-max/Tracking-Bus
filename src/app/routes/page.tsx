'use client';

import { useState } from 'react';
import MapView from '../../components/MapView';
import styles from './page.module.css';

interface Route {
  id: string;
  name: string;
  description: string;
  busNumber: string;
  driverName: string;
  studentCount: number;
  stops: Array<{
    name: string;
    lat: number;
    lng: number;
    time?: string;
    type?: 'pickup' | 'dropoff' | 'stop';
  }>;
}

export default function RoutesPage() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Mock data cho các tuyến đường
  const routes: Route[] = [
    {
      id: '1',
      name: 'Tuyến 1 - Quận 1',
      description: 'Đưa đón học sinh khu vực Quận 1 và các khu vực lân cận',
      busNumber: '59A-12345',
      driverName: 'Nguyễn Văn A',
      studentCount: 15,
      stops: [
        { name: 'Trường THPT ABC', lat: 10.762622, lng: 106.660172, type: 'pickup' },
        { name: 'Bến xe Miền Đông', lat: 10.768000, lng: 106.668000, type: 'stop' },
        { name: 'Công viên Tao Đàn', lat: 10.774000, lng: 106.676000, type: 'stop' },
        { name: 'Chợ Bến Thành', lat: 10.780000, lng: 106.684000, type: 'dropoff' }
      ]
    },
    {
      id: '2',
      name: 'Tuyến 2 - Quận 3',
      description: 'Đưa đón học sinh khu vực Quận 3, Bình Thạnh',
      busNumber: '59B-67890',
      driverName: 'Trần Văn B',
      studentCount: 18,
      stops: [
        { name: 'Trường THPT XYZ', lat: 10.782000, lng: 106.690000, type: 'pickup' },
        { name: 'Công viên Lê Văn Tám', lat: 10.788000, lng: 106.698000, type: 'stop' },
        { name: 'Siêu thị Co.opmart', lat: 10.794000, lng: 106.706000, type: 'stop' },
        { name: 'Nhà văn hóa Q3', lat: 10.800000, lng: 106.714000, type: 'dropoff' }
      ]
    },
    {
      id: '3',
      name: 'Tuyến 3 - Quận 5',
      description: 'Đưa đón học sinh khu vực Quận 5, Quận 6',
      busNumber: '59C-11223',
      driverName: 'Lê Văn C',
      studentCount: 12,
      stops: [
        { name: 'Trường THPT DEF', lat: 10.755000, lng: 106.650000, type: 'pickup' },
        { name: 'Chợ An Đông', lat: 10.761000, lng: 106.658000, type: 'stop' },
        { name: 'Bệnh viện Chợ Rẫy', lat: 10.767000, lng: 106.666000, type: 'stop' },
        { name: 'KDC An Lạc', lat: 10.773000, lng: 106.674000, type: 'dropoff' }
      ]
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🚌 Tuyến xe</h1>
        <p>Quản lý và theo dõi các tuyến đường xe buýt đưa đón học sinh</p>
      </div>

      <div className={`${styles.grid} ${selectedRoute ? styles.withMap : ''}`}>
        {/* Route List */}
        <div className={styles.routeList}>
          <div className={styles.routeListCard}>
            <h2>Danh sách tuyến ({routes.length})</h2>
            
            <div className={styles.routeItems}>
              {routes.map((route) => (
                <div
                  key={route.id}
                  className={`${styles.routeItem} ${selectedRoute?.id === route.id ? styles.active : ''}`}
                  onClick={() => setSelectedRoute(route)}
                >
                  <h3>{route.name}</h3>
                  <p>{route.description}</p>
                  <div className={styles.routeItemMeta}>
                    <span>🚌 {route.busNumber}</span>
                    <span>👨‍✈️ {route.driverName}</span>
                    <span>👥 {route.studentCount} HS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map View */}
        {selectedRoute && (
          <div className={styles.mapContainer}>
            <div className={styles.mapHeader}>
              <div>
                <h2>{selectedRoute.name}</h2>
                <p>{selectedRoute.stops.length} điểm dừng</p>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedRoute(null)}
              >
                Đóng bản đồ
              </button>
            </div>

            <MapView
              stops={selectedRoute.stops}
              height="550px"
              showRoute={true}
              useRealRouting={true}
            />
          </div>
        )}
      </div>

      {/* Empty State */}
      {!selectedRoute && (
        <div className={styles.emptyState}>
          <svg
            className={styles.emptyIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <h3>Chọn tuyến để xem bản đồ</h3>
          <p>Nhấn vào một tuyến bên trái để xem lộ trình chi tiết trên bản đồ</p>
        </div>
      )}
    </div>
  );
}
