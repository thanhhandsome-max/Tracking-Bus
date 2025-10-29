# Test Authentication System

## Demo Account

### Tạo tài khoản mẫu:
```
Email: demo@schoolbus.com
Password: 123456
Họ tên: Phụ huynh Demo
SĐT: 0912345678
Tên HS: Em Demo
Lớp: 5B
Trường: Tiểu học Demo
```

## Validation Tests

### ✅ Email validation:
- ❌ "invalid" → Lỗi: Email không hợp lệ
- ❌ "@gmail.com" → Lỗi: Email không hợp lệ
- ✅ "test@gmail.com" → OK

### ✅ Password validation:
- ❌ "123" → Lỗi: Mật khẩu phải có ít nhất 6 ký tự
- ❌ "12345" → Lỗi: Mật khẩu phải có ít nhất 6 ký tự
- ✅ "123456" → OK

### ✅ Confirm Password:
- Password: "123456", Confirm: "123457" → ❌ Lỗi: Mật khẩu không khớp
- Password: "123456", Confirm: "123456" → ✅ OK

### ✅ Phone validation:
- ❌ "123456" → Lỗi: Số điện thoại không hợp lệ
- ❌ "0812345678" → Lỗi: Số điện thoại không hợp lệ (đầu số không đúng)
- ✅ "0912345678" → OK (09, 03, 05, 07, 08)

### ✅ Name validation:
- ❌ "AB" → Lỗi: Họ tên phải có ít nhất 3 ký tự
- ✅ "ABC" → OK

## API Response Tests

### Register Success:
```json
{
  "message": "Đăng ký thành công",
  "user": {
    "parentId": "PAR1234567890",
    "name": "Phụ huynh Demo",
    "email": "demo@schoolbus.com",
    "phone": "0912345678",
    "students": [{
      "studentId": "STD1234567890",
      "name": "Em Demo",
      "class": "5B",
      "school": "Tiểu học Demo"
    }]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Register Error (Email exists):
```json
{
  "message": "Email đã được đăng ký"
}
```

### Login Success:
```json
{
  "message": "Đăng nhập thành công",
  "user": { ... },
  "token": "..."
}
```

### Login Error:
```json
{
  "message": "Email hoặc mật khẩu không đúng"
}
```

## Visual Tests

### ✅ Form UI:
- [ ] Gradient background hiển thị đẹp
- [ ] Logo SchoolBus với icon 🚌
- [ ] Toggle giữa Login/Register smooth
- [ ] Input fields có border khi focus
- [ ] Error messages màu đỏ hiển thị đúng vị trí
- [ ] Success message màu xanh
- [ ] Loading spinner khi submit

### ✅ Responsive:
- [ ] Desktop: Form width 500px, centered
- [ ] Mobile: Form full width với padding
- [ ] Input grid 2 cột → 1 cột trên mobile

### ✅ Animations:
- [ ] Form slide in khi load
- [ ] Message fade in
- [ ] Button scale khi hover
- [ ] Tab content fade khi switch

## Flow Tests

### ✅ Register → Login flow:
1. Vào /login
2. Click "Đăng ký ngay"
3. Form chuyển sang Register
4. Điền thông tin và submit
5. Success message hiện
6. Tự động chuyển về Login sau 1.5s
7. Form reset

### ✅ Login → Homepage flow:
1. Vào /login
2. Nhập email/password
3. Click "Đăng nhập"
4. Success message hiện
5. Redirect về / sau 1.5s
6. Header hiển thị tên user
7. localStorage có user + token

### ✅ Logout flow:
1. Ở trang chủ, click avatar
2. Modal mở
3. Click "Đăng xuất"
4. Confirm dialog
5. localStorage clear
6. Redirect về /login

## localStorage Data

### After successful login/register:
```javascript
// Check in browser console:
localStorage.getItem('user')
// → {"parentId":"PAR123","name":"Demo",...}

localStorage.getItem('token')
// → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## MongoDB Data

### Parent document:
```javascript
{
  parentId: "PAR1234567890",
  name: "Phụ huynh Demo",
  email: "demo@schoolbus.com",
  password: "$2a$10$...", // hashed
  phone: "0912345678",
  students: [ObjectId("...")],
  notifications: [],
  preferences: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true
  }
}
```

### Student document:
```javascript
{
  studentId: "STD1234567890",
  name: "Em Demo",
  class: "5B",
  school: "Tiểu học Demo",
  status: "not_picked_up",
  currentLocation: {
    type: "Point",
    coordinates: [0, 0]
  }
}
```
