# 🔔 Cải Tiến Hệ Thống Thông Báo - Smart School Bus

## 📋 Tổng Quan

Document này mô tả các cải tiến được thực hiện cho hệ thống thông báo của phụ huynh trong ứng dụng Smart School Bus Dashboard.

---

## ✅ Các Cải Tiến Đã Hoàn Thành

### 1. 📱 Thông Báo Dễ Nhìn Hơn Cho Phụ Huynh

#### **Frontend (ssb-frontend/app/parent/page.tsx)**

**Cải thiện Toast Notifications:**
```typescript
// ✅ Toast lớn hơn, bolder, duration lâu hơn
toast({
  title: title,
  description: content,
  variant: notifType === "warning" ? "destructive" : "default",
  duration: notifType === "warning" ? 10000 : 7000, // Cảnh báo hiển thị 10s
  className: notifType === "warning" 
    ? "text-lg font-bold border-2 border-red-500"  // Viền đỏ cho warning
    : "text-lg font-semibold",
});
```

**Cải thiện Notification Cards:**
```tsx
// ✅ Card lớn hơn, màu sắc rõ ràng, icon to hơn (12px → 16px)
<div className={`flex items-start gap-4 p-4 rounded-lg border-2 ${
  notification.type === "warning"
    ? "bg-orange-50 dark:bg-orange-950/20 border-orange-500"
    : notification.type === "success"
    ? "bg-green-50 dark:bg-green-950/20 border-green-500"
    : "bg-blue-50 dark:bg-blue-950/20 border-blue-500"
}`}>
  <Icon className="w-6 h-6" /> {/* Tăng từ w-4 h-4 */}
  <p className="text-base font-bold">{notification.title}</p>
</div>
```

**Badge Thông Báo Chưa Đọc:**
```tsx
{unreadCount > 0 && (
  <Badge variant="destructive" className="text-sm font-bold animate-pulse">
    {unreadCount} mới
  </Badge>
)}
```

---

### 2. ⚠️ Thông Báo Vắng Mặt

#### **Backend (ssb-backend/src/controllers/TripController.js)**

**Phương thức `markStudentAbsent()` đã được cải tiến:**

```javascript
// ✅ Thông báo với format rõ ràng, emoji, thời gian
await ThongBaoModel.createMultiple(
  [student.maPhuHuynh],
  "⚠️ Con vắng mặt",
  `⚠️ VẮNG MẶT\n\n${
    student.hoTen
  } không có mặt tại điểm đón lúc ${new Date().toLocaleTimeString('vi-VN')}.\n\n🚌 Xe: ${
    bus?.bienSoXe || "N/A"
  }\n🛣️ Tuyến: ${route?.tenTuyen || "N/A"}\n\n📞 Vui lòng liên hệ nhà trường nếu có thắc mắc.`,
  "student_absent"
);

// ✅ Emit WebSocket event
io.to(`user-${student.maPhuHuynh}`).emit("notification:new", {
  tieuDe: "⚠️ Con vắng mặt",
  noiDung: `${student.hoTen} không có mặt tại điểm đón.`,
  loaiThongBao: "student_absent",
  thoiGianTao: new Date().toISOString(),
});
```

**Khi nào được gửi:**
- Khi tài xế đánh dấu học sinh vắng mặt trên app driver
- Endpoint: `PUT /api/v1/trips/:id/students/:studentId/absent`

---

### 3. ✅ Thông Báo Đã Đón

#### **Backend (ssb-backend/src/controllers/TripController.js)**

**Phương thức `checkinStudent()` đã được cải tiến:**

```javascript
// ✅ Thông báo với format rõ ràng
await ThongBaoModel.createMultiple(
  [student.maPhuHuynh],
  "✅ Con đã lên xe",
  `✅ ĐÃ ĐÓN\n\n${student.hoTen} đã LÊN XE thành công lúc ${new Date().toLocaleTimeString('vi-VN')}.\n\n🚌 Xe: ${
    bus?.bienSoXe || "N/A"
  }\n🛣️ Tuyến: ${route?.tenTuyen || "N/A"}`,
  "student_pickup"
);

// ✅ Emit WebSocket event
io.to(`user-${student.maPhuHuynh}`).emit("notification:new", {
  tieuDe: "✅ Con đã lên xe",
  noiDung: `${student.hoTen} đã được đón lên xe thành công!`,
  loaiThongBao: "student_checkin",
  thoiGianTao: new Date().toISOString(),
});
```

