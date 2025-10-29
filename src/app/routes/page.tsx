'use client';

import { useState } from 'react';
import MapView from '../../components/MapView';

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
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '1.5rem 1rem'
    }}>
      <div style={{
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          color: '#1f2937'
        }}>
          🚌 Tuyến xe
        </h1>
        <p style={{ color: '#6b7280' }}>
          Quản lý và theo dõi các tuyến đường xe buýt đưa đón học sinh
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedRoute ? '350px 1fr' : '1fr',
        gap: '1.5rem'
      }}>
        {/* Route List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#1f2937'
            }}>
              Danh sách tuyến ({routes.length})
            </h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {routes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: selectedRoute?.id === route.id 
                      ? '2px solid #3b82f6' 
                      : '2px solid #e5e7eb',
                    backgroundColor: selectedRoute?.id === route.id 
                      ? '#eff6ff' 
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRoute?.id !== route.id) {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRoute?.id !== route.id) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '0.5rem'
                  }}>
                    {route.name}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '0.75rem'
                  }}>
                    {route.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
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
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            minHeight: '600px'
          }}>
            <div style={{
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '0.25rem'
                }}>
                  {selectedRoute.name}
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  {selectedRoute.stops.length} điểm dừng
                </p>
              </div>
              <button
                onClick={() => setSelectedRoute(null)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
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
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '3rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <svg
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1rem',
              color: '#9ca3af'
            }}
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
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Chọn tuyến để xem bản đồ
          </h3>
          <p style={{
            color: '#6b7280'
          }}>
            Nhấn vào một tuyến bên trái để xem lộ trình chi tiết trên bản đồ
          </p>
        </div>
      )}
    </div>
  );
}
