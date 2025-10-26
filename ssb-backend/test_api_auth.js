// Test API Authentication Endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api/v1';

async function testAPIEndpoints() {
  console.log('🌐 Testing API Authentication Endpoints...\n');

  try {
    // Test 1: Test login endpoint
    console.log('1️⃣ Testing Login Endpoint...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'quantri@schoolbus.vn',
        matKhau: 'password'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    
    if (loginData.success) {
      console.log('✅ Login successful!');
      console.log(`   User: ${loginData.data.user?.hoTen || 'N/A'}`);
      console.log(`   Role: ${loginData.data.user?.vaiTro || 'N/A'}`);
      console.log(`   Token: ${loginData.data.token?.substring(0, 50) || 'N/A'}...`);
      console.log(`   Refresh Token: ${loginData.data.refreshToken?.substring(0, 50) || 'N/A'}...\n`);

      // Test 2: Test protected profile endpoint
      console.log('2️⃣ Testing Protected Profile Endpoint...');
      const profileResponse = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.data.token}`,
          'Content-Type': 'application/json',
        }
      });

      const profileData = await profileResponse.json();
      
      if (profileData.success) {
        console.log('✅ Profile access successful!');
        console.log(`   User: ${profileData.data.user.hoTen}`);
        console.log(`   Email: ${profileData.data.user.email}`);
        console.log(`   Role: ${profileData.data.user.vaiTro}\n`);
      } else {
        console.log('❌ Profile access failed:', profileData.message);
      }

      // Test 3: Test refresh token endpoint
      console.log('3️⃣ Testing Refresh Token Endpoint...');
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.data.refreshToken}`,
          'Content-Type': 'application/json',
        }
      });

      const refreshData = await refreshResponse.json();
      
      if (refreshData.success) {
        console.log('✅ Refresh token successful!');
        console.log(`   New Token: ${refreshData.data.token.substring(0, 50)}...\n`);
      } else {
        console.log('❌ Refresh token failed:', refreshData.message);
      }

      // Test 4: Test invalid token
      console.log('4️⃣ Testing Invalid Token...');
      const invalidResponse = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid_token_here',
          'Content-Type': 'application/json',
        }
      });

      const invalidData = await invalidResponse.json();
      
      if (!invalidData.success) {
        console.log('✅ Invalid token properly rejected:', invalidData.message);
      } else {
        console.log('❌ Invalid token was accepted (security issue!)');
      }

    } else {
      console.log('❌ Login failed:', loginData.message);
    }

    // Test 5: Test login with wrong password
    console.log('\n5️⃣ Testing Wrong Password...');
    const wrongPasswordResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'quantri@schoolbus.vn',
        matKhau: 'wrongpassword'
      })
    });

    const wrongPasswordData = await wrongPasswordResponse.json();
    
    if (!wrongPasswordData.success) {
      console.log('✅ Wrong password properly rejected:', wrongPasswordData.message);
    } else {
      console.log('❌ Wrong password was accepted (security issue!)');
    }

    // Test 6: Test login with non-existent email
    console.log('\n6️⃣ Testing Non-existent Email...');
    const wrongEmailResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        matKhau: 'password'
      })
    });

    const wrongEmailData = await wrongEmailResponse.json();
    
    if (!wrongEmailData.success) {
      console.log('✅ Non-existent email properly rejected:', wrongEmailData.message);
    } else {
      console.log('❌ Non-existent email was accepted (security issue!)');
    }

    console.log('\n🎉 API Authentication tests completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run the test
testAPIEndpoints();
