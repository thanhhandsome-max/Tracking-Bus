import pool from "../config/db.config.js";

const LichTrinhModel = {
  // Lấy tất cả lịch trình
  async getAll() {
    const [rows] = await pool.query(`
      SELECT lt.*, td.tenTuyen, xb.bienSoXe, nd.hoTen AS tenTaiXe
      FROM LichTrinh lt
      JOIN TuyenDuong td ON lt.maTuyen = td.maTuyen
      JOIN XeBuyt xb ON lt.maXe = xb.maXe
      JOIN NguoiDung nd ON lt.maTaiXe = nd.maNguoiDung
    `);
    return rows;
  },

  // Lấy lịch trình theo mã
  async getById(id) {
    const [rows] = await pool.query(
      `
      SELECT lt.*, td.tenTuyen, xb.bienSoXe, nd.hoTen AS tenTaiXe
      FROM LichTrinh lt
      JOIN TuyenDuong td ON lt.maTuyen = td.maTuyen
      JOIN XeBuyt xb ON lt.maXe = xb.maXe
      JOIN NguoiDung nd ON lt.maTaiXe = nd.maNguoiDung
      WHERE lt.maLichTrinh = ?
      `,
      [id]
    );
    return rows[0];
  },

  // Thêm lịch trình mới
  async create(data) {
    const { maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh, dangApDung } =
      data;
    const [result] = await pool.query(
      `
      INSERT INTO LichTrinh (maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh, dangApDung)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh, dangApDung ?? true]
    );
    return result.insertId;
  },

  // Cập nhật lịch trình
  async update(id, data) {
    const { maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh, dangApDung } =
      data;
    const [result] = await pool.query(
      `
      UPDATE LichTrinh
      SET maTuyen = ?, maXe = ?, maTaiXe = ?, loaiChuyen = ?, gioKhoiHanh = ?, dangApDung = ?
      WHERE maLichTrinh = ?
      `,
      [maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh, dangApDung, id]
    );
    return result.affectedRows > 0;
  },

  // Xóa lịch trình
  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM LichTrinh WHERE maLichTrinh = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
};

export default LichTrinhModel;
