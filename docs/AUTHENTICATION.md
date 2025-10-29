# Hệ Thống Authentication - SchoolBus

## Tính năng đã tích hợp

### ✅ Form Login/Register
- Giao diện đẹp với gradient background
- Chuyển đổi giữa Login và Register
- Validation form đầy đủ
- Thông báo lỗi chi tiết

### ✅ Validation

#### Login:
- Email: Phải đúng định dạng email
- Password: Tối thiểu 6 ký tự

#### Register:
- Email: Định dạng email hợp lệ
- Password: Tối thiểu 6 ký tự
- Confirm Password: Phải khớp với password
- Họ tên: Tối thiểu 3 ký tự
- Số điện thoại: Định dạng VN (0912345678)
- Tên học sinh: Bắt buộc
- Lớp: Bắt buộc
- Trường: Bắt buộc

### ✅ API Endpoints

#### POST /api/auth/register
- Tạo tài khoản mới
- Hash password với bcrypt
- Tự động tạo student record
- Trả về JWT token

#### POST /api/auth/login
- Đăng nhập với email/password
- Verify password
- Trả về user data + JWT token

### ✅ Authentication Flow
1. User truy cập app → redirect đến /login
2. User đăng ký/đăng nhập
3. Save user data + token vào localStorage
4. Redirect về trang chủ
5. Header tự động hiển thị thông tin user
6. Nút logout trong profile modal

## Cách sử dụng

### 1. Đăng ký tài khoản mới
```
1. Truy cập http://localhost:3000/login
2. Click "Đăng ký ngay"
3. Điền đầy đủ thông tin:
   - Email: parent@example.com
   - Mật khẩu: 123456 (hoặc mạnh hơn)
   - Họ tên phụ huynh: Nguyễn Văn A
   - Số điện thoại: 0912345678
   - Tên học sinh: Nguyễn Văn B
   - Lớp: 5B
   - Trường: Tiểu học ABC
4. Click "Đăng ký"
5. Tự động chuyển sang màn hình đăng nhập
```

### 2. Đăng nhập
```
1. Nhập email và password đã đăng ký
2. Click "Đăng nhập"
3. Tự động redirect về trang chủ
```

### 3. Đăng xuất
```
1. Click vào avatar ở góc phải header
2. Click tab "Đăng xuất" ở sidebar
3. Xác nhận đăng xuất
```

## Cấu trúc File

### Components
- `/src/components/AuthForm.tsx` - Form Login/Register
- `/src/components/AuthForm.module.css` - Styling

### Pages
- `/src/app/login/page.tsx` - Login page

### API Routes
- `/src/app/api/auth/login/route.ts` - Login API
- `/src/app/api/auth/register/route.ts` - Register API

### Environment
- `.env.local` - JWT secret key

## Package đã cài đặt
```bash
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

## Bảo mật

### Password Hashing
- Sử dụng bcrypt với salt rounds = 10
- Password không bao giờ lưu dạng plain text

### JWT Token
- Expires sau 7 ngày
- Lưu trong localStorage
- Gửi kèm trong header cho API requests

### Validation
- Client-side: Real-time validation khi user nhập
- Server-side: Double check tất cả input
- Sanitize input để tránh injection

## Lưu ý khi deploy Production

1. **Đổi JWT_SECRET trong .env**
   ```
   JWT_SECRET=your-super-secret-random-string-here
   ```

2. **Thiết lập MongoDB Atlas**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/schoolbus
   ```

3. **HTTPS only**
   - Bắt buộc HTTPS cho production
   - Secure cookie cho token

4. **Rate Limiting**
   - Giới hạn số lần login/register
   - Tránh brute force attack

## Test Accounts (Development)

Sau khi đăng ký, bạn có thể test với:
```
Email: test@example.com
Password: 123456
```

## Troubleshooting

### Không redirect về trang chủ sau login
- Check console log
- Verify localStorage có user data
- Check MongoDB connection

### Lỗi 500 khi register/login
- Kiểm tra MongoDB đã chạy chưa
- Check .env.local file
- Xem terminal log để debug

### Token expired
- Login lại để lấy token mới
- Token có thời hạn 7 ngày
