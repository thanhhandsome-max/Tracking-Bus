'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserProfileModal from '../../components/UserProfileModal';

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

export default function Header({ userName, userRole }: HeaderProps) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState(userName || "Phụ huynh");
  const [displayRole, setDisplayRole] = useState(userRole || "");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setDisplayName(user.name || "Phụ huynh");
      setUserId(user._id || "");
      
      // Set role from student info if available
      if (user.students && user.students.length > 0) {
        const student = user.students[0];
        setDisplayRole(`Lớp ${student.class} - ${student.school}`);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Force reload để clear tất cả state
    window.location.href = '/login';
  };

  return (
    <>
      <header style={{
        backgroundColor: '#6B8EF5',
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo và tên ứng dụng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <span style={{
                color: '#6B8EF5',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}>SB</span>
            </div>
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: 0
              }}>SchoolBus</h1>
              <p style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>hệ thống quản lý đưa đón học sinh</p>
            </div>
          </div>

          {/* Thông tin người dùng - Clickable */}
          <div 
            onClick={() => setIsProfileOpen(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ textAlign: 'right' }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                margin: 0
              }}>{displayName}</p>
              <p style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>{displayRole}</p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <span style={{
                color: '#6B8EF5',
                fontWeight: 'bold',
                fontSize: '1.125rem'
              }}>PH</span>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <UserProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={displayName}
        userRole={displayRole}
        parentId={userId}
        onLogout={handleLogout}
      />
    </>
  );
}
