USE school_bus_system;

-- ==========================
-- 1. NGƯỜI DÙNG
-- ==========================
INSERT INTO NguoiDung (hoTen, email, matKhau, soDienThoai, vaiTro)
VALUES
('Nguyễn Minh Quân', 'quantri@schoolbus.vn', '123456', '0909000001', 'quan_tri'),
('Trần Văn Tài', 'taixe1@schoolbus.vn', '123456', '0909000002', 'tai_xe'),
('Lê Văn Hùng', 'taixe2@schoolbus.vn', '123456', '0909000003', 'tai_xe'),
('Phạm Thu Hương', 'phuhuynh1@schoolbus.vn', '123456', '0909000004', 'phu_huynh'),
('Ngô Đức Anh', 'phuhuynh2@schoolbus.vn', '123456', '0909000005', 'phu_huynh');

-- ==========================
-- 2. TÀI XẾ
-- ==========================
INSERT INTO TaiXe (maTaiXe, soBangLai, ngayHetHanBangLai, soNamKinhNghiem)
VALUES
(2, 'B2-123456789', '2028-05-20', 5),
(3, 'B2-987654321', '2027-12-31', 8);

-- ==========================
-- 3. HỌC SINH
-- ==========================
INSERT INTO HocSinh (hoTen, ngaySinh, lop, maPhuHuynh, diaChi)
VALUES
('Nguyễn Gia Bảo', '2015-06-15', '5A', 4, '123 Nguyễn Văn Linh, Quận 7'),
('Trần Khánh Linh', '2014-11-02', '6B', 4, '456 Huỳnh Tấn Phát, Quận 7'),
('Lê Quang Huy', '2013-08-20', '7A', 5, '12 Lê Văn Lương, Nhà Bè');

-- ==========================
-- 4. XE BUÝT
-- ==========================
INSERT INTO XeBuyt (bienSoXe, dongXe, sucChua)
VALUES
('51A-12345', 'Hyundai County', 30),
('51B-67890', 'Thaco Town', 28);

-- ==========================
-- 5. TUYẾN ĐƯỜNG
-- ==========================
INSERT INTO TuyenDuong (tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh)
VALUES
('Tuyến Quận 7 - Nhà Bè', 'Trường Tiểu học ABC', 'Khu dân cư Phú Xuân', 45),
('Tuyến Quận 4 - Quận 7', 'Trường Tiểu học ABC', 'Khu Him Lam, Quận 7', 35);

-- ==========================
-- 6. ĐIỂM DỪNG
-- ==========================
INSERT INTO DiemDung (maTuyen, tenDiem, kinhDo, viDo, thuTu)
VALUES
(1, 'Ngã tư Nguyễn Văn Linh', 106.7212, 10.7345, 1),
(1, 'Chung cư Sunrise City', 106.7075, 10.7408, 2),
(1, 'Khu dân cư Phú Xuân', 106.7041, 10.6972, 3),
(2, 'Ngã tư Khánh Hội', 106.7049, 10.7575, 1),
(2, 'Cầu Kênh Tẻ', 106.7083, 10.7450, 2),
(2, 'Khu Him Lam', 106.7101, 10.7415, 3);

-- ==========================
-- 7. LỊCH TRÌNH
-- ==========================
INSERT INTO LichTrinh (maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh)
VALUES
(1, 1, 2, 'don_sang', '06:30:00'),
(1, 1, 2, 'tra_chieu', '16:45:00'),
(2, 2, 3, 'don_sang', '06:45:00');

-- ==========================
-- 8. CHUYẾN ĐI
-- ==========================
INSERT INTO ChuyenDi (maLichTrinh, ngayChay, trangThai, gioBatDauThucTe, gioKetThucThucTe)
VALUES
(1, '2025-10-20', 'hoan_thanh', '2025-10-20 06:30:00', '2025-10-20 07:15:00'),
(2, '2025-10-20', 'dang_chay', '2025-10-20 16:45:00', NULL),
(3, '2025-10-20', 'chua_khoi_hanh', NULL, NULL);

-- ==========================
-- 9. TRẠNG THÁI HỌC SINH
-- ==========================
INSERT INTO TrangThaiHocSinh (maChuyen, maHocSinh, thuTuDiemDon, trangThai, thoiGianThucTe)
VALUES
(1, 1, 1, 'da_don', '2025-10-20 06:40:00'),
(1, 2, 2, 'da_don', '2025-10-20 06:50:00'),
(1, 3, 3, 'vang', NULL);

-- ==========================
-- 10. THÔNG BÁO
-- ==========================
INSERT INTO ThongBao (maNguoiNhan, tieuDe, noiDung, loaiThongBao)
VALUES
(4, 'Xe sắp tới điểm đón', 'Xe 51A-12345 sắp tới Ngã tư Nguyễn Văn Linh.', 'chuyen_di'),
(5, 'Xe đã đến trường', 'Học sinh của bạn đã đến trường an toàn.', 'chuyen_di'),
(2, 'Hệ thống cập nhật lịch trình mới', 'Bạn có lịch trình mới vào sáng mai lúc 6:30.', 'he_thong');

-- ==========================
-- 11. SỰ CỐ
-- ==========================
INSERT INTO SuCo (maChuyen, moTa, mucDo)
VALUES
(1, 'Xe bị kẹt xe trên đường Nguyễn Văn Linh', 'trung_binh'),
(2, 'Một học sinh bị say xe nhẹ', 'nhe');
