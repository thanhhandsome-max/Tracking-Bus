/**
 * Script để geocode các địa chỉ và cập nhật TRỰC TIẾP vào file SQL
 * Chạy: node ssb-backend/scripts/geocode_and_update_sql.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MapsService from '../src/services/MapsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

// Extract và geocode tất cả địa chỉ, sau đó cập nhật SQL
async function geocodeAndUpdateSQL() {
  console.log('🚀 Bắt đầu geocode và cập nhật file SQL...\n');
  
  const sqlPath = path.join(__dirname, '../../database/02_sample_data.sql');
  let sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  
  // Backup
  const backupPath = sqlPath + '.backup';
  fs.writeFileSync(backupPath, sqlContent, 'utf-8');
  console.log(`📦 Đã backup: ${backupPath}\n`);
  
  // Extract tất cả địa chỉ từ HocSinh INSERT
  // Format: ('name', 'date', 'class', parent, 'address', lat, lng)
  const hocSinhMatches = [];
  
  // Tìm tất cả INSERT INTO HocSinh statements (có thể multi-line)
  const lines = sqlContent.split('\n');
  let inHocSinhInsert = false;
  let hocSinhInsertLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('INSERT INTO HocSinh') && line.includes('VALUES')) {
      inHocSinhInsert = true;
      hocSinhInsertLines = [line];
    } else if (inHocSinhInsert) {
      hocSinhInsertLines.push(line);
      if (line.endsWith(';')) {
        // Parse INSERT statement
        const fullInsert = hocSinhInsertLines.join(' ');
        // Extract các row values: ('name', 'date', 'class', parent, 'address', lat, lng)
        const rowPattern = /\(([^)]+)\)/g;
        let rowMatch;
        
        while ((rowMatch = rowPattern.exec(fullInsert)) !== null) {
          const values = rowMatch[1];
          // Parse: 'name', 'date', 'class', parent (@phuhuynh_start_1 + 0), 'address', lat, lng
          // Tìm địa chỉ (field thứ 5, trong quotes, sau 4 dấu phẩy)
          // Pattern: 4 fields đầu (có thể có @variable), sau đó là 'address', lat, lng
          const addressMatch = values.match(/(?:'[^']*',\s*){3}[^,]+,\s*'([^']+)',\s*([0-9.]+),\s*([0-9.]+)/);
          if (addressMatch) {
            const address = addressMatch[1];
            const oldLat = addressMatch[2];
            const oldLng = addressMatch[3];
            
            if (address && address.includes('TP.HCM')) {
              hocSinhMatches.push({
                address,
                oldLat,
                oldLng,
                fullRow: rowMatch[0],
              });
            }
          }
        }
        
        inHocSinhInsert = false;
        hocSinhInsertLines = [];
      }
    }
  }
  
  // Extract từ DiemDung INSERT
  // Format: ('name', lat, lng, 'address', time)
  const diemDungMatches = [];
  
  let inDiemDungInsert = false;
  let diemDungInsertLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('INSERT INTO DiemDung') && line.includes('VALUES')) {
      inDiemDungInsert = true;
      diemDungInsertLines = [line];
    } else if (inDiemDungInsert) {
      diemDungInsertLines.push(line);
      if (line.endsWith(';')) {
        // Parse INSERT statement
        const fullInsert = diemDungInsertLines.join(' ');
        // Extract các row values: ('name', lat, lng, 'address', time)
        const rowPattern = /\(([^)]+)\)/g;
        let rowMatch;
        
        while ((rowMatch = rowPattern.exec(fullInsert)) !== null) {
          const values = rowMatch[1];
          // Parse: 'name', lat, lng, 'address', time
          // Tìm địa chỉ (field thứ 4, trong quotes, sau lat và lng)
          const addressMatch = values.match(/'([^']+)',\s*([0-9.]+),\s*([0-9.]+),\s*'([^']+)'/);
          if (addressMatch) {
            const address = addressMatch[4];
            const oldLat = addressMatch[2];
            const oldLng = addressMatch[3];
            
            if (address && address.includes('TP.HCM')) {
              diemDungMatches.push({
                address,
                oldLat,
                oldLng,
                fullRow: rowMatch[0],
              });
            }
          }
        }
        
        inDiemDungInsert = false;
        diemDungInsertLines = [];
      }
    }
  }
  
  console.log(`📖 Tìm thấy:`);
  console.log(`  - ${hocSinhMatches.length} học sinh`);
  console.log(`  - ${diemDungMatches.length} điểm dừng\n`);
  
  // Remove duplicates
  const allAddresses = [...hocSinhMatches, ...diemDungMatches];
  const uniqueAddresses = [];
  const seen = new Set();
  
  allAddresses.forEach(addr => {
    if (!seen.has(addr.address)) {
      seen.add(addr.address);
      uniqueAddresses.push(addr);
    }
  });
  
  console.log(`📝 Có ${uniqueAddresses.length} địa chỉ duy nhất cần geocode\n`);
  
  // Geocode và tạo map
  const coordMap = new Map();
  let success = 0;
  let fail = 0;
  
  for (let i = 0; i < uniqueAddresses.length; i++) {
    const addr = uniqueAddresses[i];
    console.log(`[${i + 1}/${uniqueAddresses.length}] Geocoding: "${addr.address}"`);
    
    try {
      const result = await geocodeAddress(addr.address);
      coordMap.set(addr.address, {
        lat: result.lat,
        lng: result.lng,
        formatted_address: result.formatted_address,
      });
      console.log(`  ✅ ${result.lat}, ${result.lng}`);
      console.log(`     ${result.formatted_address}\n`);
      success++;
      await sleep(200);
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}\n`);
      fail++;
    }
  }
  
  console.log(`\n📊 Kết quả: ✅ ${success} | ❌ ${fail}\n`);
  
  // Update SQL file
  console.log('💾 Đang cập nhật file SQL...');
  
  // Update HocSinh: 'address', oldLat, oldLng) -> 'address', newLat, newLng)
  sqlContent = sqlContent.replace(
    /('([^']+)',\s*)([0-9.]+),\s*([0-9.]+)\)/g,
    (match, before, address, oldLat, oldLng) => {
      if (coordMap.has(address)) {
        const coords = coordMap.get(address);
        return `${before}${coords.lat}, ${coords.lng})`;
      }
      return match;
    }
  );
  
  // Update DiemDung: oldLat, oldLng, 'address' -> newLat, newLng, 'address'
  sqlContent = sqlContent.replace(
    /([0-9.]+),\s*([0-9.]+),\s*'([^']+)'/g,
    (match, oldLat, oldLng, address) => {
      if (coordMap.has(address)) {
        const coords = coordMap.get(address);
        return `${coords.lat}, ${coords.lng}, '${address}'`;
      }
      return match;
    }
  );
  
  // Write updated file
  fs.writeFileSync(sqlPath, sqlContent, 'utf-8');
  console.log(`✅ Đã cập nhật: ${sqlPath}\n`);
  
  // Save log
  const logData = Array.from(coordMap.entries()).map(([address, coords]) => ({
    address,
    lat: coords.lat,
    lng: coords.lng,
    formatted_address: coords.formatted_address,
  }));
  
  const logPath = path.join(__dirname, '../../database/02_sample_data_geocoded.json');
  fs.writeFileSync(logPath, JSON.stringify(logData, null, 2), 'utf-8');
  console.log(`📝 Đã lưu log: ${logPath}\n`);
  
  console.log('✨ Hoàn thành!');
}

geocodeAndUpdateSQL().catch(error => {
  console.error('❌ Lỗi:', error);
  process.exit(1);
});

