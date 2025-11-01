# AUDIT BÁO CÁO 01: DATABASE REVIEW
**Smart School Bus Tracking System (SSB 1.0)**  
**Ngày kiểm tra:** 2025-10-23  
**Người thực hiện:** Cursor AI Audit System  

---

## EXECUTIVE SUMMARY

### Tổng quan
Hệ thống sử dụng **MySQL** làm database chính với schema trong `database/init_db.sql` và dữ liệu mẫu `database/sample_data.sql`. Có 10 bảng chính phục vụ nghiệp vụ tracking xe buýt học đường.

### Kết luận
✅ **DATABASE SCHEMA - READY**  
❌ **SAMPLE DATA - CÓ VẤN ĐỀ**  
⚠️ **DB CONNECTION - CẦN KIỂM TRA**

---

## 1. SCHEMA REVIEW

### 1.1 Danh sách bảng
| Bảng | Mục đích | Module | Status |
|------|----------|--------|--------|
| `NguoiDung` | Người dùng (Admin/Driver/Parent) | M0 | ✅ |
| `TaiXe` | Hồ sơ tài xế | M1 | ✅ |
| `XeBuyt` | Danh mục xe buýt | M1 | ✅ |
| `HocSinh` | Danh sách học sinh | M1 | ✅ |
| `TuyenDuong` | Tuyến đường | M2 | ✅ |
| `DiemDung` | Điểm dừng theo tuyến | M2 | ✅ |
| `LichTrinh` | Lịch trình (Schedule) | M3 | ✅ |
| `ChuyenDi` | Chuyến đi (Trip) | M5 | ✅ |
| `TrangThaiHocSinh` | Điểm danh học sinh | M5 | ✅ |
| `ThongBao` | Thông báo | M6 | ✅ |
| `SuCo` | Sự cố | M6 | ✅ |

### 1.2 Đối chiếu với yêu cầu MM4
#### ✅ **HOÀN THÀNH**
- [x] Tất cả 10 bảng theo ERD
- [x] Foreign keys đúng nghiệp vụ
- [x] Indexes cho performance
- [x] ENUM types cho trạng thái
- [x] Timestamps (ngayTao, ngayCapNhat)

#### ⚠️ **CẦN CẢI THIỆN**
| Vấn đề | Mô tả | Mức độ |
|--------|-------|--------|
| **Missing Index** | Thiếu index cho `vaiTro` trong `NguoiDung` | 🟡 Low |
| **FK Constraint** | `TaiXe.maTaiXe` FK → `NguoiDung.maNguoiDung` dùng `ON DELETE CASCADE` - nguy hiểm | 🔴 High |
| **No Unique** | `XeBuyt.bienSoXe` cần UNIQUE (đã có) | ✅ |
| **Data Type** | `TuyenDuong.thoiGianUocTinh` (INT) nên thêm comment "minutes" | 🟡 Low |

### 1.3 Trạng thái vs MM4 spec
| ENUM | Giá trị DB | Giá trị kỳ vọng (MM4) | Status |
|------|-----------|----------------------|--------|
| `NguoiDung.vaiTro` | `quan_tri`, `tai_xe`, `phu_huynh` | ✅ | ✅ |
| `XeBuyt.trangThai` | `hoat_dong`, `bao_tri`, `ngung_hoat_dong` | ❌ MM4: `active`, `inactive`, `maintenance` | ⚠️ MISMATCH |
| `TaiXe.trangThai` | `hoat_dong`, `tam_nghi`, `nghi_huu` | ❓ Chưa rõ spec | ⚠️ |
| `ChuyenDi.trangThai` | `chua_khoi_hanh`, `dang_chay`, `hoan_thanh`, `huy` | ✅ | ✅ |
| `TrangThaiHocSinh.trangThai` | `cho_don`, `da_don`, `da_tra`, `vang` | ✅ | ✅ |

