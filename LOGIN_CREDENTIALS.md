# SSB System - Login Credentials

## ✅ Issue Resolved

The 500 Internal Server Error on `/api/v1/auth/login` was caused by:
1. **Port conflict** - Process 2616 was using port 4000 (FIXED)
2. **MySQL password mismatch** - The backend was using cached old password (FIXED)

## Default Login Credentials

All users in the sample database use the password: **`password`**

### Admin Account
- **Email:** `quantri@schoolbus.vn`
- **Password:** `password`
- **Role:** `quan_tri` (Administrator)
- **Name:** Nguyễn Minh Quân

### Driver Accounts (Tài Xế)
- **Email:** `taixe1@schoolbus.vn` - `taixe14@schoolbus.vn`
- **Password:** `password` (all drivers)
- **Role:** `tai_xe`

### Parent Accounts (Phụ Huynh)
- **Email:** Check database for parent emails
- **Password:** `password` (all parents)
- **Role:** `phu_huynh`

## Database Configuration

Current MySQL settings in `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Thanh@123
DB_NAME=school_bus_system
```

## Backend Server

**Status:** ✅ Running on port 4000 (Process ID: 21648)

**API Base URL:** http://localhost:4000/api/v1

**Health Check:** http://localhost:4000/api/v1/health

## Test Login via cURL

```powershell
# PowerShell
$body = @{ email = "quantri@schoolbus.vn"; matKhau = "password" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4000/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
```

```bash
# Bash/Linux
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"quantri@schoolbus.vn","matKhau":"password"}'
```

## Frontend Login

Use these credentials in your frontend application:
- URL: http://localhost:3000/login
- Email: `quantri@schoolbus.vn`
- Password: `password`

## Troubleshooting

### If login still fails:

1. **Check backend is running:**
   ```powershell
   netstat -ano | findstr :4000
   ```

2. **Check database connection:**
   ```powershell
   cd ssb-backend
   node -e "import('mysql2/promise').then(async (mysql) => { const conn = await mysql.default.createConnection({ host: 'localhost', user: 'root', password: 'Thanh@123', database: 'school_bus_system' }); console.log('✅ Connected'); await conn.end(); })"
   ```

3. **Restart backend if needed:**
   ```powershell
   # Kill existing process
   Get-Process | Where-Object {$_.Id -eq 21648} | Stop-Process -Force
   
   # Start new instance
   cd ssb-backend
   npm run dev
   ```

## Password Hash Information

The sample data uses bcrypt hash:
- **Hash:** `$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`
- **Plain Text:** `password`
- **Salt Rounds:** 10

This is a standard Laravel bcrypt hash used in many demo projects.
