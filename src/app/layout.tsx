import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./header";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SchoolBus - Hệ thống quản lý đưa đón học sinh",
  description: "Ứng dụng theo dõi và quản lý xe buýt đưa đón học sinh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ margin: 0, padding: 0 }}
      >
        {/* Header sẽ xuất hiện ở tất cả các trang */}
        <Header />
        
        {/* Navigation sẽ xuất hiện ở tất cả các trang - tự động detect active tab */}
        <Navigation />
        
        {/* Content của từng trang sẽ render ở đây */}
        <main style={{
          minHeight: 'calc(100vh - 200px)',
          backgroundColor: '#f9fafb'
        }}>
          {children}
        </main>
        
        {/* Footer */}
        <footer style={{
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          marginTop: '3rem'
        }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '1.5rem 1rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            <p style={{ margin: 0 }}>&copy; 2025 SchoolBus - Hệ thống quản lý đưa đón học sinh</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