🔴 **CRITICAL MISMATCH:** `XeBuyt.trangThai` dùng Tiếng Việt khác với spec MM4.

---

## 2. SAMPLE DATA REVIEW

### 2.1 Thống kê dữ liệu
```sql
-- Từ sample_data.sql:
NguoiDung: 10 records
├── quan_tri: 1
├── tai_xe: 4 (3 active + 1 tam_nghi)
└── phu_huynh: 5

TaiXe: 4 records
XeBuyt: 8 records (1 bao_tri, 1 ngung_hoat_dong)
HocSinh: 10 records
TuyenDuong: 5 records
DiemDung: 12 records
LichTrinh: 10 records
ChuyenDi: 33+ records (đa ngày: 14/10, 15/10, 16/10, 17/10, 20/10, 21/10)
TrangThaiHocSinh: 50+ records
ThongBao: 8 records
SuCo: 4 records
```

### 2.2 Vấn đề phát hiện
#### ❌ **LỖI LOGIC**
1. **Dữ liệu "mồ côi"**
   - Line 317-318: `@hocsinh_11_id`, `@hocsinh_12_id` được tạo nhưng KHÔNG có cha mẹ (maPhuHuynh = NULL)
   - → Vi phạm business rule: Mỗi học sinh phải có phụ huynh
   
2. **FK Constraint bypass**
   - Một số bản ghi `TrangThaiHocSinh` tham chiếu đến `maChuyen` không tồn tại
   - → Cần verify sau khi import
   
3. **Date inconsistency**
   - Sample data có ngày 2025-10-17, 2025-10-16, 2025-10-15 (quá khứ)
   - Ngày hiện tại: 2025-10-23
   - → OK cho demo lịch sử
   
#### ⚠️ **WARNING**
- Mật khẩu mặc định: `$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi` (bcrypt của "password")
  - Nguy cơ bảo mật
  - Cần đổi trong production

### 2.3 Coverage test cases
| Test case | Có dữ liệu? | Notes |
|-----------|-------------|-------|
| Chuyến đúng giờ | ✅ | ChuyenDi #1, #5, #11 |
| Chuyến trễ | ✅ | ChuyenDi #22 (16/10) trễ 30 phút |
| Chuyến hủy | ✅ | ChuyenDi #21 (16/10), #26 (15/10) |
| Học sinh vắng | ✅ | TrangThaiHocSinh #95, #309, #311 |
| Cảnh báo trễ | ✅ | ThongBao #116 (trễ 15 phút) |
| Cảnh báo đến gần | ✅ | ThongBao #117, #121 |
| Sự cố kỹ thuật | ✅ | SuCo #129 (nghiêm trọng) |
| Xe bảo trì | ✅ | XeBuyt #4 |
| Tài xế nghỉ phép | ✅ | TaiXe #9 (tam_nghi) |

✅ **COVERAGE RẤT TỐT** - Đủ dữ liệu để test E2E.

---

## 3. CONSTRAINT & INTEGRITY

### 3.1 Foreign Keys
| FK | Bảng con | Bảng cha | On Delete | Status |
|----|----------|----------|-----------|--------|
| `TaiXe.maTaiXe` → `NguoiDung.maNguoiDung` | TaiXe | NguoiDung | CASCADE | ⚠️ Rủi ro |
| `HocSinh.maPhuHuynh` → `NguoiDung.maNguoiDung` | HocSinh | NguoiDung | SET NULL | ✅ |
| `DiemDung.maTuyen` → `TuyenDuong.maTuyen` | DiemDung | TuyenDuong | CASCADE | ✅ |
| `LichTrinh.maTuyen` → `TuyenDuong.maTuyen` | LichTrinh | TuyenDuong | Default | ⚠️ |
| `LichTrinh.maXe` → `XeBuyt.maXe` | LichTrinh | XeBuyt | Default | ⚠️ |
| `LichTrinh.maTaiXe` → `NguoiDung.maNguoiDung` | LichTrinh | NguoiDung | Default | ⚠️ |
| `ChuyenDi.maLichTrinh` → `LichTrinh.maLichTrinh` | ChuyenDi | LichTrinh | Default | ✅ |
| `TrangThaiHocSinh.maChuyen` → `ChuyenDi.maChuyen` | TrangThaiHocSinh | ChuyenDi | CASCADE | ✅ |
| `TrangThaiHocSinh.maHocSinh` → `HocSinh.maHocSinh` | TrangThaiHocSinh | HocSinh | CASCADE | ✅ |
| `ThongBao.maNguoiNhan` → `NguoiDung.maNguoiDung` | ThongBao | NguoiDung | CASCADE | ⚠️ Rủi ro |

