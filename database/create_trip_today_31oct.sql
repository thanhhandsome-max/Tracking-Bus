-- ═══════════════════════════════════════════════════════════════════════════
-- 🚌 TẠO CHUYẾN ĐI HÔM NAY (2025-10-31) - TEST GPS TRACKING
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- 📝 HƯỚNG DẪN:
-- 1. Mở MySQL Workbench hoặc phpMyAdmin
-- 2. Chọn database: school_bus_system
-- 3. Copy toàn bộ script này và Execute
-- 4. Kiểm tra kết quả: SELECT * FROM ChuyenDi WHERE ngayChay = '2025-10-31';
--
-- ═══════════════════════════════════════════════════════════════════════════

USE school_bus_system;

-- ───────────────────────────────────────────────────────────────────────────
-- 🗑️ XÓA DỮ LIỆU CŨ (nếu có)
-- ───────────────────────────────────────────────────────────────────────────

DELETE FROM TrangThaiHocSinh WHERE maChuyen IN (
  SELECT maChuyen FROM ChuyenDi WHERE ngayChay = '2025-10-31'
);

DELETE FROM ChuyenDi WHERE ngayChay = '2025-10-31';

-- ───────────────────────────────────────────────────────────────────────────
-- 🚌 TẠO CHUYẾN ĐI MỚI CHO HÔM NAY
-- ───────────────────────────────────────────────────────────────────────────

-- Chuyến 1: Tuyến Quận 7 - Nhà Bè - Đón sáng (Tài xế: Trần Văn Tài - ID: 2)
INSERT INTO ChuyenDi (maLichTrinh, ngayChay, trangThai, ghiChu) VALUES
(1, '2025-10-31', 'chua_khoi_hanh', '🌅 Tuyến Quận 7 - Nhà Bè - Đón sáng - Xe 51A-12345');

-- Chuyến 2: Tuyến Quận 7 - Nhà Bè - Trả chiều
INSERT INTO ChuyenDi (maLichTrinh, ngayChay, trangThai, ghiChu) VALUES
(2, '2025-10-31', 'chua_khoi_hanh', '🌆 Tuyến Quận 7 - Nhà Bè - Trả chiều - Xe 51A-12345');

-- Chuyến 3: Tuyến Quận 4 - Quận 7 - Đón sáng (Tài xế: Lê Văn Hùng - ID: 3)
INSERT INTO ChuyenDi (maLichTrinh, ngayChay, trangThai, ghiChu) VALUES
(3, '2025-10-31', 'chua_khoi_hanh', '🌅 Tuyến Quận 4 - Quận 7 - Đón sáng - Xe 51B-67890');

-- Chuyến 4: Tuyến Quận 4 - Quận 7 - Trả chiều
INSERT INTO ChuyenDi (maLichTrinh, ngayChay, trangThai, ghiChu) VALUES
(4, '2025-10-31', 'chua_khoi_hanh', '🌆 Tuyến Quận 4 - Quận 7 - Trả chiều - Xe 51B-67890');

-- Chuyến 5: Tuyến Quận 7 - Quận 1 - Đón sáng (Tài xế: Hoàng Văn Nam - ID: 7)
INSERT INTO ChuyenDi (maLichTrinh, ngayChay, trangThai, ghiChu) VALUES
(5, '2025-10-31', 'chua_khoi_hanh', '🌅 Tuyến Quận 7 - Quận 1 - Đón sáng - Xe 51C-11111');

-- Chuyến 6: Tuyến Quận 7 - Quận 1 - Trả chiều
INSERT INTO ChuyenDi (maLichTrinh, ngayChay, trangThai, ghiChu) VALUES
(6, '2025-10-31', 'chua_khoi_hanh', '🌆 Tuyến Quận 7 - Quận 1 - Trả chiều - Xe 51C-11111');

-- ───────────────────────────────────────────────────────────────────────────
-- 👶 THÊM HỌC SINH VÀO CHUYẾN ĐI
-- ───────────────────────────────────────────────────────────────────────────

-- Lấy ID chuyến đi vừa tạo (giả sử bắt đầu từ ID 22)
SET @trip1 = LAST_INSERT_ID() - 5;
SET @trip2 = LAST_INSERT_ID() - 4;
SET @trip3 = LAST_INSERT_ID() - 3;
SET @trip4 = LAST_INSERT_ID() - 2;
SET @trip5 = LAST_INSERT_ID() - 1;
SET @trip6 = LAST_INSERT_ID();

-- Chuyến 1: Đón sáng Tuyến 1 (3 học sinh)
INSERT INTO TrangThaiHocSinh (maChuyen, maHocSinh, thuTuDiemDon, trangThai, ghiChu) VALUES
(@trip1, 1, 1, 'cho_don', 'Nguyễn Gia Bảo - Điểm 1'),
(@trip1, 2, 2, 'cho_don', 'Trần Khánh Linh - Điểm 2'),
(@trip1, 3, 3, 'cho_don', 'Lê Quang Huy - Điểm 3');

-- Chuyến 2: Trả chiều Tuyến 1 (3 học sinh)
INSERT INTO TrangThaiHocSinh (maChuyen, maHocSinh, thuTuDiemDon, trangThai, ghiChu) VALUES
(@trip2, 1, 1, 'cho_don', 'Nguyễn Gia Bảo - Điểm 1'),
(@trip2, 2, 2, 'cho_don', 'Trần Khánh Linh - Điểm 2'),
(@trip2, 3, 3, 'cho_don', 'Lê Quang Huy - Điểm 3');

