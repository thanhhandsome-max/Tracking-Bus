# 📚 API Documentation - School Bus Tracking System

## ✅ Đã hoàn thành

### 🔐 Authentication APIs
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký (chỉ admin)

### 🚌 Trips APIs
- `GET /api/trips/active` - Lấy danh sách chuyến đi đang hoạt động
  - Query: `date`, `direction`
  - Response: Bao gồm vị trí real-time, progress, next stop
  
- `GET /api/trips/history` - Lấy lịch sử các chuyến đi đã hoàn thành
  - Query: `userId` (required), `startDate`, `endDate`, `limit`
  - Response: Chi tiết chuyến đi, thời gian thực tế, stops

### 🛣️ Routes APIs
- `GET /api/routes` - Lấy danh sách tuyến đường
  - Query: `includeStops` (true/false)
  - Response: Routes với stops details, estimated duration

### 📍 Bus Location APIs
- `GET /api/buses/[busId]/location` - Vị trí hiện tại của xe bus
- `GET /api/buses/[busId]/location/history` - Lịch sử vị trí
  - Query: `from`, `to`, `limit`

### 🔔 Notifications APIs
- `GET /api/notifications` - Lấy thông báo của user
  - Query: `userId` (required), `limit`, `unreadOnly`
  - Response: Danh sách thông báo, unreadCount
  
- `PATCH /api/notifications` - Đánh dấu đã đọc
  - Body: `notificationId`

- `POST /api/notifications/check` - Kiểm tra và gửi thông báo tự động
  - Body: `trips`, `schoolLocation`

### 💬 Messages APIs
- `GET /api/messages` - Lấy tin nhắn/conversations
  - Query: `userId` (required), `conversationId` (optional), `limit`
  - Response: 
    - Không có conversationId: Danh sách conversations
    - Có conversationId: Chi tiết tin nhắn

- `POST /api/messages` - Gửi tin nhắn mới
  - Body: `userId`, `receiverId`, `content`

- `PATCH /api/messages` - Đánh dấu đã đọc
  - Body: `messageId` hoặc `conversationId`

## 📊 Database Models

### ✅ Đã có models:
1. **User** - Tài khoản người dùng (email, password, role)
2. **Parent** - Phụ huynh (userId, name, phone, address)
3. **Student** - Học sinh (parentId, name, old, classstudent)
4. **Driver** - Tài xế (userId, name, phone, licenseNumber)
5. **Bus** - Xe bus (plateNumber, capacity, status)
6. **Route** - Tuyến đường (name, stops[])
7. **Stop** - Điểm dừng (stopId, name, location GeoJSON, type)
8. **Trip** - Chuyến đi (routeId, busId, driverId, studentIds, stopDetails[])
9. **BusLocation** - Vị trí xe bus (busId, timestamp, location, speed)
10. **Notification** - Thông báo (recipientId, type, message, read)
11. **Message** ⭐ MỚI - Tin nhắn (conversationId, senderId, receiverId, content, read)

## 🎯 Database đã seed

### Dữ liệu có sẵn:
- **6 User accounts** (3 parents + 3 drivers)
- **3 Parents** (với địa chỉ, phone)
- **4 Students** (liên kết với parents)
- **3 Drivers** (8-12 năm kinh nghiệm)
- **3 Buses** (51B-xxx.xx)
- **6 Stops** (schools + pickup points ở TP.HCM)
- **3 Routes** (với stops sequence và estimated times)
- **3 Active Trips** ⭐ MỚI (2 in_progress, 1 scheduled)
- **3 Bus Locations** ⭐ MỚI (vị trí real-time)
- **5 Notifications** ⭐ MỚI (arrival, departure, alert types)
- **8 Messages** ⭐ MỚI (3 conversations giữa parents và drivers)

## 🔑 Test Credentials

### Parent Accounts:
```
Email: parent1@example.com
Password: 123456
Student: Nguyễn Văn A (5A)

Email: parent2@example.com
Password: 123456
Student: Trần Thị B (6B)

Email: parent3@example.com
Password: 123456
Students: Lê Minh C (5B), Phạm Thu D (4A)
```

