/**
 * Script để geocode các địa chỉ trong file sample data và cập nhật tọa độ chính xác
 * Chạy: node ssb-backend/scripts/geocode_sample_data.js
 * 
 * Script này sẽ:
 * 1. Parse tất cả địa chỉ từ file 02_sample_data.sql
 * 2. Geocode từng địa chỉ bằng Google Geocoding API
 * 3. Cập nhật lại file SQL với tọa độ chính xác
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MapsService from '../src/services/MapsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Delay giữa các request để tránh rate limit
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Parse địa chỉ từ SQL INSERT statement - đơn giản hơn
function parseAddressesFromSQL(sqlContent) {
  const addresses = [];
  
  // Parse HocSinh INSERT statements - format: ('name', 'date', 'class', parent, 'address', lat, lng)
  const hocSinhRegex = /\(([^)]+)\)/g;
  const lines = sqlContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // HocSinh INSERT
    if (line.includes("INSERT INTO HocSinh") && line.includes("VALUES")) {
      // Multi-line INSERT - get all lines until semicolon
      let fullInsert = line;
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().endsWith(';')) {
        fullInsert += ' ' + lines[j].trim();
        j++;
      }
      
      // Extract all VALUES tuples
      const valuesMatches = fullInsert.matchAll(/\(([^)]+)\)/g);
      for (const match of valuesMatches) {
        const values = match[1];
        // Parse: 'name', 'date', 'class', parent, 'address', lat, lng
        const parts = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = null;
        
        for (let k = 0; k < values.length; k++) {
          const char = values[k];
          if ((char === "'" || char === '"') && (k === 0 || values[k-1] !== '\\')) {
            if (!inQuotes) {
              inQuotes = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inQuotes = false;
              quoteChar = null;
            } else {
              current += char;
            }
          } else if (inQuotes) {
            current += char;
          } else if (char === ',') {
            if (current.trim()) {
              parts.push(current.trim());
              current = '';
            }
          } else if (char !== ' ') {
            current += char;
          }
        }
        if (current.trim()) parts.push(current.trim());
        
        // diaChi is 5th field (index 4), viDo is 6th (index 5), kinhDo is 7th (index 6)
        if (parts.length >= 7) {
          const diaChi = parts[4].replace(/^['"]|['"]$/g, '');
          const oldLat = parts[5];
          const oldLng = parts[6];
          
          addresses.push({
            type: 'hocsinh',
            diaChi,
            oldLat,
            oldLng,
            lineNumber: i + 1,
            fullLine: lines[i],
          });
        }
      }
    }
    
    // DiemDung INSERT - format: ('name', lat, lng, 'address', time)
    if (line.includes("INSERT INTO DiemDung") && line.includes("VALUES")) {
      let fullInsert = line;
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().endsWith(';')) {
        fullInsert += ' ' + lines[j].trim();
        j++;
      }
      
      const valuesMatches = fullInsert.matchAll(/\(([^)]+)\)/g);
      for (const match of valuesMatches) {
        const values = match[1];
        const parts = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = null;
        
        for (let k = 0; k < values.length; k++) {
          const char = values[k];
          if ((char === "'" || char === '"') && (k === 0 || values[k-1] !== '\\')) {
            if (!inQuotes) {
              inQuotes = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inQuotes = false;
              quoteChar = null;
            } else {
              current += char;
            }
          } else if (inQuotes) {
            current += char;
          } else if (char === ',') {
            if (current.trim()) {
              parts.push(current.trim());
              current = '';
            }
          } else if (char !== ' ') {
            current += char;
          }
        }
        if (current.trim()) parts.push(current.trim());
        
        // tenDiem is 1st (index 0), viDo is 2nd (index 1), kinhDo is 3rd (index 2), address is 4th (index 3)
        if (parts.length >= 4) {
          const address = parts[3].replace(/^['"]|['"]$/g, '');
          const oldLat = parts[1];
          const oldLng = parts[2];
          
          addresses.push({
            type: 'diemdung',
            diaChi: address,
            oldLat,
            oldLng,
            lineNumber: i + 1,
            fullLine: lines[i],
          });
        }
      }
    }
  }
  
  return addresses;
}

// Geocode một địa chỉ
async function geocodeAddress(address, retryCount = 3) {
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(1000 * attempt); // Delay tăng dần: 1s, 2s
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
      console.warn(`⚠️ Geocode attempt ${attempt + 1}/${retryCount} failed for "${address}":`, error.message);
      if (attempt === retryCount - 1) {
        throw error;
      }
    }
  }
  
  throw new Error(`Failed to geocode after ${retryCount} attempts`);
}

// Update SQL file với tọa độ mới
function updateSQLWithCoordinates(sqlContent, geocodedAddresses) {
  let updatedContent = sqlContent;
  const lines = updatedContent.split('\n');
  
  // Create a map of address -> coordinates
  const coordMap = new Map();
  geocodedAddresses.forEach(({ diaChi, lat, lng }) => {
    coordMap.set(diaChi, { lat, lng });
  });
  
  // Update each line that contains coordinates
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line has an address we geocoded
    for (const [address, coords] of coordMap.entries()) {
      if (line.includes(address)) {
        // Replace old coordinates with new ones
        // Pattern: address', oldLat, oldLng) or address', oldLat, oldLng,
        const regex1 = new RegExp(`('${address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[^,]*),\\s*([0-9.]+),\\s*([0-9.]+)`, 'g');
        lines[i] = lines[i].replace(regex1, (match, before, oldLat, oldLng) => {
          return `${before}, ${coords.lat}, ${coords.lng}`;
        });
        
        // Also handle DiemDung format: 'name', lat, lng, 'address'
        const regex2 = new RegExp(`([0-9.]+),\\s*([0-9.]+),\\s*'${address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g');
        lines[i] = lines[i].replace(regex2, (match, oldLat, oldLng, after) => {
          return `${coords.lat}, ${coords.lng}, ${after}`;
        });
        
        break;
      }
    }
  }
  
  return lines.join('\n');
}

async function main() {
  try {
    console.log('🚀 Bắt đầu geocode các địa chỉ trong file sample data...\n');
    
    // Đọc file SQL
    const sqlFilePath = path.join(__dirname, '../../database/02_sample_data.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Parse địa chỉ từ SQL
    console.log('📖 Đang parse địa chỉ từ file SQL...');
    const addresses = parseAddressesFromSQL(sqlContent);
    console.log(`✅ Tìm thấy ${addresses.length} địa chỉ cần geocode\n`);
    
    // Remove duplicates (same address)
    const uniqueAddresses = [];
    const seenAddresses = new Set();
    
    addresses.forEach(addr => {
      if (!seenAddresses.has(addr.diaChi)) {
        seenAddresses.add(addr.diaChi);
        uniqueAddresses.push(addr);
      }
    });
    
    console.log(`📝 Có ${uniqueAddresses.length} địa chỉ duy nhất cần geocode\n`);
    
    // Geocode từng địa chỉ
    const geocodedAddresses = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < uniqueAddresses.length; i++) {
      const addr = uniqueAddresses[i];
      console.log(`[${i + 1}/${uniqueAddresses.length}] Geocoding: "${addr.diaChi}"`);
      
      try {
        const result = await geocodeAddress(addr.diaChi);
        geocodedAddresses.push({
          ...addr,
          lat: result.lat,
          lng: result.lng,
          formatted_address: result.formatted_address,
        });
        console.log(`  ✅ ${result.lat}, ${result.lng}`);
        console.log(`     ${result.formatted_address}\n`);
        successCount++;
        
        // Delay để tránh rate limit (50 requests/second limit của Google)
        await sleep(200); // 200ms delay giữa các request
      } catch (error) {
        console.error(`  ❌ Failed: ${error.message}\n`);
        failCount++;
      }
    }
    
    console.log(`\n📊 Kết quả:`);
    console.log(`  ✅ Thành công: ${successCount}`);
    console.log(`  ❌ Thất bại: ${failCount}`);
    
    if (successCount > 0) {
      // Update SQL file
      console.log(`\n💾 Đang cập nhật file SQL...`);
      const updatedSQL = updateSQLWithCoordinates(sqlContent, geocodedAddresses);
      
      // Backup file cũ
      const backupPath = sqlFilePath + '.backup';
      fs.writeFileSync(backupPath, sqlContent, 'utf-8');
      console.log(`  📦 Đã backup file gốc: ${backupPath}`);
      
      // Write file mới
      fs.writeFileSync(sqlFilePath, updatedSQL, 'utf-8');
      console.log(`  ✅ Đã cập nhật file: ${sqlFilePath}`);
      
      // Write file log với tọa độ mới
      const logPath = path.join(__dirname, '../../database/02_sample_data_geocoded.json');
      fs.writeFileSync(logPath, JSON.stringify(geocodedAddresses, null, 2), 'utf-8');
      console.log(`  📝 Đã lưu log: ${logPath}`);
    }
    
    console.log(`\n✨ Hoàn thành!`);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

main();