**Khi nào được gửi:**
- Khi tài xế check-in học sinh trên app driver
- Endpoint: `POST /api/v1/trips/:id/students/:studentId/checkin`

---

### 4. 🚏 Thông Báo Xe Sắp Đến (60m)

#### **Backend (ssb-backend/src/services/telemetryService.js)**

**Geofence đã được cấu hình:**

```javascript
// ✅ Kiểm tra khoảng cách 60m (đã có từ trước)
const geofenceRadius = getGeofenceRadius(); // Default: 60m

if (distance <= geofenceRadius) {
  // ✅ Thông báo với format rõ ràng
  await ThongBaoModel.createMultiple({
    danhSachNguoiNhan: parentIds,
    tieuDe: "🚏 Xe sắp đến!",
    noiDung: `🚏 XE SẮP ĐẾN!\n\n📍 Điểm dừng: ${
      stop.tenDiem
    }\n📏 Cách: ${Math.round(distance)}m\n🚌 Tuyến: ${route?.tenTuyen || "N/A"}\n\n⏰ Con bạn sẽ được đón trong giây lát. Vui lòng chuẩn bị!`,
    loaiThongBao: "approach_stop",
  });
  
  // ✅ Emit WebSocket event
  io.to(`trip-${tripId}`).emit("approach_stop", eventData);
  
  for (const parentId of parentIds) {
    io.to(`user-${parentId}`).emit("notification:new", {
      tieuDe: "🚏 Xe sắp đến!",
      noiDung: `Xe buýt đang cách ${stop.tenDiem} ${Math.round(distance)}m.`,
      loaiThongBao: "approach_stop",
      thoiGianTao: new Date().toISOString(),
    });
  }
}
```

**Khi nào được gửi:**
- Tự động khi xe buýt đến gần điểm dừng (≤ 60m)
- Chỉ gửi cho phụ huynh có con ở điểm dừng đó
- Chỉ gửi 1 lần cho mỗi điểm dừng (anti-spam)

---

### 5. 📊 Phân Loại Báo Cáo: Trong Chuyến vs Ngoài Chuyến

#### **Backend (ssb-backend/src/controllers/TripController.js)**

**Phương thức `reportIncident()` đã được nâng cấp:**

```javascript
static async reportIncident(req, res) {
  const { loaiBaoCao = 'trong_chuyen' } = req.body; // 'trong_chuyen' hoặc 'ngoai_chuyen'
  
  // ✅ Phân loại báo cáo
  const reportTypeText = loaiBaoCao === 'ngoai_chuyen' 
    ? '📋 Báo cáo ngoài chuyến' 
    : '🚌 Báo cáo trong chuyến';
  
  // ✅ Thông báo cho phụ huynh
  const baseParentMessage = `${reportTypeText}\n🚨 Sự Cố: ${loaiSuCo}\n\n📍 Xe buýt tuyến ${
    route?.tenTuyen || "N/A"
  } (BKS: ${
    bus?.bienSoXe || "N/A"
  })\n\n⚠️ Chi tiết: ${moTa}\n\n📞 Vui lòng liên hệ nhà trường để biết thêm thông tin.`;
  
  // ✅ Thông báo cho admin
  await ThongBaoModel.createMultiple({
    danhSachNguoiNhan: adminIds,
    tieuDe: `${reportTypeText} - 🚨 ${loaiSuCo}`,
    noiDung: `${reportTypeText}\n🚌 Xe: ${
      bus?.bienSoXe || "N/A"
    }\n🛣️ Tuyến: ${route?.tenTuyen || "N/A"}\n⚠️ Sự cố: ${moTa}\n📍 Vị trí: ${
      viTri || "Chưa xác định"
    }${affectedNamesText}`,
    loaiThongBao: loaiBaoCao === 'ngoai_chuyen' ? 'incident_ngoai_chuyen' : 'trip_incident',
  });
}
```

