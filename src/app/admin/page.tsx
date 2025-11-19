"use client";
import React, { useState } from 'react';
import AdminUserManagement from '@/components/AdminUserManagement';
import AdminDriverManagement from '@/components/AdminDriverManagement';
import AdminParentManagement from '@/components/AdminParentManagement';
import AdminRouteManagement from '@/components/AdminRouteManagement';
import AdminStopManagement from '@/components/AdminStopManagement';
import AdminBusManagement from '@/components/AdminBusManagement';
import AdminDriverStatistics from '@/components/AdminDriverStatistics';
import styles from './page.module.css';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'drivers' | 'parents' | 'routes' | 'stops' | 'buses' | 'driver-stats'>('users');

  return (
    <div className={styles.dashboard}>
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <h2>Admin Panel</h2>
        </div>
        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Quản lý User
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'drivers' ? styles.active : ''}`}
            onClick={() => setActiveTab('drivers')}
          >
            🚌 Quản lý Tài xế
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'parents' ? styles.active : ''}`}
            onClick={() => setActiveTab('parents')}
          >
            👨‍👩‍👧 Quản lý Phụ huynh
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'routes' ? styles.active : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            🗺️ Quản lý Tuyến xe
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'stops' ? styles.active : ''}`}
            onClick={() => setActiveTab('stops')}
          >
            📍 Quản lý Trạm
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'buses' ? styles.active : ''}`}
            onClick={() => setActiveTab('buses')}
          >
            🚍 Quản lý Xe
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'driver-stats' ? styles.active : ''}`}
            onClick={() => setActiveTab('driver-stats')}
          >
            📊 Thống kê Tài xế
          </button>
        </nav>
      </div>

      <div className={styles.content}>
        {activeTab === 'users' && <AdminUserManagement />}
        {activeTab === 'drivers' && <AdminDriverManagement />}
        {activeTab === 'parents' && <AdminParentManagement />}
        {activeTab === 'routes' && <AdminRouteManagement />}
        {activeTab === 'stops' && <AdminStopManagement />}
        {activeTab === 'buses' && <AdminBusManagement />}
        {activeTab === 'driver-stats' && <AdminDriverStatistics />}
      </div>
    </div>
  );
};

export default AdminDashboard;
