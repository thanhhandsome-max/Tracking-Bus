'use client';

import React from 'react';

export default function TicketsTab() {
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
        Quản lý vé
      </h2>
      
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <svg
          style={{ margin: '0 auto', marginBottom: '1rem' }}
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 3v4M8 3v4M2 11h20" />
        </svg>
        
        <p style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          color: '#4b5563',
          marginBottom: '0.5rem'
        }}>
          Chức năng đang phát triển
        </p>
        
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          Tính năng quản lý vé và thanh toán đang được phát triển. Vui lòng quay lại sau!
        </p>
      </div>
    </div>
  );
}