### Driver Accounts:
```
Email: vinh.driver@schoolbus.com
Password: driver123

Email: an.driver@schoolbus.com
Password: driver123

Email: mai.driver@schoolbus.com
Password: driver123
```

## 🧪 Testing Guide

### 1. Test Authentication
```bash
# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent1@example.com","password":"123456"}'
```

### 2. Test Active Trips (Theo dõi xe bus)
```bash
# Get all active trips
curl http://localhost:3002/api/trips/active

# Filter by direction
curl http://localhost:3002/api/trips/active?direction=departure
```

### 3. Test Notifications (Thông báo)
```bash
# Get notifications (replace USER_ID)
curl http://localhost:3002/api/notifications?userId=USER_ID

# Mark as read
curl -X PATCH http://localhost:3002/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"notificationId":"NOTIFICATION_ID"}'
```

### 4. Test Messages (Tin nhắn)
```bash
# Get conversations
curl http://localhost:3002/api/messages?userId=USER_ID

# Get messages in a conversation
curl http://localhost:3002/api/messages?userId=USER_ID&conversationId=CONV_ID

# Send message
curl -X POST http://localhost:3002/api/messages \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","receiverId":"DRIVER_ID","content":"Hello"}'
```

### 5. Test Trip History (Lịch sử)
```bash
# Get trip history
curl http://localhost:3002/api/trips/history?userId=USER_ID

# Filter by date range
curl http://localhost:3002/api/trips/history?userId=USER_ID&startDate=2024-10-01&endDate=2024-10-31
```

### 6. Test Routes (Tuyến đường)
```bash
# Get all routes with stops
curl http://localhost:3002/api/routes

# Get routes without stop details
curl http://localhost:3002/api/routes?includeStops=false
```

## 📱 UI Pages Status

### ✅ Hoạt động với database thật:
- ✅ `/` - Homepage (hiển thị students, active trips)
- ✅ `/login` - Login page
- ✅ `/notifications` - Notifications page (đã cập nhật)
- ✅ `/multi-trip-tracking` - Multi-trip tracking (API active trips)
- ✅ `/bus-tracking` - Single bus tracking

### ⚠️ Cần cập nhật:
- ⚠️ `/messages` - Messages page (cần thay mock data bằng API)
- ⚠️ `/history` - History page (cần integrate API)
- ⚠️ `/routes` - Routes page (cần integrate API)

## 🎉 Chức năng đã hoàn thành

1. ✅ **Theo dõi xe bus real-time**
   - API: `/api/trips/active`
   - Data: 3 chuyến đi đang hoạt động
   - Tính toán vị trí xe bus theo thời gian

2. ✅ **Lịch sử chuyến đi**
   - API: `/api/trips/history`
   - Lọc theo ngày, user
   - Chi tiết stops, thời gian thực tế

3. ✅ **Tuyến đường**
   - API: `/api/routes`
   - 3 tuyến với 6 điểm dừng
   - Estimated duration tự động tính

4. ✅ **Thông báo**
   - API: `/api/notifications`
   - 5 thông báo mẫu
   - Đánh dấu đã đọc
   - UI page đã update

5. ✅ **Tin nhắn** ⭐ MỚI
   - API: `/api/messages`
   - Message model mới
   - 8 tin nhắn trong 3 conversations
   - Support Parent <-> Driver messaging

## 🚀 Next Steps

1. Cập nhật `/messages` page để dùng API thật
2. Cập nhật `/history` page để dùng API thật
3. Cập nhật `/routes` page để dùng API thật
4. Thêm real-time updates với WebSocket/Polling
5. Thêm chức năng gửi file đính kèm trong messages
6. Thêm push notifications

## 📝 Notes

- MongoDB running on: `mongodb://localhost:27017/schoolbus`
- Dev server: `http://localhost:3002`
- Seed script: `npm run seed`
- All APIs use JSON format
- Authentication: JWT tokens stored in localStorage
