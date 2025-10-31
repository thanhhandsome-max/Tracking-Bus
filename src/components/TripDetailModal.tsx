'use client';

import React, { useState } from 'react';
import MapView from './MapView';

interface TripDetail {
  id: string;
  studentName: string;
  avatar: string;
  pickupTime: string;
  dropoffTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: 'completed' | 'cancelled';
  direction: 'pickup' | 'dropoff';
  date: string;
  busNumber?: string;
  driverName?: string;
  route?: string;
  distance?: string;
  actualPickupTime?: string;
  actualDropoffTime?: string;
}

interface TripDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripDetail | null;
}

export default function TripDetailModal({ isOpen, onClose, trip }: TripDetailModalProps) {
  const [showMap, setShowMap] = useState(false);

  if (!isOpen || !trip) return null;

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Mock data cho bản đồ - trong thực tế sẽ lấy từ API
  const mockStops = [
    {
      name: trip.pickupAddress,
      lat: 10.762622,
      lng: 106.660172,
      time: trip.pickupTime,
      type: 'pickup' as const
    },
    {
      name: 'Điểm dừng 1',
      lat: 10.770000,
      lng: 106.670000,
      type: 'stop' as const
    },
    {
      name: trip.dropoffAddress,
      lat: 10.780000,
      lng: 106.680000,
      time: trip.dropoffTime,
      type: 'dropoff' as const
    }
  ];

  const mockBusLocation = trip.status === 'completed' ? undefined : {
    lat: 10.770000,
    lng: 106.670000
  };

  if (showMap) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => setShowMap(false)}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Map Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'white'
          }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Bản đồ lộ trình
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                {trip.studentName} - {formatDate(trip.date)}
              </p>
            </div>
            <button
              onClick={() => setShowMap(false)}
              style={{
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '0.5rem',
                width: '2rem',
                height: '2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          {/* Map Content */}
          <div style={{ padding: '1.5rem' }}>
            <MapView
              stops={mockStops}
              busLocation={mockBusLocation}
              height="600px"
              showRoute={true}
              useRealRouting={true}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 10
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              Chi tiết chuyến đi
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
              {formatDate(trip.date)} - {trip.direction === 'pickup' ? 'Đưa đi trường' : 'Đón về nhà'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '0.5rem',
              width: '2rem',
              height: '2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Student Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: '#e5e7eb',
              flexShrink: 0
            }}>
              <img
                src={trip.avatar}
                alt={trip.studentName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0,
                marginBottom: '0.25rem'
              }}>
                {trip.studentName}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0
              }}>
                Học sinh
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: trip.status === 'completed' ? '#d1fae5' : '#fee2e2',
            color: trip.status === 'completed' ? '#065f46' : '#991b1b',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '1.5rem'
          }}>
            {trip.status === 'completed' ? '✓' : '✗'} 
            {trip.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
          </div>

          {/* Trip Timeline */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Lộ trình chuyến đi
            </h4>

            <div style={{
              position: 'relative',
              paddingLeft: '2rem'
            }}>
              {/* Vertical Line */}
              <div style={{
                position: 'absolute',
                left: '0.75rem',
                top: '1.5rem',
                bottom: '1.5rem',
                width: '2px',
                backgroundColor: '#e5e7eb'
              }}></div>

              {/* Start Point */}
              <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <div style={{
                  position: 'absolute',
                  left: '-1.25rem',
                  top: '0.25rem',
                  width: '1rem',
                  height: '1rem',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  border: '2px solid white',
                  boxShadow: '0 0 0 2px #3b82f6'
                }}></div>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    {trip.pickupAddress}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Thời gian dự kiến: {trip.pickupTime}
                  </p>
                  {trip.actualPickupTime && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#10b981',
                      margin: 0
                    }}>
                      Thời gian thực tế: {trip.actualPickupTime}
                    </p>
                  )}
                </div>
              </div>

              {/* End Point */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '-1.25rem',
                  top: '0.25rem',
                  width: '1rem',
                  height: '1rem',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  border: '2px solid white',
                  boxShadow: '0 0 0 2px #10b981'
                }}></div>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    {trip.dropoffAddress}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Thời gian dự kiến: {trip.dropoffTime}
                  </p>
                  {trip.actualDropoffTime && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#10b981',
                      margin: 0
                    }}>
                      Thời gian thực tế: {trip.actualDropoffTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '0.75rem',
            padding: '1rem'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Thông tin chuyến đi
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  Số xe
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {trip.busNumber || '59A-12345'}
                </p>
              </div>

              <div>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  Tài xế
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {trip.driverName || 'Nguyễn Văn A'}
                </p>
              </div>

              <div>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  Tuyến đường
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {trip.route || 'Tuyến 01'}
                </p>
              </div>

              <div>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  Khoảng cách
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {trip.distance || '5.2 km'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1.5rem'
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#f3f4f6',
                color: '#1f2937',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
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
              Đóng
            </button>
            <button
              onClick={() => setShowMap(true)}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              📍 Xem trên bản đồ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
