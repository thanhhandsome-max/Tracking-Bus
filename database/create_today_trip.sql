-- ═══════════════════════════════════════════════════════════════════════════
-- 🚌 CREATE TRIPS FOR TODAY (2025-10-30)
-- ═══════════════════════════════════════════════════════════════════════════

USE school_bus_system;

-- Insert trips for today
INSERT INTO ChuyenDi (maLichTrinh, ngayChay, trangThai, ghiChu) VALUES
(1, '2025-10-30', 'chua_khoi_hanh', 'Tuyến Quận 7 - Nhà Bè - Đón sáng'),
(2, '2025-10-30', 'chua_khoi_hanh', 'Tuyến Quận 7 - Nhà Bè - Trả chiều'),
(3, '2025-10-30', 'chua_khoi_hanh', 'Tuyến Quận 4 - Quận 7 - Đón sáng'),
(4, '2025-10-30', 'chua_khoi_hanh', 'Tuyến Quận 4 - Quận 7 - Trả chiều'),
(5, '2025-10-30', 'chua_khoi_hanh', 'Tuyến Quận 7 - Quận 1 - Đón sáng'),
(6, '2025-10-30', 'chua_khoi_hanh', 'Tuyến Quận 7 - Quận 1 - Trả chiều');

-- Add students to trips
INSERT INTO TrangThaiHocSinh (maChuyen, maHocSinh, thuTuDiemDon, trangThai, ghiChu) VALUES
-- Trip 1 (Tuyến 1 - Đón sáng)
(16, 1, 1, 'cho_don', 'Nguyễn Gia Bảo'),
(16, 2, 2, 'cho_don', 'Trần Khánh Linh'),
(16, 3, 3, 'cho_don', 'Lê Quang Huy'),
-- Trip 2 (Tuyến 1 - Trả chiều)
(17, 1, 1, 'cho_don', 'Nguyễn Gia Bảo'),
(17, 2, 2, 'cho_don', 'Trần Khánh Linh'),
(17, 3, 3, 'cho_don', 'Lê Quang Huy'),
-- Trip 3 (Tuyến 2 - Đón sáng)
(18, 4, 1, 'cho_don', 'Phạm Minh Anh'),
(18, 5, 2, 'cho_don', 'Ngô Thị Lan'),
(18, 6, 3, 'cho_don', 'Võ Đức Minh'),
-- Trip 4 (Tuyến 2 - Trả chiều)
(19, 4, 1, 'cho_don', 'Phạm Minh Anh'),
(19, 5, 2, 'cho_don', 'Ngô Thị Lan'),
(19, 6, 3, 'cho_don', 'Võ Đức Minh'),
-- Trip 5 (Tuyến 3 - Đón sáng)
(20, 7, 1, 'cho_don', 'Hoàng Thị Hoa'),
(20, 8, 2, 'cho_don', 'Lý Văn Đức'),
(20, 9, 3, 'cho_don', 'Trần Thị Mai'),
-- Trip 6 (Tuyến 3 - Trả chiều)
(21, 7, 1, 'cho_don', 'Hoàng Thị Hoa'),
(21, 8, 2, 'cho_don', 'Lý Văn Đức'),
(21, 9, 3, 'cho_don', 'Trần Thị Mai');

-- Verify trips created
SELECT 
  c.maChuyen,
  c.ngayChay,
  c.trangThai,
  l.loaiChuyen,
  t.tenTuyen,
  x.bienSoXe,
  tx.tenTaiXe
FROM ChuyenDi c
JOIN LichTrinh l ON c.maLichTrinh = l.maLichTrinh
JOIN TuyenDuong t ON l.maTuyen = t.maTuyen
JOIN XeBuyt x ON l.maXe = x.maXe
JOIN TaiXe tx ON l.maTaiXe = tx.maTaiXe
WHERE c.ngayChay = '2025-10-30'
ORDER BY c.maChuyen;

SELECT '✅ Trips for today (2025-10-30) created successfully!' as message;
