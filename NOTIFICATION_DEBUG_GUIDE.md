# 🔔 NOTIFICATION DEBUGGING GUIDE

## 📋 Overview
Hướng dẫn kiểm tra và debug hệ thống thông báo cho Admin và Phụ huynh.

## 🎯 Các loại thông báo

### 1. Thông báo cho ADMIN (`role-quan_tri`)
- ✅ `trip_started` - Chuyến đi bắt đầu
- ✅ `delay_alert` - Xe trễ hơn dự kiến
- ✅ `su_co` - Sự cố được báo cáo

### 2. Thông báo cho PHỤ HUYNH (`role-phu_huynh` hoặc `user-{parentId}`)
- ✅ `student_checkin` / `student_pickup` - Con đã lên xe
- ✅ `student_checkout` - Con đã xuống xe
- ✅ `student_absent` - Con vắng mặt
- ✅ `delay_alert` - Xe trễ hơn dự kiến
- ✅ `chuyen_di` - Thông báo chuyến đi

---

## 🔍 DEBUGGING STEPS

### Step 1: Kiểm tra Backend Console

Khi backend khởi động, bạn phải thấy:
```
✅ Socket.IO initialized on port 4000
✅ Authentication middleware registered
```

Khi user kết nối (login), phải thấy:
```
🟢 Client connected: user@example.com (phu_huynh) - Socket ID: abc123
  ✅ Joined room: user-5
  📋 User info: ID=5, Email=user@example.com, Role=phu_huynh
  ✅ Joined role room: role-phu_huynh
  📍 All rooms for this socket: [ 'abc123', 'user-5', 'role-phu_huynh' ]
```

**Nếu KHÔNG thấy → Socket.IO chưa kết nối → Kiểm tra frontend**

### Step 2: Kiểm tra Frontend Console

Mở Browser DevTools (F12) → Console tab

Khi login thành công, phải thấy:
```
Socket.IO connected
```

Nếu KHÔNG thấy → Kiểm tra:
- Backend có chạy? (`http://localhost:4000`)
- Token có đúng không?
- CORS có bật không?

### Step 3: Test Gửi Thông Báo

#### Test 1: Đón học sinh (checkinStudent)
1. Vào trang Driver → Trip Detail
2. Click "Đón" một học sinh
3. **Backend console phải hiển thị:**
```
🔔 [CHECKIN DEBUG] Emitting student_pickup notification
   Student: Nguyễn Văn A (ID: 123)
   Parent ID: 5
   Room: user-5
   Trip: #16
   Bus: 29B-12345
✅ Sent checkin notification to parent 5
```

4. **Frontend console (parent) phải hiển thị:**
```
🔔 [SOCKET DEBUG] Received notification:new event: { tieuDe: 'Con đã lên xe', ... }
   Type: student_checkin
   Title: Con đã lên xe
   Content: Nguyễn Văn A đã được đón lên xe buýt 29B-12345...
✅ [SOCKET DEBUG] Dispatched notificationNew custom event
```

5. **Trang Notifications (parent) phải hiển thị:**
```
🔔 [PARENT NOTIF DEBUG] Received notification: { ... }
✅ [PARENT NOTIF DEBUG] Added to list: { id: ..., title: 'Con đã lên xe', ... }
```

#### Test 2: Trễ (delay_alert)
1. Vào trang Driver → Trip Detail
2. Gửi GPS position (xe phải trễ > 5 phút)
3. **Backend console:**
```
🔔 [DELAY DEBUG] Emitting delay_alert to ADMIN
   Room: role-quan_tri
   Admin count: 2
   Trip: #16
   Delay: 12 minutes
✅ Sent delay notification to 2 admins

🔔 [DELAY DEBUG] Emitting delay_alert to 3 PARENTS
   Emitting to parent room: user-5
   Emitting to parent room: user-7
   Emitting to parent room: user-9
✅ Sent delay notification to 3 parents
```

4. **Frontend console (admin/parent) phải thấy notification**

---

## 🛠️ TEST TOOLS

### Tool 1: Manual Test Notification (từ backend đang chạy)

```bash
cd ssb-backend
node send-test-notification.js
```

Script này sẽ gửi 3 test notifications:
- 1 cho Admin
- 1 cho Parents
- 1 cho User ID=1

Mở browser console TRƯỚC KHI chạy script!

### Tool 2: Check Socket Rooms (Backend Console)

