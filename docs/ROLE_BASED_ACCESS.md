# 🔐 Hệ thống phân quyền theo vai trò (Role-Based Access)

## 📋 Tổng quan

Hệ thống có 3 loại tài khoản với giao diện khác nhau:

### 1️⃣ **Parent (Phụ huynh)**
- **Role**: `parent`
- **Mục đích**: Theo dõi xe bus đưa đón con
- **Giao diện**: `/` (HomePage)

### 2️⃣ **Driver (Tài xế)**
- **Role**: `driver`  
- **Mục đích**: Điều khiển xe bus, cập nhật trạng thái chuyến đi
- **Giao diện**: `/driver` (DriverDashboard)

### 3️⃣ **Admin (Quản trị viên)**
- **Role**: `admin`
- **Mục đích**: Quản lý toàn hệ thống
- **Giao diện**: `/admin` (Chưa tạo - có thể thêm sau)

---

## 🔄 Luồng đăng nhập

### Khi user đăng nhập:

1. **API kiểm tra email & password**
   ```typescript
   POST /api/auth/login
   Body: { email, password }
   ```

2. **API xác định role từ User model**
   ```typescript
   const user = await User.findOne({ email });
   // user.role: 'parent' | 'driver' | 'admin'
   ```

3. **API load thông tin tương ứng với role:**

   **Nếu role = 'parent':**
   ```typescript
   const parent = await Parent.findOne({ userId: user._id });
   const students = await Student.find({ parentId: parent._id });
   
   // Response
   {
     role: 'parent',
     name: parent.name,
     email: parent.email,
     students: [...],
     ...
   }
   ```

   **Nếu role = 'driver':**
   ```typescript
   const driver = await Driver.findOne({ userId: user._id }).populate('busId');
   
   // Response
   {
     role: 'driver',
     name: driver.name,
     email: driver.email,
     phone: driver.phone,
     licenseNumber: driver.licenseNumber,
     bus: { plateNumber, capacity },
     ...
   }
   ```

4. **Frontend lưu vào localStorage:**
   ```typescript
   localStorage.setItem('user', JSON.stringify(userData));
   localStorage.setItem('token', token);
   ```

5. **Frontend chuyển hướng theo role:**
   ```typescript
   if (userData.role === 'driver') {
     router.push('/driver');
   } else if (userData.role === 'admin') {
     router.push('/admin');
   } else {
     router.push('/'); // Parent dashboard
   }
   ```

---

## 🛡️ Middleware bảo vệ routes

### Parent Dashboard (`/`)
```typescript
// src/components/HomePage/HomePage.tsx
useEffect(() => {
  const userData = localStorage.getItem('user');
  if (!userData) {
    router.push('/login');
    return;
  }
  
  const parsedUser = JSON.parse(userData);
  
  // Redirect driver to driver dashboard
  if (parsedUser.role === 'driver') {
    router.push('/driver');
    return;
  }
  
  // Continue loading parent data...
}, []);
```

### Driver Dashboard (`/driver`)
```typescript
// src/app/driver/page.tsx
useEffect(() => {
  const userData = localStorage.getItem('user');
  if (!userData) {
    router.push('/login');
    return;
  }
  
  const parsedUser = JSON.parse(userData);
  
  // Check if user is driver
  if (parsedUser.role !== 'driver') {
    router.push('/'); // Redirect to parent dashboard
    return;
  }
  
  // Continue loading driver data...
}, []);
```

---

## 📊 Database Schema

### User Model (Authentication)
```typescript
{
  email: string;
  password: string; // bcrypt hashed
  role: 'parent' | 'driver' | 'admin';
}
```

### Parent Model
```typescript
{
  name: string;
  email: string;
  phone: string;
  address: string;
  userId: ObjectId; // References User
}
```

### Driver Model
```typescript
{
  name: string;
  phone: string;
  licenseNumber: string;
  yearsOfExperience: number;
  userId: ObjectId; // References User
  busId: ObjectId;  // References Bus - Xe được phân cho tài xế
}
```

---

## 🔑 Tài khoản test

### Phụ huynh (Parents)
```
Email: parent1@example.com
Password: 123456
Role: parent
Con: Nguyễn Văn A (Lớp 5A)
```

```
Email: parent2@example.com
Password: 123456
Role: parent
Con: Trần Thị B (Lớp 6B)
```

```
Email: parent3@example.com
Password: 123456
Role: parent
Con: Lê Minh C (Lớp 5B), Phạm Thu D (Lớp 4A)
```

### Tài xế (Drivers)
```
Email: vinh.driver@schoolbus.com
Password: driver123
Role: driver
Tên: Trương Thế Vinh
Xe: 51B-123.45 (29 chỗ)
Bằng lái: B2-123456
```

```
Email: an.driver@schoolbus.com
Password: driver123
Role: driver
Tên: Nguyễn Văn An
Xe: 51B-678.90 (24 chỗ)
Bằng lái: B2-234567
```

