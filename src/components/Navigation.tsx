'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';

interface NavItem {
  label: string;
  href: string;
}

interface NavigationProps {
  items?: NavItem[];
}

export default function Navigation({ 
  items = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Theo dõi xe', href: '/multi-trip-tracking' },
    { label: 'Tuyến đường', href: '/routes' },
    { label: 'Lịch sử', href: '/history' },
    { label: 'Tin nhắn', href: '/messages' },
    { label: 'Thông báo', href: '/notifications' },
  ],
}: NavigationProps) {
  const pathname = usePathname(); // Lấy đường dẫn hiện tại

  return (
    <nav className={styles.nav}>
      <div className={styles.navContainer}>
        <ul className={styles.navList}>
          {items.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