**API Request:**

```json
{
  "loaiSuCo": "Xe hỏng",
  "moTa": "Xe bị thủng lốp trên đường",
  "viTri": "Quận 1, TPHCM",
  "loaiBaoCao": "trong_chuyen", // hoặc "ngoai_chuyen"
  "hocSinhLienQuan": [1, 2, 3]   // optional: IDs học sinh bị ảnh hưởng
}
```

**Cả 2 loại đều:**
- ✅ Gửi thông báo cho admin
- ✅ Gửi thông báo cho phụ huynh (nếu có học sinh liên quan)
- ✅ Emit WebSocket event `trip_incident`

---

## 🔌 WebSocket Events

### **Events được Emit từ Backend:**

| Event | Khi nào | Rooms | Payload |
|-------|---------|-------|---------|
| `notification:new` | Mọi loại thông báo | `user-{userId}` | `{ tieuDe, noiDung, loaiThongBao, thoiGianTao }` |
| `pickup_status_update` | Checkin/Absent | `trip-{id}`, `user-{parentId}` | `{ tripId, studentId, status, timestamp }` |
| `approach_stop` | Xe cách điểm dừng ≤60m | `trip-{id}` | `{ tripId, stopId, stopName, distance_m, eta }` |
| `trip_incident` | Báo cáo sự cố | `trip-{id}`, `bus-{id}`, `role-quan_tri` | `{ tripId, incidentType, description, location }` |

### **Frontend Listeners:**

**lib/socket.ts:**
```typescript
// ✅ Tự động dispatch sang DOM CustomEvent
this.socket.on("notification:new", (data) => {
  window.dispatchEvent(new CustomEvent("notificationNew", { detail: data }));
});
```

**app/parent/page.tsx:**
```typescript
// ✅ Lắng nghe và hiển thị toast + thêm vào danh sách
window.addEventListener("notificationNew", handleNotificationNew);
```

---

## 📊 Loại Thông Báo (loaiThongBao)

| Loại | Mô Tả | Icon | Màu |
|------|-------|------|-----|
| `student_absent` | Học sinh vắng mặt | ⚠️ | Orange |
| `student_pickup` | Học sinh đã lên xe | ✅ | Green |
| `approach_stop` | Xe sắp đến điểm dừng | 🚏 | Blue |
| `trip_incident` | Sự cố trong chuyến | 🚨 | Red |
| `incident_ngoai_chuyen` | Sự cố ngoài chuyến | 📋 | Red |
| `trip_started` | Chuyến xe bắt đầu | 🚌 | Blue |
| `trip_completed` | Chuyến xe hoàn thành | 🏁 | Green |
| `delay_alert` | Xe bị trễ | ⏰ | Orange |

---

## 🎨 UI/UX Improvements

### **Toast Notifications:**
- ✅ Kích thước lớn hơn: `text-lg`
- ✅ Font đậm hơn: `font-bold` cho warning, `font-semibold` cho info
- ✅ Duration lâu hơn: 10s cho warning, 7s cho info/success
- ✅ Border đỏ cho warning: `border-2 border-red-500`

### **Notification Cards:**
- ✅ Padding lớn hơn: `p-4` (từ `p-3`)
- ✅ Icon lớn hơn: `w-6 h-6` (từ `w-4 h-4`)
- ✅ Màu background rõ ràng theo loại:
  - Warning: Orange background + border
  - Success: Green background + border
  - Info: Blue background + border
- ✅ Font title: `text-base font-bold` (từ `text-sm font-medium`)

### **Badge Unread Count:**
- ✅ Variant: `destructive` (đỏ)
- ✅ Animation: `animate-pulse`
- ✅ Font: `font-bold`

---

## 🧪 Testing Guide