-- Chuyến 3: Đón sáng Tuyến 2 (3 học sinh)
INSERT INTO TrangThaiHocSinh (maChuyen, maHocSinh, thuTuDiemDon, trangThai, ghiChu) VALUES
(@trip3, 4, 1, 'cho_don', 'Phạm Minh Anh - Điểm 1'),
(@trip3, 5, 2, 'cho_don', 'Ngô Thị Lan - Điểm 2'),
(@trip3, 6, 3, 'cho_don', 'Võ Đức Minh - Điểm 3');

-- Chuyến 4: Trả chiều Tuyến 2 (3 học sinh)
INSERT INTO TrangThaiHocSinh (maChuyen, maHocSinh, thuTuDiemDon, trangThai, ghiChu) VALUES
(@trip4, 4, 1, 'cho_don', 'Phạm Minh Anh - Điểm 1'),
(@trip4, 5, 2, 'cho_don', 'Ngô Thị Lan - Điểm 2'),
(@trip4, 6, 3, 'cho_don', 'Võ Đức Minh - Điểm 3');

-- Chuyến 5: Đón sáng Tuyến 3 (3 học sinh)
INSERT INTO TrangThaiHocSinh (maChuyen, maHocSinh, thuTuDiemDon, trangThai, ghiChu) VALUES
(@trip5, 7, 1, 'cho_don', 'Hoàng Thị Hoa - Điểm 1'),
(@trip5, 8, 2, 'cho_don', 'Lý Văn Đức - Điểm 2'),
(@trip5, 9, 3, 'cho_don', 'Trần Thị Mai - Điểm 3');

-- Chuyến 6: Trả chiều Tuyến 3 (3 học sinh)
INSERT INTO TrangThaiHocSinh (maChuyen, maHocSinh, thuTuDiemDon, trangThai, ghiChu) VALUES
(@trip6, 7, 1, 'cho_don', 'Hoàng Thị Hoa - Điểm 1'),
(@trip6, 8, 2, 'cho_don', 'Lý Văn Đức - Điểm 2'),
(@trip6, 9, 3, 'cho_don', 'Trần Thị Mai - Điểm 3');

-- ───────────────────────────────────────────────────────────────────────────
-- ✅ KIỂM TRA KẾT QUẢ
-- ───────────────────────────────────────────────────────────────────────────

SELECT '🎉 ═══════════════════════════════════════════════════════════════════════════' as '';
SELECT '✅ Đã tạo thành công chuyến đi cho ngày 2025-10-31!' as 'Kết quả';
SELECT '🎉 ═══════════════════════════════════════════════════════════════════════════' as '';

-- Hiển thị danh sách chuyến đi hôm nay
SELECT 
  c.maChuyen as 'ID Chuyến',
  c.ngayChay as 'Ngày',
  c.trangThai as 'Trạng thái',
  l.loaiChuyen as 'Loại',
  t.tenTuyen as 'Tuyến đường',
  x.bienSoXe as 'Biển số',
  tx.tenTaiXe as 'Tài xế',
  c.ghiChu as 'Ghi chú',
  (SELECT COUNT(*) FROM TrangThaiHocSinh WHERE maChuyen = c.maChuyen) as 'Số HS'
FROM ChuyenDi c
JOIN LichTrinh l ON c.maLichTrinh = l.maLichTrinh
JOIN TuyenDuong t ON l.maTuyen = t.maTuyen
JOIN XeBuyt x ON l.maXe = x.maXe
JOIN TaiXe tx ON l.maTaiXe = tx.maTaiXe
WHERE c.ngayChay = '2025-10-31'
ORDER BY c.maChuyen;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📋 THÔNG TIN TÀI XẾ VÀ CHUYẾN ĐI
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Tài xế: Trần Văn Tài (taixe1@schoolbus.vn / password)
-- - Chuyến 1: Tuyến Quận 7 - Nhà Bè - Đón sáng
-- - Chuyến 2: Tuyến Quận 7 - Nhà Bè - Trả chiều
-- 
-- Tài xế: Lê Văn Hùng (taixe2@schoolbus.vn / password)
-- - Chuyến 3: Tuyến Quận 4 - Quận 7 - Đón sáng
-- - Chuyến 4: Tuyến Quận 4 - Quận 7 - Trả chiều
-- 
-- Tài xế: Hoàng Văn Nam (taixe3@schoolbus.vn / password)
-- - Chuyến 5: Tuyến Quận 7 - Quận 1 - Đón sáng
-- - Chuyến 6: Tuyến Quận 7 - Quận 1 - Trả chiều
-- 
-- ═══════════════════════════════════════════════════════════════════════════
-- 🧪 TEST GPS TRACKING
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- 1. Login vào Frontend: taixe1@schoolbus.vn / password
-- 2. Vào Driver Dashboard
-- 3. Chọn chuyến đi hôm nay (2025-10-31)
-- 4. Nhấn "Bắt đầu chuyến đi"
-- 5. Cho phép trình duyệt truy cập vị trí
-- 6. GPS sẽ tự động gửi vị trí mỗi 3 giây!
-- 
-- ═══════════════════════════════════════════════════════════════════════════
