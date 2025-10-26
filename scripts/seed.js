#!/usr/bin/env node

/**
 * SSB Database Seeding Script
 * Smart School Bus Tracking System
 * Version: 1.0.0
 * Created: 2025-10-25
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'secret',
  database: process.env.DB_NAME || 'ssb',
  multipleStatements: true
};

// SQL file paths
const initDbPath = path.join(__dirname, '../database/init_db.sql');
const sampleDataPath = path.join(__dirname, '../database/sample_data.sql');

/**
 * Execute SQL file
 * @param {string} filePath - Path to SQL file
 * @param {string} description - Description of the operation
 */
async function executeSqlFile(filePath, description) {
  try {
    console.log(`📄 Reading ${description}...`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    console.log(`🔧 Executing ${description}...`);
    const connection = await mysql.createConnection(dbConfig);
    
    // Split SQL content by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
      } catch (error) {
          // Skip errors for statements that might already exist
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate entry') &&
              !error.message.includes('Table') && 
              !error.message.includes('already exists')) {
            console.warn(`⚠️  Warning: ${error.message}`);
          }
        }
      }
    }
    
    await connection.end();
    console.log(`✅ ${description} completed successfully!`);
  } catch (error) {
    console.error(`❌ Error executing ${description}:`, error.message);
    throw error;
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const connection = await mysql.createConnection(dbConfig);
    await connection.ping();
    await connection.end();
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Check if database exists
 */
async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    const [rows] = await connection.execute(
      'SHOW DATABASES LIKE ?',
      [dbConfig.database]
    );
    
    await connection.end();
    return rows.length > 0;
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    return false;
  }
}

/**
 * Create database if it doesn't exist
 */
async function createDatabase() {
  try {
    console.log('📦 Creating database if it doesn\'t exist...');
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await connection.end();
    console.log('✅ Database created/verified successfully!');
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  }
}

/**
 * Verify seeded data
 */
async function verifyData() {
  try {
    console.log('🔍 Verifying seeded data...');
    const connection = await mysql.createConnection(dbConfig);
    
    const tables = [
      'NguoiDung',
      'TaiXe', 
      'XeBuyt',
      'HocSinh',
      'TuyenDuong',
      'DiemDung',
      'LichTrinh',
      'ChuyenDi',
      'TrangThaiHocSinh',
      'ThongBao',
      'SuCo'
    ];
    
    for (const table of tables) {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`📊 ${table}: ${rows[0].count} records`);
    }
    
    await connection.end();
    console.log('✅ Data verification completed!');
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  console.log('🌱 Starting SSB Database Seeding...');
  console.log('=====================================');
  
  try {
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to database');
    }
    
    // Check if database exists
    const dbExists = await checkDatabase();
    if (!dbExists) {
      await createDatabase();
    }
    
    // Execute initialization script
    await executeSqlFile(initDbPath, 'Database initialization');
    
    // Execute sample data script
    await executeSqlFile(sampleDataPath, 'Sample data insertion');
    
    // Verify data
    await verifyData();
    
    console.log('=====================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 You can now start the backend server with: npm run dev');
    console.log('🔗 API will be available at: http://localhost:4000/api/v1');
    console.log('❤️  Health check: http://localhost:4000/api/v1/health');
    
  } catch (error) {
    console.error('=====================================');
    console.error('❌ Database seeding failed:', error.message);
    console.error('💡 Please check your database configuration and try again.');
    process.exit(1);
  }
}

/**
 * Handle process signals
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Seeding interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Seeding terminated');
  process.exit(0);
});

// Run the seeding process
if (require.main === module) {
  seedDatabase().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { seedDatabase, testConnection, verifyData };
