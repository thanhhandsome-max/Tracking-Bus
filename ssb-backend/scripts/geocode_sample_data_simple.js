/**
 * Script đơn giản để geocode các địa chỉ trong file sample data
 * Output: File JSON với mapping địa chỉ -> tọa độ
 * 
 * Chạy: node ssb-backend/scripts/geocode_sample_data_simple.js
 * Sau đó dùng file JSON để cập nhật SQL file thủ công hoặc dùng script merge
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MapsService from '../src/services/MapsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Delay giữa các request
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extract địa chỉ từ SQL file
function extractAddresses(sqlContent) {
  const addresses = new Set();
  
  // Extract từ HocSinh INSERT: ('name', 'date', 'class', parent, 'address', lat, lng)
  const hocSinhMatches = sqlContent.matchAll(/INSERT INTO HocSinh[^;]+VALUES\s*\([^)]+\)/gi);
  for (const match of hocSinhMatches) {
    const values = match[0];
    // Extract address (5th field in quotes)
    const addressMatches = values.matchAll(/'([^']+)',\s*([0-9.]+),\s*([0-9.]+)/g);
    for (const addrMatch of addressMatches) {
      const address = addrMatch[1];
      const lat = parseFloat(addrMatch[2]);
      const lng = parseFloat(addrMatch[3]);
      if (address && address.includes('TP.HCM')) {
        addresses.add(JSON.stringify({ address, oldLat: lat, oldLng: lng, type: 'hocsinh' }));
      }
    }
  }
  
  // Extract từ DiemDung INSERT: ('name', lat, lng, 'address', time)
  const diemDungMatches = sqlContent.matchAll(/INSERT INTO DiemDung[^;]+VALUES\s*\([^)]+\)/gi);
  for (const match of diemDungMatches) {
    const values = match[0];
    // Extract address (4th field in quotes after lat, lng)
    const addressMatches = values.matchAll(/([0-9.]+),\s*([0-9.]+),\s*'([^']+)'/g);
    for (const addrMatch of addressMatches) {
      const lat = parseFloat(addrMatch[1]);
      const lng = parseFloat(addrMatch[2]);
      const address = addrMatch[3];
      if (address && address.includes('TP.HCM')) {
        addresses.add(JSON.stringify({ address, oldLat: lat, oldLng: lng, type: 'diemdung' }));
      }
    }
  }
  
  return Array.from(addresses).map(s => JSON.parse(s));
}

// Geocode một địa chỉ
async function geocodeAddress(address, retryCount = 3) {
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(1000 * attempt);
      }
      
      const result = await MapsService.geocode({ address, language: 'vi' });
      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          formatted_address: result.results[0].formatted_address,
        };
      }
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt + 1}/${retryCount} failed: ${error.message}`);
      if (attempt === retryCount - 1) {
        throw error;
      }
    }
  }
  throw new Error(`Failed after ${retryCount} attempts`);
}

async function main() {
  try {
    console.log('🚀 Bắt đầu geocode các địa chỉ...\n');
    
    // Đọc file SQL
    const sqlFilePath = path.join(__dirname, '../../database/02_sample_data.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Extract địa chỉ
    console.log('📖 Đang extract địa chỉ từ SQL...');
    const addresses = extractAddresses(sqlContent);
    console.log(`✅ Tìm thấy ${addresses.length} địa chỉ\n`);
    
    // Remove duplicates
    const uniqueAddresses = [];
    const seen = new Set();
    addresses.forEach(addr => {
      if (!seen.has(addr.address)) {
        seen.add(addr.address);
        uniqueAddresses.push(addr);
      }
    });
    
    console.log(`📝 Có ${uniqueAddresses.length} địa chỉ duy nhất\n`);
    
    // Geocode
    const geocoded = [];
    let success = 0;
    let fail = 0;
    
    for (let i = 0; i < uniqueAddresses.length; i++) {
      const addr = uniqueAddresses[i];
      console.log(`[${i + 1}/${uniqueAddresses.length}] "${addr.address}"`);
      
      try {
        const result = await geocodeAddress(addr.address);
        geocoded.push({
          address: addr.address,
          oldLat: addr.oldLat,
          oldLng: addr.oldLng,
          newLat: result.lat,
          newLng: result.lng,
          formatted_address: result.formatted_address,
          type: addr.type,
        });
        console.log(`  ✅ ${result.lat}, ${result.lng}\n`);
        success++;
        await sleep(200);
      } catch (error) {
        console.error(`  ❌ ${error.message}\n`);
        fail++;
      }
    }
    
    console.log(`\n📊 Kết quả: ✅ ${success} | ❌ ${fail}\n`);
    
    // Save JSON
    const jsonPath = path.join(__dirname, '../../database/02_sample_data_geocoded.json');
    fs.writeFileSync(jsonPath, JSON.stringify(geocoded, null, 2), 'utf-8');
    console.log(`💾 Đã lưu: ${jsonPath}\n`);
    
    // Generate SQL UPDATE statements
    const updateSQL = geocoded.map(item => {
      if (item.type === 'hocsinh') {
        return `-- UPDATE HocSinh SET viDo = ${item.newLat}, kinhDo = ${item.newLng} WHERE diaChi = '${item.address}';`;
      } else {
        return `-- UPDATE DiemDung SET viDo = ${item.newLat}, kinhDo = ${item.newLng} WHERE address = '${item.address}';`;
      }
    }).join('\n');
    
    const updatePath = path.join(__dirname, '../../database/02_sample_data_updates.sql');
    fs.writeFileSync(updatePath, updateSQL, 'utf-8');
    console.log(`💾 Đã tạo file UPDATE SQL: ${updatePath}\n`);
    
    console.log('✨ Hoàn thành!');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

main();