### **1. Test Thông Báo Vắng Mặt**

```bash
# Driver marks student absent
PUT http://localhost:3001/api/v1/trips/{tripId}/students/{studentId}/absent
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "ghiChu": "Phụ huynh báo con ốm"
}

# ✅ Expected:
# - Parent nhận toast: "⚠️ Con vắng mặt"
# - Card hiển thị với border orange
# - unreadCount tăng lên
```

### **2. Test Thông Báo Đã Đón**

```bash
# Driver checks in student
POST http://localhost:3001/api/v1/trips/{tripId}/students/{studentId}/checkin
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "ghiChu": "Đón tại điểm 1"
}

# ✅ Expected:
# - Parent nhận toast: "✅ Con đã lên xe"
# - Card hiển thị với border green
# - unreadCount tăng lên
```

### **3. Test Thông Báo Xe Sắp Đến**

```bash
# Simulate GPS update bringing bus within 60m of stop
POST http://localhost:3001/api/v1/telemetry/position
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "tripId": 1,
  "lat": 10.762622,  # Within 60m of a stop
  "lng": 106.660172,
  "speed": 25,
  "heading": 90
}

# ✅ Expected:
# - Parent nhận toast: "🚏 Xe sắp đến!"
# - Card hiển thị với border blue
# - unreadCount tăng lên
# - Chỉ gửi 1 lần (anti-spam)
```

### **4. Test Báo Cáo Trong Chuyến**

```bash
# Report incident during trip
POST http://localhost:3001/api/v1/trips/{tripId}/incident
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "loaiSuCo": "Xe hỏng",
  "moTa": "Xe bị thủng lốp",
  "viTri": "Quận 1, TPHCM",
  "loaiBaoCao": "trong_chuyen",
  "hocSinhLienQuan": [1, 2, 3]
}

# ✅ Expected:
# - Admin nhận thông báo: "🚌 Báo cáo trong chuyến - 🚨 Xe hỏng"
# - Parent (có con bị ảnh hưởng) nhận thông báo
# - Card hiển thị với border red
```

### **5. Test Báo Cáo Ngoài Chuyến**

```bash
POST http://localhost:3001/api/v1/trips/{tripId}/incident
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "loaiSuCo": "Bảo trì định kỳ",
  "moTa": "Xe cần bảo trì hệ thống phanh",
  "viTri": "Garage công ty",
  "loaiBaoCao": "ngoai_chuyen"
}

# ✅ Expected:
# - Admin nhận thông báo: "📋 Báo cáo ngoài chuyến - 🚨 Bảo trì định kỳ"
# - loaiThongBao: "incident_ngoai_chuyen"
```

---

## 📱 Parent App Screenshots (Expected UI)

### **Toast Warning (Vắng Mặt):**
```
┌─────────────────────────────────────┐
│ ⚠️ Con vắng mặt                     │
│                                     │
│ Nguyễn Văn A không có mặt tại       │
│ điểm đón.                           │
└─────────────────────────────────────┘
🔴 Red border, 10s duration
```

### **Toast Success (Đã Đón):**
```
┌─────────────────────────────────────┐
│ ✅ Con đã lên xe                    │
│                                     │
│ Nguyễn Văn A đã được đón lên xe     │
│ thành công!                         │
└─────────────────────────────────────┘
🟢 Green border, 7s duration
```

