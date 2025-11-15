'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerGrid}>
          {/* Company Info */}
          <div className={styles.footerSection}>
            <h3>SchoolBus</h3>
            <p>
              Hệ thống quản lý và theo dõi xe buýt đưa đón học sinh an toàn, hiệu quả
            </p>
          </div>

          {/* Quick Links */}
          <div className={styles.footerSection}>
            <h4>Liên kết nhanh</h4>
            <ul className={styles.footerLinks}>
              <li>
                <Link href="/">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/multi-trip-tracking">
                  Theo dõi xe
                </Link>
              </li>
              <li>
                <Link href="/history">
                  Lịch sử
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className={styles.footerSection}>
            <h4>Liên hệ</h4>
            <ul className={styles.contactInfo}>
              <li>Email: support@schoolbus.com</li>
              <li>Điện thoại: 1900 xxxx</li>
              <li>Địa chỉ: Thành phố Hồ Chí Minh</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.footerBottom}>
          <p className={styles.footerText}>
            © {currentYear} SchoolBus. Tất cả quyền được bảo lưu.
          </p>
          <div className={styles.footerLinks2}>
            <a href="#">
              Chính sách bảo mật
            </a>
            <span className={styles.separator}>•</span>
            <a href="#">
              Điều khoản sử dụng
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