Thêm logging vào `ws/index.js` để xem rooms:

```javascript
// Trong event 'connection'
setInterval(() => {
  const rooms = Array.from(io.sockets.adapter.rooms.keys());
  console.log('📍 Active rooms:', rooms);
}, 30000); // Log mỗi 30s
```

---

## ❌ COMMON ISSUES & FIXES

### Issue 1: "Socket.IO not connected"
**Triệu chứng:** Frontend console không thấy "Socket.IO connected"

**Nguyên nhân:**
- Backend chưa chạy
- Token không hợp lệ
- CORS bị block

**Fix:**
```bash
# Kiểm tra backend
cd ssb-backend
npm run dev

# Kiểm tra frontend
cd ssb-frontend
npm run dev

# Kiểm tra token
# Mở browser DevTools > Application > Local Storage > token
```

### Issue 2: "Notifications not received"
**Triệu chứng:** Backend emit OK nhưng frontend không nhận

**Nguyên nhân:**
- User chưa join room đúng
- Frontend không listen event `notification:new`
- Window event listener chưa được setup

**Fix:**
1. Kiểm tra backend console → User phải join room `user-{id}` hoặc `role-{role}`
2. Kiểm tra frontend socket.ts → Phải có `socket.on('notification:new', ...)`
3. Kiểm tra page → Phải có `window.addEventListener('notificationNew', ...)`

### Issue 3: "Rooms not joined"
**Triệu chứng:** Backend console không thấy "Joined room: user-X"

**Nguyên nhân:**
- Socket.IO middleware authentication failed
- User object không có userId hoặc vaiTro

**Fix:**
```javascript
// Kiểm tra ws/index.js middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const user = await verifyWsJWT(token);
    
    // ✅ PHẢI CÓ userId và vaiTro
    console.log('User object:', user); 
    
    socket.data.user = user;
    next();
  } catch (error) {
    console.error('Auth failed:', error);
    next(new Error('Authentication failed'));
  }
});
```

---

## 📊 MONITORING CHECKLIST

Khi test thông báo, kiểm tra theo thứ tự:

### ✅ Backend
- [ ] Socket.IO server khởi động (`✅ Socket.IO initialized`)
- [ ] User kết nối thành công (`🟢 Client connected`)
- [ ] User join rooms (`✅ Joined room: user-X`)
- [ ] Emit notification events (`🔔 [DEBUG] Emitting...`)
- [ ] Không có error trong console

### ✅ Frontend Socket
- [ ] Socket connected (`Socket.IO connected`)
- [ ] Listen event `notification:new` (`🔔 [SOCKET DEBUG] Received...`)
- [ ] Dispatch custom event (`✅ [SOCKET DEBUG] Dispatched...`)
- [ ] Không có connection error

### ✅ Frontend UI
- [ ] Window event listener hoạt động (`🔔 [PARENT NOTIF DEBUG] Received`)
- [ ] Notification được thêm vào list (`✅ [PARENT NOTIF DEBUG] Added to list`)
- [ ] UI hiển thị notification
- [ ] Click notification hoạt động

---

## 🎓 BEST PRACTICES

1. **Luôn mở Console trước khi test**
   - Backend console để xem emit events
   - Frontend console để xem receive events

2. **Test từng bước**
   - Test socket connection trước
   - Test join rooms
   - Test emit/receive events
   - Test UI display

3. **Sử dụng logging đầy đủ**
   - Backend: `console.log` cho mọi emit
   - Frontend: `console.log` cho mọi receive
   - UI: `console.log` khi update state

4. **Tránh spam notifications**
   - Đặt rate limit (đã có: DELAY_ALERT_INTERVAL_MS = 3 phút)
   - Chỉ gửi một lần cho mỗi event quan trọng

---

## 🚀 NEXT STEPS

Nếu sau khi debug vẫn không hoạt động:

1. Kiểm tra database `ThongBao` table → Có record không?
2. Kiểm tra API `/api/auth/profile` → User có đúng role không?
3. Kiểm tra Socket.IO rooms → `io.sockets.adapter.rooms`
4. Test với tool `send-test-notification.js`
5. Kiểm tra network tab → WebSocket connection status

---

## 📞 SUPPORT

Nếu cần hỗ trợ:
1. Copy toàn bộ backend console log
2. Copy toàn bộ frontend console log
3. Screenshot network tab (WebSocket connection)
4. Mô tả chi tiết bước reproduce bug
