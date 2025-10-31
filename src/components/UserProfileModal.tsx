'use client';

import React, { useState } from 'react';
import ParentProfileTab from './ParentProfileTab';
import StudentManagementTab from './StudentManagementTab';
import TicketsTab from './TicketsTab';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: string;
  parentId?: string;
  onLogout?: () => void;
}

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  userName = "Phụ huynh", 
  userRole,
  parentId = 'temp-id',
  onLogout
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'students' | 'tickets'>('profile');

  if (!isOpen) return null;

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
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              Hồ sơ người dùng
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
              {userName} {userRole && `- ${userRole}`}
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

        {/* Main Content với Tabs bên trái */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* Tabs sidebar bên trái */}
          <div style={{
            width: '240px',
            borderRight: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* Navigation tabs */}
            <div style={{ padding: '1rem 0' }}>
              <button
                onClick={() => setActiveTab('profile')}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  border: 'none',
                  backgroundColor: activeTab === 'profile' ? 'white' : 'transparent',
                  borderLeft: activeTab === 'profile' ? '3px solid #2563eb' : '3px solid transparent',
                  color: activeTab === 'profile' ? '#2563eb' : '#6b7280',
                  fontWeight: activeTab === 'profile' ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'profile') {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'profile') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Thông tin phụ huynh
              </button>
              <button
                onClick={() => setActiveTab('students')}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  border: 'none',
                  backgroundColor: activeTab === 'students' ? 'white' : 'transparent',
                  borderLeft: activeTab === 'students' ? '3px solid #2563eb' : '3px solid transparent',
                  color: activeTab === 'students' ? '#2563eb' : '#6b7280',
                  fontWeight: activeTab === 'students' ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'students') {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'students') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Quản lý học sinh
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  border: 'none',
                  backgroundColor: activeTab === 'tickets' ? 'white' : 'transparent',
                  borderLeft: activeTab === 'tickets' ? '3px solid #2563eb' : '3px solid transparent',
                  color: activeTab === 'tickets' ? '#2563eb' : '#6b7280',
                  fontWeight: activeTab === 'tickets' ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'tickets') {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'tickets') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Quản lý vé
              </button>
            </div>

            {/* Logout button */}
            <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                    if (onLogout) {
                      onLogout();
                    }
                    onClose();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fecaca';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fee2e2';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>

          {/* Content với fade transition */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '1.5rem',
            backgroundColor: 'white',
            position: 'relative'
          }}>
            <div style={{
              animation: 'fadeIn 0.3s ease-in-out'
            }}>
              {activeTab === 'profile' && <ParentProfileTab parentId={parentId} />}
              {activeTab === 'students' && <StudentManagementTab parentId={parentId} />}
              {activeTab === 'tickets' && <TicketsTab />}
            </div>
          </div>
        </div>
        
        {/* Add keyframes for fade animation */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
