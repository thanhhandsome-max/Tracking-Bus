/**
 * 🔔 SIMPLE NOTIFICATION TEST
 * 
 * Test notification bằng cách emit trực tiếp từ backend server
 * Chạy script này trong môi trường backend đang chạy
 */

import { getIO } from './src/ws/index.js';

console.log('🔔 TESTING NOTIFICATION SYSTEM');
console.log('═══════════════════════════════════════\n');

// Get Socket.IO instance
const io = getIO();

if (!io) {
  console.error('❌ Socket.IO instance not found!');
  console.error('   Make sure backend server is running');
  process.exit(1);
}

console.log('✅ Socket.IO instance found\n');

// Test 1: Gửi đến role-quan_tri
console.log('📤 Test 1: Sending to role-quan_tri');
io.to('role-quan_tri').emit('notification:new', {
  tieuDe: '🧪 Test Admin Notification',
  noiDung: 'Đây là thông báo test cho ADMIN. Nếu thấy => Hệ thống OK! ✅',
  loaiThongBao: 'test',
  thoiGianTao: new Date().toISOString(),
});
console.log('✅ Sent to role-quan_tri\n');

// Test 2: Gửi đến role-phu_huynh  
console.log('📤 Test 2: Sending to role-phu_huynh');
io.to('role-phu_huynh').emit('notification:new', {
  tieuDe: '🧪 Test Parent Notification',
  noiDung: 'Đây là thông báo test cho PHỤ HUYNH. Nếu thấy => Hệ thống OK! ✅',
  loaiThongBao: 'test',
  thoiGianTao: new Date().toISOString(),
});
console.log('✅ Sent to role-phu_huynh\n');

// Test 3: Gửi đến user-1 (giả sử user ID 1 tồn tại)
console.log('📤 Test 3: Sending to user-1');
io.to('user-1').emit('notification:new', {
  tieuDe: '🧪 Test User Notification',
  noiDung: 'Đây là thông báo test cho USER ID=1. Nếu thấy => Hệ thống OK! ✅',
  loaiThongBao: 'test',
  thoiGianTao: new Date().toISOString(),
});
console.log('✅ Sent to user-1\n');

console.log('═══════════════════════════════════════');
console.log('✅ All test notifications sent!');
console.log('');
console.log('📊 CHECK THE FOLLOWING:');
console.log('  1. Frontend console - Search for "🔔 [SOCKET DEBUG]"');
console.log('  2. Notification page - Should see 3 test notifications');
console.log('  3. If NOT seeing notifications:');
console.log('     - Check Socket.IO connection (frontend console)');
console.log('     - Check if user joined correct rooms (backend console)');
console.log('     - Check browser console for errors');
console.log('');
console.log('💡 TIP: Open browser DevTools > Console before running this');
