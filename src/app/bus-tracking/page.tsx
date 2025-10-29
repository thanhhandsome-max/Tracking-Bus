// src/app/bus-tracking/page.tsx
'use client';

import { useState } from 'react';
import MapView from '@/components/MapView';
import { useRealtimeBusTracking, BusLocationData } from '@/hooks/useRealtimeBusTracking';
import styles from './page.module.css';

export default function BusTrackingPage() {
  const { buses, isConnected, error, reconnect } = useRealtimeBusTracking({
    interval: 3000, // Update mỗi 3 giây
  });

  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  // Convert bus data sang format cho MapView
  const busLocations = buses.map((bus) => ({
    latitude: bus.location.coordinates[1],
    longitude: bus.location.coordinates[0],
    plateNumber: bus.bus.plateNumber,
    speed: bus.speed,
    timestamp: bus.timestamp,
  }));

  // Lấy bus được chọn hoặc bus đầu tiên
  const currentBusLocation =
    selectedBusId
      ? busLocations.find((b) => buses.find(bus => bus.busId === selectedBusId && bus.bus.plateNumber === b.plateNumber))
      : busLocations[0];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🚌 Real-time Bus Tracking</h1>
        <div className={styles.status}>
          <span className={`${styles.indicator} ${isConnected ? styles.connected : styles.disconnected}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          {!isConnected && (
            <button onClick={reconnect} className={styles.reconnectBtn}>
              Reconnect
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}

      <div className={styles.content}>
        {/* Sidebar với danh sách xe bus */}
        <aside className={styles.sidebar}>
          <h2>Active Buses ({buses.length})</h2>
          <div className={styles.busList}>
            {buses.length === 0 ? (
              <p className={styles.noBuses}>
                {isConnected
                  ? 'No active buses at the moment'
                  : 'Connecting to server...'}
              </p>
            ) : (
              buses.map((bus) => (
                <div
                  key={bus.busId}
                  className={`${styles.busCard} ${
                    selectedBusId === bus.busId ? styles.selected : ''
                  }`}
                  onClick={() => setSelectedBusId(bus.busId)}
                >
                  <div className={styles.busHeader}>
                    <span className={styles.plateNumber}>
                      🚌 {bus.bus.plateNumber}
                    </span>
                    <span className={styles.speed}>
                      {bus.speed.toFixed(1)} km/h
                    </span>
                  </div>
                  <div className={styles.busDetails}>
                    <span>Capacity: {bus.bus.capacity}</span>
                    <span className={`${styles.status} ${styles[bus.bus.status]}`}>
                      {bus.bus.status}
                    </span>
                  </div>
                  <div className={styles.location}>
                    📍 {bus.location.coordinates[1].toFixed(6)}, {bus.location.coordinates[0].toFixed(6)}
                  </div>
                  <div className={styles.timestamp}>
                    🕒 {new Date(bus.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Map */}
        <main className={styles.mapContainer}>
          <MapView
            stops={[]} // Không có stops cố định
            height="100%"
            showRoute={false}
            useRealRouting={false}
            busLocation={currentBusLocation}
            showBus={!!currentBusLocation}
          />
          
          {currentBusLocation && (
            <div className={styles.mapOverlay}>
              <div className={styles.currentBus}>
                <h3>Tracking: {currentBusLocation.plateNumber}</h3>
                <p>Speed: {currentBusLocation.speed.toFixed(1)} km/h</p>
                <p>Last update: {new Date(currentBusLocation.timestamp).toLocaleString()}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
