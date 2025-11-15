'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import Header from "@/app/header/Header";
import Navigation from "@/components/Navigation";
import Footer from "@/app/footer/Footer";
import styles from "./layout.module.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");
  const isLoginPage = pathname.startsWith("/login");

  return (
    <html lang="vi">
      <head>
        <title>SchoolBus - Hệ thống quản lý đưa đón học sinh</title>
        <meta name="description" content="Ứng dụng theo dõi và quản lý xe buýt đưa đón học sinh" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased ${styles.layout}`}>
        {/* Chỉ hiển thị Header và Navigation trên các trang không phải admin và login */}
        {!isAdminPage && !isLoginPage && <Header />}
        {!isAdminPage && !isLoginPage && <Navigation />}

        {/* Main content */}
        <main className={styles.main}>
          {children}
        </main>

        {/* Chỉ hiển thị Footer trên các trang không phải admin và login */}
        {!isAdminPage && !isLoginPage && <Footer />}
      </body>
    </html>
  );
}
