import pool from "../config/db.config.js";

const XeBuytModel = {
  // Lấy tất cả xe buýt
  async getAll() {
    const [rows] = await pool.query("SELECT * FROM XeBuyt");
    return rows;
  },

  // Lấy xe buýt theo mã
  async getById(id) {
    const [rows] = await pool.query("SELECT * FROM XeBuyt WHERE maXe = ?", [
      id,
    ]);
    return rows[0];
  },

  // Thêm xe buýt mới
  async create(data) {
    const { bienSoXe, dongXe, sucChua, trangThai } = data;
    const [result] = await pool.query(
      `INSERT INTO XeBuyt (bienSoXe, dongXe, sucChua, trangThai)
       VALUES (?, ?, ?, ?)`,
      [bienSoXe, dongXe, sucChua, trangThai || "hoat_dong"]
    );
    return result.insertId;
  },

  // Cập nhật thông tin xe buýt
  async update(id, data) {
    const { bienSoXe, dongXe, sucChua, trangThai } = data;
    const [result] = await pool.query(
      `UPDATE XeBuyt
       SET bienSoXe = ?, dongXe = ?, sucChua = ?, trangThai = ?
       WHERE maXe = ?`,
      [bienSoXe, dongXe, sucChua, trangThai, id]
    );
    return result.affectedRows > 0;
  },

  // Xóa xe buýt
  async delete(id) {
    const [result] = await pool.query("DELETE FROM XeBuyt WHERE maXe = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  },

  // Lọc xe buýt theo trạng thái (tuỳ chọn)
  async getByStatus(status) {
    const [rows] = await pool.query(
      "SELECT * FROM XeBuyt WHERE trangThai = ?",
      [status]
    );
    return rows;
  },
};

export default XeBuytModel;
