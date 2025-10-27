# Smart School Bus Tracking System - Backend API

## 🚌 Tổng quan

Backend API cho hệ thống theo dõi xe buýt trường học thông minh, sử dụng Node.js + Express.js + MySQL + Firebase + Socket.IO.

## 🛠️ Công nghệ sử dụng

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database chính
- **Firebase Realtime Database** - Lưu trữ dữ liệu GPS realtime
- **Socket.IO** - WebSocket cho tracking realtime
- **JWT** - Xác thực và phân quyền
- **CORS** - Cross-origin resource sharing

## 📁 Cấu trúc thư mục

```
ssb-backend/
├── docs/                # 📚 Documentation
│   ├── DAY2_COMPLETE_GUIDE.md  # Hướng dẫn đầy đủ Day 2 (Routes, Controller, Service)
│   ├── API_Design.md           # Thiết kế API
│   └── postman_collection.json # Postman test collection
├── src/
│   ├── config/          # Cấu hình hệ thống
│   ├── controllers/     # Logic xử lý API
│   ├── models/          # Mô hình dữ liệu MySQL
│   ├── routes/          # Định nghĩa endpoints
│   ├── middlewares/     # Middleware xử lý
│   ├── services/        # Business logic layer (NEW Day 2)
│   ├── scripts/         # 🛠️ Test & utility scripts
│   │   ├── README.md           # Hướng dẫn scripts
│   │   ├── test_db.js          # Test DB connection
│   │   ├── check_db.js         # Debug DB data
│   │   └── reset_trip.js       # Reset trip for testing
│   ├── utils/           # Hàm tiện ích
│   ├── test/            # Unit tests
│   ├── app.js           # Khởi tạo Express app
│   └── server.js        # Entry point + Socket.IO
├── sql/                 # SQL scripts
│   ├── init_db.sql             # Database schema
│   └── insert_sample_data.sql  # Sample data
├── .env                 # Biến môi trường
├── package.json         # Dependencies
├── TEST_SCENARIOS.md    # 🧪 Test cases cho Start Trip API
├── FILE_REORGANIZATION_SUMMARY.md  # Tóm tắt tổng hợp files
└── README.md            # Tài liệu này
```

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình biến môi trường

Copy file `.env.example` thành `.env` và cập nhật các giá trị:

```bash
cp .env.example .env
```

### 3. Khởi tạo database

```bash
# Tạo database MySQL
mysql -u root -p
CREATE DATABASE smart_school_bus;
```

### 4. Chạy server

```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/forgot-password` - Quên mật khẩu

### Admin

- `GET /api/admin/dashboard` - Dashboard admin
- `GET /api/admin/buses` - Danh sách xe buýt
- `POST /api/admin/buses` - Thêm xe buýt mới
- `GET /api/admin/drivers` - Danh sách tài xế
- `GET /api/admin/students` - Danh sách học sinh
- `GET /api/admin/routes` - Danh sách tuyến đường

### Driver

- `GET /api/driver/schedule` - Lịch trình tài xế
- `POST /api/driver/start-trip` - Bắt đầu chuyến
- `POST /api/driver/end-trip` - Kết thúc chuyến
- `POST /api/driver/report-incident` - Báo cáo sự cố

### Parent

- `GET /api/parent/children` - Danh sách con
- `GET /api/parent/tracking/:busId` - Theo dõi xe buýt
- `GET /api/parent/notifications` - Thông báo

### Tracking

- `GET /api/tracking/live/:busId` - Vị trí realtime
- `POST /api/tracking/update` - Cập nhật vị trí
- `GET /api/tracking/history/:busId` - Lịch sử di chuyển

## 🔌 Socket.IO Events

### Client → Server

- `join-bus-tracking` - Tham gia theo dõi xe buýt
- `leave-bus-tracking` - Rời khỏi theo dõi xe buýt

### Server → Client

- `location-update` - Cập nhật vị trí xe buýt
- `incident-alert` - Cảnh báo sự cố
- `trip-status` - Trạng thái chuyến đi

## 🔐 Xác thực

API sử dụng JWT token để xác thực. Gửi token trong header:

```
Authorization: Bearer <your_jwt_token>
```

## 📊 Database Schema

- **buses** - Thông tin xe buýt
- **drivers** - Thông tin tài xế
- **students** - Thông tin học sinh
- **parents** - Thông tin phụ huynh
- **routes** - Tuyến đường
- **schedules** - Lịch trình
- **trips** - Chuyến đi
- **notifications** - Thông báo

## 📈 Development Progress

### ✅ Day 1 - Setup & Authentication (COMPLETED)

- ✅ Project structure setup
- ✅ MySQL database connection
- ✅ JWT authentication
- ✅ User login/register APIs
- ✅ Basic middleware (auth, error handling)

### ✅ Day 2 - Trip Lifecycle Start API (COMPLETED)

**Endpoint:** `POST /api/v1/trips/:id/start`

**Implemented:**

- ✅ Route: `src/routes/api/trip.js`
- ✅ Controller: `src/controllers/tripController.js`
- ✅ Service: `src/services/tripService.js` (NEW - Business logic layer)
- ✅ Model: Dynamic UPDATE in `ChuyenDiModel.js`
- ✅ Authentication: JWT middleware
- ✅ Test scenarios: 7 test cases (see `TEST_SCENARIOS.md`)

**Bug Fixes:**

- ✅ Foreign key constraint error → Dynamic UPDATE
- ✅ `gioBatDauThucTe` always NULL → Use ISO timestamp for TIMESTAMP column

**Documentation:**

- 📚 `docs/DAY2_COMPLETE_GUIDE.md` - Full guide (routes, controller, service, testing, bug fixes)
- 🧪 `TEST_SCENARIOS.md` - All test cases
- 🛠️ `src/scripts/` - Test utilities (reset_trip.js, check_db.js, test_db.js)

**Test Command:**

```bash
# Test DB connection
node src/scripts/test_db.js

# Reset trip for testing
node src/scripts/reset_trip.js

# Debug DB data
node src/scripts/check_db.js
```

### 🔜 Day 3 - Socket.IO Realtime (TODO)

- [ ] WebSocket authentication
- [ ] Emit `trip_started` event
- [ ] Realtime GPS tracking
- [ ] Room management (bus rooms)

---

## 🧪 Testing

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Test API với Postman/Thunder Client
# Xem TEST_SCENARIOS.md để biết chi tiết
```

## 📝 Logs

Logs được lưu trong thư mục `logs/` với format:

- `access.log` - HTTP requests
- `error.log` - Lỗi hệ thống
- `tracking.log` - GPS tracking data

## 🚨 Monitoring

- Health check: `GET /health`
- Metrics: `GET /metrics`
- Status: `GET /status`

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.
