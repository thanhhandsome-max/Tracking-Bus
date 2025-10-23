import pool from "../config/db.config.js";

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
