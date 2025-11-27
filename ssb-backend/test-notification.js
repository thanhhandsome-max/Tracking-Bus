/**
 * 🔔 TEST NOTIFICATION TOOL
 * 
 * Công cụ kiểm tra hệ thống thông báo
 * Gửi thông báo test đến user/role cụ thể
 * 
 * Usage:
 * node test-notification.js <type> <target>
 * 
 * Examples:
 * node test-notification.js user 5        # Gửi đến user ID 5
 * node test-notification.js role phu_huynh # Gửi đến tất cả phụ huynh
 * node test-notification.js role quan_tri  # Gửi đến tất cả admin
 */

import { io as ioClient } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:4000';

// Lấy args từ command line
const [, , type, target] = process.argv;

if (!type || !target) {
  console.error('❌ Usage: node test-notification.js <user|role> <id|role_name>');
  console.error('   Examples:');
  console.error('     node test-notification.js user 5');
  console.error('     node test-notification.js role phu_huynh');
  console.error('     node test-notification.js role quan_tri');
  process.exit(1);
}

// Admin token (lấy từ database hoặc login response)
const ADMIN_TOKEN = process.env.ADMIN_TEST_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';

console.log('🔔 NOTIFICATION TESTING TOOL');
console.log('─────────────────────────────────────');
console.log(`Type: ${type}`);
console.log(`Target: ${target}`);
console.log(`Socket URL: ${SOCKET_URL}`);
console.log('─────────────────────────────────────\n');

// Connect to Socket.IO server
const socket = ioClient(SOCKET_URL, {
  auth: { token: ADMIN_TOKEN },
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  console.log(`Socket ID: ${socket.id}\n`);
  
  // Tạo test notification
  const notification = {
    tieuDe: '🧪 Test Notification',
    noiDung: `Đây là thông báo TEST gửi lúc ${new Date().toLocaleTimeString('vi-VN')}. Nếu bạn thấy thông báo này, hệ thống hoạt động BÌNH THƯỜNG! ✅`,
    loaiThongBao: 'test_notification',
    thoiGianTao: new Date().toISOString(),
  };
  
  // Emit notification:new đến room
  const room = type === 'user' ? `user-${target}` : `role-${target}`;
  
  console.log(`📤 Sending test notification to room: ${room}`);
  console.log(`📋 Notification:`, notification);
  console.log('');
  
  // Emit to specific room
  socket.emit('broadcast_to_room', {
    room,
    event: 'notification:new',
    data: notification,
  });
  
  console.log('✅ Test notification sent!');
  console.log('');
  console.log('📊 Check the following:');
  console.log('  1. Backend console - Should show socket connection');
  console.log('  2. Frontend console - Should show "notification:new" event');
  console.log('  3. Frontend UI - Should display notification');
  console.log('');
  
  // Keep alive for 3 seconds then disconnect
  setTimeout(() => {
    console.log('👋 Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('');
  console.error('💡 Tips:');
  console.error('  - Check if backend server is running');
  console.error('  - Verify SOCKET_URL in .env');
  console.error('  - Make sure ADMIN_TEST_TOKEN is valid');
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log(`🔌 Disconnected: ${reason}`);
});
