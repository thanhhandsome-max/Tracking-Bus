'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserProfileModal from '../../components/UserProfileModal';
import styles from './Header.module.css';

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
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Logo và tên ứng dụng */}
          <div className={styles.logoSection}>
            <div className={styles.logoCircle}>
              <span className={styles.logoText}>SB</span>
            </div>
            <div className={styles.appInfo}>
              <h1>SchoolBus</h1>
              <p>hệ thống quản lý đưa đón học sinh</p>
            </div>
          </div>

          {/* Thông tin người dùng - Clickable */}
          <div 
            onClick={() => setIsProfileOpen(true)}
            className={styles.userSection}
          >
            <div className={styles.userInfo}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userRole}>{displayRole}</p>
            </div>
            <div className={styles.userAvatar}>
              <span className={styles.avatarText}>PH</span>
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