```
Email: mai.driver@schoolbus.com
Password: driver123
Role: driver
Tên: Lê Thị Mai
Xe: 51B-111.22 (16 chỗ)
Bằng lái: B2-345678
```

---

## 🎨 Giao diện theo Role

### Parent Dashboard (`/`)
**Hiển thị:**
- ✅ Danh sách học sinh của phụ huynh
- ✅ Chuyến xe đang chạy (đưa đón con)
- ✅ Thông báo (xe đến, xe về, cảnh báo)
- ✅ Theo dõi xe bus real-time
- ✅ Lịch sử các chuyến đi
- ✅ Nhắn tin với tài xế

**Màu theme:** Purple gradient (`#667eea → #764ba2`)

### Driver Dashboard (`/driver`)
**Hiển thị:**
- ✅ Thông tin tài xế (tên, SĐT, bằng lái)
- ✅ Thông tin xe bus được phân (biển số, sức chứa)
- ✅ Chuyến xe hôm nay (các chuyến của xe này)
- ✅ Vị trí hiện tại của xe
- ✅ Cập nhật trạng thái chuyến đi
- ✅ Nhắn tin với phụ huynh
- ✅ Gửi thông báo

**Màu theme:** Purple gradient (`#667eea → #764ba2`)

### Admin Dashboard (`/admin`) - Chưa tạo
**Sẽ hiển thị:**
- 🔲 Quản lý tất cả Users, Parents, Drivers
- 🔲 Quản lý Buses, Routes, Stops
- 🔲 Xem tất cả Trips, Notifications, Messages
- 🔲 Thống kê hệ thống
- 🔲 Báo cáo

---

## 🚀 Test các role

### 1. Test Parent
```bash
1. Mở http://localhost:3002/login
2. Đăng nhập: parent1@example.com / 123456
3. Được chuyển đến: http://localhost:3002/
4. Kiểm tra: Hiển thị "Chào mừng phụ huynh - Nguyễn Văn X"
5. Kiểm tra: Thấy danh sách con: Nguyễn Văn A (Lớp 5A)
```

### 2. Test Driver
```bash
1. Mở http://localhost:3002/login
2. Đăng nhập: vinh.driver@schoolbus.com / driver123
3. Được chuyển đến: http://localhost:3002/driver
4. Kiểm tra: Hiển thị "Xin chào Trương Thế Vinh - Tài xế xe 51B-123.45"
5. Kiểm tra: Thông tin xe bus (biển số, sức chứa)
6. Kiểm tra: Chuyến xe hôm nay
```

### 3. Test Redirect Protection
```bash
# Parent cố truy cập driver dashboard
1. Đăng nhập parent1@example.com
2. Thử truy cập http://localhost:3002/driver
3. Tự động chuyển về http://localhost:3002/

# Driver cố truy cập parent dashboard  
1. Đăng nhập vinh.driver@schoolbus.com
2. Tự động chuyển về http://localhost:3002/driver
3. Hoặc thử truy cập http://localhost:3002/
4. Tự động chuyển về http://localhost:3002/driver
```

---

## 📝 Code Examples

### Tạo tài khoản mới

**Tạo Parent:**
```typescript
// 1. Tạo User
const user = await User.create({
  email: 'newparent@example.com',
  password: await bcrypt.hash('password123', 10),
  role: 'parent'
});

// 2. Tạo Parent
const parent = await Parent.create({
  name: 'Nguyễn Văn Mới',
  email: 'newparent@example.com',
  phone: '0909123456',
  address: 'TP.HCM',
  userId: user._id
});
```

**Tạo Driver:**
```typescript
// 1. Tạo User
const user = await User.create({
  email: 'newdriver@schoolbus.com',
  password: await bcrypt.hash('driver123', 10),
  role: 'driver'
});

// 2. Tạo Driver
const driver = await Driver.create({
  name: 'Phạm Văn Tài',
  phone: '0909876543',
  licenseNumber: 'B2-999999',
  yearsOfExperience: 5,
  userId: user._id,
  busId: someBusId // Phân xe
});
```

---

## ✅ Hoàn thành

- ✅ User model có 3 roles: parent, driver, admin
- ✅ Login API xử lý cả 3 roles
- ✅ Parent Dashboard (`/`) - Redirect driver ra ngoài
- ✅ Driver Dashboard (`/driver`) - Redirect parent ra ngoài
- ✅ Driver model có busId để link với xe
- ✅ Seed database với đầy đủ 3 roles
- ✅ Auto redirect sau login theo role

## 🔮 Tính năng tiếp theo (Optional)

- 🔲 Admin Dashboard (`/admin`)
- 🔲 Driver có thể cập nhật vị trí xe real-time
- 🔲 Driver có thể đánh dấu học sinh đã lên/xuống xe
- 🔲 Driver có thể gửi thông báo cho phụ huynh
- 🔲 Parent có thể đánh giá tài xế sau chuyến đi
- 🔲 Hệ thống yêu cầu đổi mật khẩu
- 🔲 Forgot password functionality
