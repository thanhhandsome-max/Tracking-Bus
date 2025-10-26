import pool from "../config/db.js";

const ChuyenDiModel = {
  // Lấy tất cả chuyến đi (kèm thông tin lịch trình, tuyến, xe, tài xế)
  async getAll() {
    const [rows] = await pool.query(`
      SELECT cd.*, 
             lt.loaiChuyen, lt.gioKhoiHanh, 
             td.tenTuyen, 
             xb.bienSoXe, 
             nd.hoTen AS tenTaiXe
      FROM ChuyenDi cd
      JOIN LichTrinh lt ON cd.maLichTrinh = lt.maLichTrinh
      JOIN TuyenDuong td ON lt.maTuyen = td.maTuyen
      JOIN XeBuyt xb ON lt.maXe = xb.maXe
      JOIN NguoiDung nd ON lt.maTaiXe = nd.maNguoiDung
      ORDER BY cd.ngayChay DESC
    `);
    return rows;
  },


  async getStats(ngayBatDau, ngayKetThuc) {
    const [rows] = await pool.query(
      `
      SELECT
        COUNT(cd.maChuyen) AS totalTrips,
        
        SUM(CASE 
          WHEN cd.trangThai = 'hoan_thanh' THEN 1 ELSE 0 
        END) AS completedTrips,
        
        SUM(CASE 
          WHEN cd.trangThai = 'huy' THEN 1 ELSE 0  -- Sửa từ 'bi_huy' thành 'huy' nếu DB dùng 'huy'
        END) AS cancelledTrips,
        
        SUM(CASE 
          WHEN cd.trangThai = 'hoan_thanh' AND cd.gioBatDauThucTe > lt.gioKhoiHanh 
          THEN 1 ELSE 0 
        END) AS delayedTrips,
        
        SUM(CASE 
          WHEN cd.trangThai = 'hoan_thanh' AND cd.gioBatDauThucTe <= lt.gioKhoiHanh 
          THEN 1 ELSE 0 
        END) AS onTimeTrips,
        
        AVG(
          CASE 
            WHEN cd.trangThai = 'hoan_thanh' AND cd.gioBatDauThucTe IS NOT NULL AND cd.gioKetThucThucTe IS NOT NULL
            THEN TIME_TO_SEC(TIMEDIFF(cd.gioKetThucThucTe, cd.gioBatDauThucTe)) 
            ELSE NULL 
          END
        ) AS averageDurationInSeconds

      FROM ChuyenDi cd
      JOIN LichTrinh lt ON cd.maLichTrinh = lt.maLichTrinh
      WHERE cd.ngayChay BETWEEN ? AND ?
      `,
      [ngayBatDau, ngayKetThuc]
    );
    
    // Nếu không có chuyến nào trong khoảng ngày, query có thể trả về nulls
    // Xử lý để đảm bảo trả về object với giá trị 0
    const result = rows[0];
    return {
      totalTrips: result.totalTrips || 0,
      completedTrips: result.completedTrips || 0,
      cancelledTrips: result.cancelledTrips || 0,
      delayedTrips: result.delayedTrips || 0,
      onTimeTrips: result.onTimeTrips || 0,
      averageDurationInSeconds: result.averageDurationInSeconds || 0,
    };
  },

  

  // Lấy chuyến đi theo mã
  async getById(id) {
    const [rows] = await pool.query(
      `
      SELECT cd.*, 
             lt.loaiChuyen, lt.gioKhoiHanh, 
             td.tenTuyen, 
             xb.bienSoXe, 
             nd.hoTen AS tenTaiXe
      FROM ChuyenDi cd
      JOIN LichTrinh lt ON cd.maLichTrinh = lt.maLichTrinh
      JOIN TuyenDuong td ON lt.maTuyen = td.maTuyen
      JOIN XeBuyt xb ON lt.maXe = xb.maXe
      JOIN NguoiDung nd ON lt.maTaiXe = nd.maNguoiDung
      WHERE cd.maChuyen = ?
      `,
      [id]
    );
    return rows[0];
  },

  // Tạo mới chuyến đi
  async create(data) {
    const {
      maLichTrinh,
      ngayChay,
      trangThai = "chua_khoi_hanh",
      gioBatDauThucTe = null,
      gioKetThucThucTe = null,
      ghiChu = null,
    } = data;

    const [result] = await pool.query(
      `
      INSERT INTO ChuyenDi (maLichTrinh, ngayChay, trangThai, gioBatDauThucTe, gioKetThucThucTe, ghiChu)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        maLichTrinh,
        ngayChay,
        trangThai,
        gioBatDauThucTe,
        gioKetThucThucTe,
        ghiChu,
      ]
    );

    return result.insertId;
  },

  // Cập nhật chuyến đi
  async update(id, data) {
    const {
      maLichTrinh,
      ngayChay,
      trangThai,
      gioBatDauThucTe,
      gioKetThucThucTe,
      ghiChu,
    } = data;

    const [result] = await pool.query(
      `
      UPDATE ChuyenDi
      SET maLichTrinh = ?, 
          ngayChay = ?, 
          trangThai = ?, 
          gioBatDauThucTe = ?, 
          gioKetThucThucTe = ?, 
          ghiChu = ?
      WHERE maChuyen = ?
      `,
      [
        maLichTrinh,
        ngayChay,
        trangThai,
        gioBatDauThucTe,
        gioKetThucThucTe,
        ghiChu,
        id,
      ]
    );

    return result.affectedRows > 0;
  },

  // Xóa chuyến đi
  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM ChuyenDi WHERE maChuyen = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
};

export default ChuyenDiModel;
