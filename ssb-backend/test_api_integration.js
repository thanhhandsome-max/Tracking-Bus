#!/usr/bin/env node
/**
 * SSB API Test Script
 * Test các endpoint cơ bản của SSB API
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api/v1';
let authToken = '';

// Test data
const testCredentials = {
  admin: {
    email: 'quantri@schoolbus.vn',
    password: 'password'
  },
  driver: {
    email: 'taixe1@schoolbus.vn', 
    password: 'password'
  },
  parent: {
    email: 'phuhuynh1@schoolbus.vn',
    password: 'password'
  }
};

// Utility functions
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  return { response, data };
}

async function testHealthCheck() {
  console.log('🔍 Testing Health Check...');
  try {
    const { response, data } = await makeRequest('/health');
    
    if (response.ok && data.success) {
      console.log('✅ Health check passed');
      console.log(`   Status: ${data.data.status}`);
      console.log(`   Environment: ${data.data.environment}`);
      return true;
    } else {
      console.log('❌ Health check failed');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testLogin(credentials) {
  console.log(`🔐 Testing Login (${credentials.email})...`);
  try {
    const { response, data } = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (response.ok && data.success && data.data.token) {
      console.log('✅ Login successful');
      console.log(`   User: ${data.data.user.hoTen}`);
      console.log(`   Role: ${data.data.user.vaiTro}`);
      authToken = data.data.token;
      return true;
    } else {
      console.log('❌ Login failed');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testGetBuses() {
  console.log('🚌 Testing Get Buses...');
  try {
    const { response, data } = await makeRequest('/buses');
    
    if (response.ok && data.success) {
      console.log('✅ Get buses successful');
      console.log(`   Found ${data.data.length || 0} buses`);
      return true;
    } else {
      console.log('❌ Get buses failed');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Get buses error:', error.message);
    return false;
  }
}

async function testGetProfile() {
  console.log('👤 Testing Get Profile...');
  try {
    const { response, data } = await makeRequest('/auth/profile');
    
    if (response.ok && data.success) {
      console.log('✅ Get profile successful');
      console.log(`   User: ${data.data.hoTen}`);
      console.log(`   Email: ${data.data.email}`);
      return true;
    } else {
      console.log('❌ Get profile failed');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Get profile error:', error.message);
    return false;
  }
}

async function testGetDrivers() {
  console.log('👨‍💼 Testing Get Drivers...');
  try {
    const { response, data } = await makeRequest('/drivers');
    
    if (response.ok && data.success) {
      console.log('✅ Get drivers successful');
      console.log(`   Found ${data.data.length || 0} drivers`);
      return true;
    } else {
      console.log('❌ Get drivers failed');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Get drivers error:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting SSB API Tests...\n');
  
  const results = {
    health: false,
    login: false,
    buses: false,
    profile: false,
    drivers: false
  };
  
  // Test 1: Health Check
  results.health = await testHealthCheck();
  console.log('');
  
  if (!results.health) {
    console.log('❌ Server is not running. Please start the server first.');
    console.log('   Run: npm run dev');
    process.exit(1);
  }
  
  // Test 2: Login
  results.login = await testLogin(testCredentials.admin);
  console.log('');
  
  if (!results.login) {
    console.log('❌ Login failed. Please check database and credentials.');
    process.exit(1);
  }
  
  // Test 3: Get Profile
  results.profile = await testGetProfile();
  console.log('');
  
  // Test 4: Get Buses
  results.buses = await testGetBuses();
  console.log('');
  
  // Test 5: Get Drivers
  results.drivers = await testGetDrivers();
  console.log('');
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed! API is ready for frontend integration.');
  } else {
    console.log('⚠️  Some tests failed. Please check the issues above.');
  }
}

// Run tests
runTests().catch(console.error);
