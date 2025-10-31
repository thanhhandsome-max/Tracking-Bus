# Hướng dẫn Seed Database - Dữ liệu giả lập

## 🎯 Mục đích
Script này sẽ tạo đầy đủ dữ liệu giả lập cho toàn bộ hệ thống SchoolBus, bao gồm:
- Trạm xe (Stops)
- Tuyến đường (Routes)
- Tài xế (Drivers)
- Xe bus (Buses)
- Học sinh (Students)
- Phụ huynh (Parents)
- Chuyến đi (Trips)
- Vị trí xe (Bus Locations)
- Thông báo (Notifications)

## 📋 Yêu cầu
1. MongoDB đã cài đặt và đang chạy
2. Đã cài đặt tất cả dependencies: `npm install`
3. File `.env.local` có MONGODB_URI

## 🚀 Cách chạy

### Bước 1: Đảm bảo MongoDB đang chạy
```bash
# Windows - Mở MongoDB Compass hoặc
# Kiểm tra service MongoDB đang chạy
```

### Bước 2: Chạy script seed
```bash
npm run seed
```

### Bước 3: Đợi quá trình hoàn tất
Script sẽ:
1. Kết nối MongoDB
2. Xóa dữ liệu cũ (nếu có)
3. Tạo dữ liệu mới
4. Hiển thị tổng kết

## 📊 Dữ liệu được tạo

### 🚏 6 Stops (Trạm xe):
1. **STOP001** - Trạm Trường Tiểu học Minh Phú (School)
2. **STOP002** - Trạm Khu dân cư Hiệp Phú (Pickup)
3. **STOP003** - Trạm Chung cư Vinhomes (Pickup)
4. **STOP004** - Trạm Khu phố 3 (Pickup)
5. **STOP005** - Trạm Trường Tiểu học Lê Quý Đôn (School)
6. **STOP006** - Trạm Chợ Bình Thới (Pickup)

### 🛣️ 3 Routes (Tuyến đường):
1. **ROUTE001** - Tuyến 1: Hiệp Phú → Khu phố 3 → Trường Minh Phú (12.5km, 35 phút)
2. **ROUTE002** - Tuyến 2: Vinhomes → Chợ Bình Thới → Trường Lê Quý Đôn (10.8km, 30 phút)
3. **ROUTE003** - Tuyến 3: Tổng hợp nhiều điểm (15.2km, 45 phút)

### 👨‍✈️ 3 Drivers (Tài xế):
1. **DRV001** - Trương Thế Vinh (10 năm kinh nghiệm, rating 4.8⭐)
2. **DRV002** - Nguyễn Văn An (8 năm kinh nghiệm, rating 4.6⭐)
3. **DRV003** - Lê Thị Mai (12 năm kinh nghiệm, rating 4.9⭐)

### 🚌 3 Buses (Xe bus):
1. **BUS001** - 51B-123.45 (Hyundai County, 29 chỗ, 2020)
   - Tài xế: Trương Thế Vinh
   - Tuyến: ROUTE001
   - Tính năng: GPS, Camera, Điều hòa, Wifi

2. **BUS002** - 51B-678.90 (Thaco TB79S, 24 chỗ, 2021)
   - Tài xế: Nguyễn Văn An
   - Tuyến: ROUTE002
   - Tính năng: GPS, Camera, Điều hòa

3. **BUS003** - 51B-111.22 (Ford Transit, 16 chỗ, 2022)
   - Tài xế: Lê Thị Mai
   - Tuyến: ROUTE003
   - Tính năng: GPS, Camera, Điều hòa, Wifi, USB Charging

### 👨‍🎓 4 Students (Học sinh):
1. **STD001** - Nguyễn Văn A (Nam, Lớp 5A, Minh Phú)
   - Xe: BUS001
   - Đón: Hiệp Phú → Trả: Trường Minh Phú

2. **STD002** - Trần Thị B (Nữ, Lớp 6B, Lê Quý Đôn)
   - Xe: BUS002
   - Đón: Vinhomes → Trả: Trường Lê Quý Đôn

3. **STD003** - Lê Minh C (Nam, Lớp 5B, Minh Phú)
   - Xe: BUS001
   - Đón: Khu phố 3 → Trả: Trường Minh Phú