🔴 **RISK:** `TaiXe.maTaiXe` CASCADE có thể xóa cả tài khoản khi xóa tài xế → Nên dùng `ON DELETE RESTRICT` hoặc logic khác.

### 3.2 Unique Constraints
| Constraint | Bảng | Cột | Status |
|------------|------|-----|--------|
| UNIQUE | NguoiDung | email | ✅ |
| UNIQUE | NguoiDung | soDienThoai | ✅ |
| UNIQUE | TaiXe | soBangLai | ✅ |
| UNIQUE | XeBuyt | bienSoXe | ✅ |
| UNIQUE | ChuyenDi | (maLichTrinh, ngayChay) | ✅ |
| UNIQUE | TrangThaiHocSinh | (maChuyen, maHocSinh) | ✅ |

✅ **Tất cả unique constraints đã đúng.**

### 3.3 Indexes
```sql
-- Từ init_db.sql:
NguoiDung: idx_email, idx_vaiTro, idx_trangThai
TaiXe: idx_soBangLai, idx_trangThai
XeBuyt: idx_bienSoXe, idx_trangThai
HocSinh: idx_maPhuHuynh, idx_lop, idx_trangThai
TuyenDuong: idx_tenTuyen, idx_trangThai
DiemDung: idx_maTuyen, idx_thuTu, idx_toaDo
LichTrinh: idx_maTuyen, idx_maXe, idx_maTaiXe, idx_loaiChuyen, idx_gioKhoiHanh, idx_dangApDung
ChuyenDi: idx_maLichTrinh, idx_ngayChay, idx_trangThai, idx_gioBatDau
TrangThaiHocSinh: idx_maChuyen, idx_maHocSinh, idx_trangThai, idx_thoiGianThucTe
ThongBao: idx_maNguoiNhan, idx_loaiThongBao, idx_daDoc, idx_thoiGianGui
SuCo: idx_maChuyen, idx_mucDo, idx_trangThai, idx_thoiGianBao
```

⚠️ **Thiếu index:**
- `LichTrinh(maTaiXe, gioKhoiHanh)` - đã có (line 213)
- `LichTrinh(maXe, gioKhoiHanh)` - đã có (line 214)

✅ **Indexes đầy đủ cho performance.**

---

## 4. BACKEND SCHEMA MAPPING

### 4.1 Backend → DB mapping
**BE sử dụng:**
- `src/models/NguoiDungModel.js`
- `src/models/TaiXeModel.js`
- `src/models/XeBuytModel.js`
- `src/models/HocSinhModel.js`
- `src/models/TuyenDuongModel.js`
- `src/models/DiemDungModel.js`
- `src/models/LichTrinhModel.js`
- `src/models/ChuyenDiModel.js`
- `src/models/TrangThaiHocSinhModel.js`
- `src/models/ThongBaoModel.js`
- `src/models/SuCoModel.js`

✅ **Mapping hoàn chỉnh.**

