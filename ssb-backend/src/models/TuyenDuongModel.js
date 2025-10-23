import pool from "../config/db.config.js";

const TuyenDuongModel = {
  // Lấy tất cả tuyến đường
  async getAll() {
    const [rows] = await pool.query("SELECT * FROM TuyenDuong");
    return rows;
  },

  // Lấy tuyến đường theo mã
  async getById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM TuyenDuong WHERE maTuyen = ?",
      [id]
    );
    return rows[0];
  },

  // Thêm tuyến đường mới
  async create(data) {
    const { tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh } = data;
    const [result] = await pool.query(
      `INSERT INTO TuyenDuong (tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh)
       VALUES (?, ?, ?, ?)`,
      [tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh]
    );
    return result.insertId;
  },

  // Cập nhật tuyến đường
  async update(id, data) {
    const { tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh } = data;
    const [result] = await pool.query(
      `UPDATE TuyenDuong
       SET tenTuyen = ?, diemBatDau = ?, diemKetThuc = ?, thoiGianUocTinh = ?
       WHERE maTuyen = ?`,
      [tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh, id]
    );
    return result.affectedRows > 0;
  },

  // Xóa tuyến đường
  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM TuyenDuong WHERE maTuyen = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
};

export default TuyenDuongModel;