4. **STD004** - Phạm Thu D (Nữ, Lớp 4A, Minh Phú)
   - Xe: BUS003
   - Đón: Chợ Bình Thới → Trả: Trường Minh Phú

### 👨‍👩‍👧 3 Parents (Phụ huynh):
1. **PAR001** - Nguyễn Văn X
   - Email: parent1@example.com
   - Con: Nguyễn Văn A

2. **PAR002** - Trần Thị Y
   - Email: parent2@example.com
   - Con: Trần Thị B

3. **PAR003** - Lê Văn Z
   - Email: parent3@example.com
   - Con: Lê Minh C, Phạm Thu D (2 con)

### 🚗 4 Trips (Chuyến đi):
1. **TRIP001** - Đưa đi học (Route 1, BUS001, In Progress 30%)
2. **TRIP002** - Đưa đi học (Route 2, BUS002, In Progress 25%)
3. **TRIP003** - Đưa đi học (Route 3, BUS003, Scheduled)
4. **TRIP004** - Đón về (Route 1, BUS001, Scheduled chiều)

### 📍 2 Bus Locations (Vị trí xe hiện tại):
- BUS001: Đang ở trạm Hiệp Phú (35 km/h)
- BUS002: Đang ở Vinhomes (28 km/h)

### 🔔 3 Notifications (Thông báo):
1. Xe bus đã đến trạm (High priority, Unread)
2. Chuyến đi bắt đầu (Medium priority, Unread)
3. Đã đón học sinh (High priority, Read)

## 🔑 Tài khoản đăng nhập

### Tài khoản Phụ huynh:
```
Email: parent1@example.com
Password: 123456
Con: Nguyễn Văn A (Lớp 5A)

Email: parent2@example.com
Password: 123456
Con: Trần Thị B (Lớp 6B)

Email: parent3@example.com
Password: 123456
Con: Lê Minh C (5B), Phạm Thu D (4A)
```

### Tài khoản Tài xế:
```
Email: vinh.driver@schoolbus.com
Password: driver123
Xe: 51B-123.45

Email: an.driver@schoolbus.com
Password: driver123
Xe: 51B-678.90

Email: mai.driver@schoolbus.com
Password: driver123
Xe: 51B-111.22
```

## ✅ Kiểm tra dữ liệu

### Sử dụng MongoDB Compass:
1. Mở MongoDB Compass
2. Connect: `mongodb://localhost:27017`
3. Database: `schoolbus`
4. Xem các collections:
   - parents
   - students
   - drivers
   - buses
   - routes
   - stops
   - trips
   - buslocations
   - notifications

### Sử dụng mongo shell:
```bash
mongosh
use schoolbus
db.parents.find().pretty()
db.students.find().pretty()
db.buses.find().pretty()
```

## 🔄 Chạy lại từ đầu

Nếu muốn reset và tạo lại dữ liệu:
```bash
npm run seed
```

Script sẽ tự động xóa dữ liệu cũ và tạo mới.

## 📝 Lưu ý

1. **Dữ liệu giả lập**: Tất cả dữ liệu đều là giả lập, tọa độ GPS ở khu vực TP.HCM
2. **Thời gian**: Trips được tạo với thời gian hiện tại
3. **Mật khẩu**: 
   - Parents: `123456` (bcrypt hashed)
   - Drivers: `driver123` (bcrypt hashed)
4. **Quan hệ**: Tất cả references đều đã được liên kết đúng

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to MongoDB"
```bash
# Kiểm tra MongoDB đang chạy
# Windows: Mở Services → Tìm MongoDB → Start
```

### Lỗi: "Collection not found"
```bash
# Chạy lại script seed
npm run seed
```

### Lỗi: "Duplicate key error"
```bash
# Script tự động xóa dữ liệu cũ, nhưng nếu vẫn lỗi:
# Xóa database thủ công và chạy lại
mongosh
use schoolbus
db.dropDatabase()
exit
npm run seed
```

## 📚 Tiếp theo

Sau khi seed xong, bạn có thể:
1. Đăng nhập với tài khoản phụ huynh
2. Xem thông tin học sinh
3. Theo dõi xe bus real-time
4. Xem thông báo
5. Test các tính năng khác

Happy coding! 🚀