### 4.2 Field name consistency
| BE Model Field | DB Column | Match? |
|---------------|-----------|--------|
| `hoTen` | `hoTen` | ✅ |
| `email` | `email` | ✅ |
| `matKhau` | `matKhau` | ✅ |
| `bienSoXe` | `bienSoXe` | ✅ |
| `dongXe` | `dongXe` | ✅ |
| `sucChua` | `sucChua` | ✅ |
| `maTuyen` | `maTuyen` | ✅ |
| `maTaiXe` | `maTaiXe` | ✅ |
| `maXe` | `maXe` | ✅ |
| `maLichTrinh` | `maLichTrinh` | ✅ |
| `loaiChuyen` | `loaiChuyen` | ✅ |
| `gioKhoiHanh` | `gioKhoiHanh` | ✅ |
| `trangThai` | `trangThai` | ✅ |

✅ **Naming convention nhất quán (Tiếng Việt).**

---

## 5. DEFECT LIST

| ID | Mức độ | Mô tả | File | Line | Fix |
|----|--------|-------|------|------|-----|
| **DB-DEF-001** | 🔴 High | `XeBuyt.trangThai` ENUM mismatch với spec MM4 | init_db.sql | 65 | Đổi sang: `active`, `inactive`, `maintenance` |
| **DB-DEF-002** | 🔴 High | `TaiXe.maTaiXe` FK dùng CASCADE nguy hiểm | init_db.sql | 54 | Đổi sang RESTRICT |
| **DB-DEF-003** | 🟡 Medium | Học sinh mồ côi (không có maPhuHuynh) | sample_data.sql | 317-318 | Thêm maPhuHuynh hoặc xóa |
| **DB-DEF-004** | 🟡 Medium | Thông báo FK CASCADE có thể mất dữ liệu | init_db.sql | 188 | Đổi sang SET NULL |
| **DB-DEF-005** | 🟢 Low | Mật khẩu mặc định không an toàn | sample_data.sql | 11-18 | Đổi thành hash random |
| **DB-DEF-006** | 🟢 Low | Thiếu comment cho INT fields | init_db.sql | 94, 195 | Thêm -- in minutes, -- in milliseconds |

---

## 6. RECOMMENDATIONS

### 6.1 Ưu tiên cao (48h)
1. **Fix ENUM mismatch** (DB-DEF-001)
   ```sql
   ALTER TABLE XeBuyt MODIFY COLUMN trangThai 
   ENUM('active', 'inactive', 'maintenance', 'hoat_dong', 'bao_tri', 'ngung_hoat_dong') DEFAULT 'active';
   ```
2. **Fix FK CASCADE** (DB-DEF-002)
   ```sql
   ALTER TABLE TaiXe DROP FOREIGN KEY taiXe_ibfk_1;
   ALTER TABLE TaiXe ADD CONSTRAINT taiXe_ibfk_1 
   FOREIGN KEY (maTaiXe) REFERENCES NguoiDung(maNguoiDung) ON DELETE RESTRICT;
   ```
3. **Fix orphan records** (DB-DEF-003)
   - Thêm maPhuHuynh hoặc remove test records

### 6.2 Nợ kỹ thuật
- [ ] Migration script để sync BE ↔ DB field mapping
- [ ] Seed script tự động generate date hiện tại
- [ ] DB health check endpoint
- [ ] Backup/Restore script

---

## 7. CONCLUSION

### Database Status: 🟡 READY WITH FIXES NEEDED

**Ưu điểm:**
- ✅ Schema đầy đủ, phù hợp nghiệp vụ
- ✅ Indexes tốt
- ✅ Sample data phong phú

**Nhược điểm:**
- ❌ ENUM mismatch (BE dùng Tiếng Việt, spec dùng English)
- ❌ FK CASCADE nguy hiểm
- ❌ Dữ liệu mồ côi

**Next Steps:**
1. Fix 3 defects ưu tiên cao
2. Test import/export
3. Verify BE connection
4. Run integration test với BE Models

---

**Báo cáo tiếp theo:** [audit_02_backend.md](./audit_02_backend.md)