### **Notification Card:**
```
┌─────────────────────────────────────┐
│ 📢 Thông báo gần đây         [3 mới]│
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🚏  XE SẮP ĐẾN!               │ │ Blue border
│ │     Xe cách Điểm A 45m        │ │
│ │     Vừa xong                  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ✅  CON ĐÃ LÊN XE             │ │ Green border
│ │     Nguyễn Văn A đã lên xe    │ │
│ │     2 phút trước              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🔧 Configuration

### **Geofence Radius (Xe sắp đến):**
```javascript
// ssb-backend/src/services/telemetryService.js
const getGeofenceRadius = () => {
  return parseInt(process.env.GEOFENCE_RADIUS || "60"); // Default: 60m
};
```

**Để thay đổi:**
```env
# .env
GEOFENCE_RADIUS=60  # meters
```

### **Toast Duration:**
```typescript
// ssb-frontend/app/parent/page.tsx
duration: notifType === "warning" ? 10000 : 7000  // milliseconds
```

---

## 🐛 Known Issues & Solutions

### **Issue 1: Duplicate Notifications**
**Problem:** Parent nhận 2 lần cùng 1 thông báo.

**Solution:**
```typescript
// ✅ Đã fix: Chỉ tạo notification trong DB, không tạo lại từ WebSocket
// Backend tạo notification → DB → WebSocket emit → Frontend hiển thị
```

### **Issue 2: Notification không hiển thị**
**Problem:** Parent không nhận thông báo.

**Checklist:**
1. ✅ Kiểm tra Socket.IO connected: `socket.connected === true`
2. ✅ Kiểm tra join room: `join_trip`, `user-{userId}`
3. ✅ Kiểm tra listener: `window.addEventListener("notificationNew", ...)`
4. ✅ Kiểm tra console: Có log "Notification new:" không?

### **Issue 3: Xe sắp đến spam nhiều lần**
**Solution:**
```javascript
// ✅ Đã fix: Anti-spam cache
const emittedStops = new Map(); // tripId → Set<stopId>
if (tripEmittedStops.has(stop.maDiem)) {
  console.log("Already emitted, skipping...");
  continue;
}
```

---

## 📚 API Documentation

### **POST /api/v1/trips/:id/incident**

Report incident (emergency/accident).

**Request Body:**
```json
{
  "loaiSuCo": "string (required)",        // Incident type
  "moTa": "string (required)",             // Description
  "viTri": "string (optional)",            // Location
  "loaiBaoCao": "trong_chuyen | ngoai_chuyen",  // Report type
  "hocSinhLienQuan": [1, 2, 3]            // Optional: Student IDs
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã báo cáo sự cố thành công",
  "data": {
    "incidentId": 123,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### **POST /api/v1/trips/:id/students/:studentId/checkin**

Check in student (mark as picked up).

**Request Body:**
```json
{
  "ghiChu": "string (optional)"  // Notes
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã điểm danh học sinh thành công",
  "data": {
    "status": "da_don",
    "timestamp": "2024-01-15T07:15:00.000Z"
  }
}
```

### **PUT /api/v1/trips/:id/students/:studentId/absent**

Mark student as absent.

**Request Body:**
```json
{
  "ghiChu": "string (optional)"  // Reason
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã đánh dấu học sinh vắng mặt",
  "data": {
    "status": "vang",
    "timestamp": "2024-01-15T07:15:00.000Z"
  }
}
```

---

## 🚀 Deployment Checklist

- [x] Backend changes deployed to production
- [x] Frontend changes deployed to production
- [x] Database migration (if needed) - Not required
- [x] Environment variables configured
- [x] Socket.IO server restarted
- [x] WebSocket connections tested
- [x] Parent app notifications tested
- [x] Admin app notifications tested
- [x] Driver app notifications tested

---

## 📞 Support

**Developer:** GitHub Copilot + Development Team

**Date:** 2024-01-15

**Version:** 1.0.0

---

## 🎯 Future Improvements

1. **Push Notifications (FCM):**
   - Gửi push notification khi app ở background
   - Integration với Firebase Cloud Messaging

2. **Notification Sound:**
   - Phát âm thanh khi nhận notification quan trọng
   - Tùy chọn bật/tắt âm thanh

3. **Notification History:**
   - Lưu lịch sử notification trong DB
   - Trang xem lại notification cũ

4. **Notification Settings:**
   - Phụ huynh tự chọn loại notification muốn nhận
   - Tắt/bật notification cho từng loại

5. **Notification Priority:**
   - Phân loại mức độ quan trọng (High/Medium/Low)
   - Hiển thị khác biệt theo priority

---

**🎉 Hệ thống thông báo đã được cải tiến hoàn chỉnh!**
