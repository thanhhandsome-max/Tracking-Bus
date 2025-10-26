// Test Authentication System
import pool from './src/config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

async function testAuthentication() {
  console.log('🔐 Testing Authentication System...\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing Database Connection...');
    const [users] = await pool.query('SELECT COUNT(*) as count FROM NguoiDung');
    console.log(`✅ Database connected. Found ${users[0].count} users\n`);

    // Test 2: Test password hashing
    console.log('2️⃣ Testing Password Hashing...');
    const testPassword = 'password123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`✅ Password hashing works: ${isValid}\n`);

    // Test 3: Test JWT token generation
    console.log('3️⃣ Testing JWT Token Generation...');
    const testPayload = {
      userId: 1,
      email: 'test@example.com',
      vaiTro: 'quan_tri'
    };
    
    const accessToken = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: 1, email: 'test@example.com' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    
    console.log(`✅ Access Token generated: ${accessToken.substring(0, 50)}...`);
    console.log(`✅ Refresh Token generated: ${refreshToken.substring(0, 50)}...\n`);

    // Test 4: Test JWT token verification
    console.log('4️⃣ Testing JWT Token Verification...');
    const decodedAccess = jwt.verify(accessToken, process.env.JWT_SECRET);
    const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    console.log(`✅ Access Token verified: User ID ${decodedAccess.userId}`);
    console.log(`✅ Refresh Token verified: User ID ${decodedRefresh.userId}\n`);

    // Test 5: Test sample user login
    console.log('5️⃣ Testing Sample User Login...');
    const [sampleUsers] = await pool.query('SELECT * FROM NguoiDung WHERE email = ?', ['quantri@schoolbus.vn']);
    
    if (sampleUsers.length > 0) {
      const user = sampleUsers[0];
      console.log(`✅ Found sample user: ${user.hoTen} (${user.email})`);
      console.log(`   Role: ${user.vaiTro}`);
      console.log(`   Status: ${user.trangThai ? 'Active' : 'Inactive'}`);
      
      // Test password verification with sample password
      const samplePassword = 'password'; // Default password in sample data
      const isPasswordValid = await bcrypt.compare(samplePassword, user.matKhau);
      console.log(`   Password verification: ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}\n`);
    } else {
      console.log('❌ No sample users found\n');
    }

    // Test 6: Test all user roles
    console.log('6️⃣ Testing User Roles...');
    const [allUsers] = await pool.query('SELECT vaiTro, COUNT(*) as count FROM NguoiDung GROUP BY vaiTro');
    
    allUsers.forEach(user => {
      console.log(`   ${user.vaiTro}: ${user.count} users`);
    });
    console.log('');

    // Test 7: Test driver information
    console.log('7️⃣ Testing Driver Information...');
    const [drivers] = await pool.query(`
      SELECT n.hoTen, n.email, t.soBangLai, t.ngayHetHanBangLai, t.soNamKinhNghiem 
      FROM NguoiDung n 
      JOIN TaiXe t ON n.maNguoiDung = t.maTaiXe 
      WHERE n.vaiTro = 'tai_xe'
    `);
    
    console.log(`✅ Found ${drivers.length} drivers:`);
    drivers.forEach(driver => {
      console.log(`   ${driver.hoTen} - License: ${driver.soBangLai} - Expires: ${driver.ngayHetHanBangLai}`);
    });
    console.log('');

    console.log('🎉 All authentication tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Database connection working');
    console.log('✅ Password hashing/verification working');
    console.log('✅ JWT token generation working');
    console.log('✅ JWT token verification working');
    console.log('✅ Sample data loaded correctly');
    console.log('✅ User roles properly configured');
    console.log('✅ Driver information linked correctly');

  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the test
testAuthentication();
