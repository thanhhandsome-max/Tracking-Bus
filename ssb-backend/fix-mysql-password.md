# Fix MySQL Password Issue - Smart School Bus System

## Problem
Backend cannot connect to MySQL: "Access denied for user 'root'@'localhost'"

## Solutions

### Option 1: Find Your MySQL Password

If you already have a MySQL password set:

1. Check if you have MySQL Workbench installed - your password might be saved there
2. Check XAMPP/WAMP control panel if you're using those
3. Check your other projects for .env files with MySQL credentials

### Option 2: Reset MySQL Root Password (Windows)

#### Step 1: Stop MySQL Service
```powershell
Stop-Service MySQL80
```

#### Step 2: Start MySQL in Safe Mode
```powershell
# Start MySQL without password requirement
mysqld --skip-grant-tables --shared-memory
```

#### Step 3: Open New PowerShell Window and Connect
```powershell
# Connect to MySQL (no password needed in safe mode)
mysql -u root

# In MySQL prompt, run:
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword123';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 4: Restart MySQL Normally
```powershell
# Stop the safe mode MySQL (press Ctrl+C in the window running mysqld)
# Then restart the service normally
Start-Service MySQL80
```

### Option 3: Use MySQL Workbench GUI (Easiest)

1. Open **MySQL Workbench**
2. Click on your connection
3. If prompted for password, try common defaults: empty, "root", "password", "admin"
4. Once connected: Server → Users and Privileges → Select root → Change password

### Option 4: Create New MySQL User (Alternative)

Instead of using root, create a new user for this project:

```sql
-- Connect as root first, then run:
CREATE USER 'ssb_user'@'localhost' IDENTIFIED BY 'ssb_password123';
GRANT ALL PRIVILEGES ON school_bus_system.* TO 'ssb_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update your `.env`:
```env
DB_USER=ssb_user
DB_PASSWORD=ssb_password123
```

## After Setting Password

1. Update `.env` file with your MySQL password:
```env
DB_PASSWORD=your_actual_password
DB_PASS=your_actual_password
```

2. Restart your backend server:
```powershell
cd ssb-backend
npm run dev
```

3. Test the login endpoint:
```powershell
curl http://localhost:4000/api/v1/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@ssb.com","matKhau":"123456"}'
```

## Common MySQL Passwords to Try First

Before resetting, try these common defaults:
- Empty password: ``
- `root`
- `password`
- `admin`
- `123456`
- `mysql`

## Need Help?

If you're using:
- **XAMPP**: Password is usually empty or "root"
- **WAMP**: Password is usually empty or "root"
- **MySQL Installer**: Password was set during installation

Check your installation documentation or notes from when you first installed MySQL.
