'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    <nav style={{
      backgroundColor: '#1d4ed8',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      borderTop: '1px solid #3b82f6'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        <ul style={{
          display: 'flex',
          gap: '0.5rem',
          listStyle: 'none',
          margin: 0,
          padding: 0
        }}>
          {items.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '0.75rem 2rem',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    borderTopLeftRadius: '0.5rem',
                    borderTopRightRadius: '0.5rem',
                    backgroundColor: isActive ? 'white' : 'transparent',
                    color: isActive ? '#1d4ed8' : '#bfdbfe',
                    boxShadow: isActive ? '0 -2px 4px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
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
