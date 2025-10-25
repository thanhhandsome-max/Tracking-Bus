import pool from "../config/db.config.js";

const NguoiDungModel = {
  // Lấy tất cả người dùng
  async getAll() {
    const [rows] = await pool.query("SELECT * FROM NguoiDung");
    return rows;
  },

  // Lấy người dùng theo mã
  async getById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM NguoiDung WHERE maNguoiDung = ?",
      [id]
    );
    return rows[0];
  },

  // Tạo người dùng mới
  async create(data) {
    const {
      hoTen,
      email,
      matKhau,
      soDienThoai,
      anhDaiDien,
      vaiTro,
      trangThai,
    } = data;
    const [result] = await pool.query(
      `INSERT INTO NguoiDung 
        (hoTen, email, matKhau, soDienThoai, anhDaiDien, vaiTro, trangThai) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        hoTen,
        email,
        matKhau,
        soDienThoai,
        anhDaiDien,
        vaiTro,
        trangThai ?? true,
      ]
    );
    return result.insertId;
  },

  // Cập nhật thông tin người dùng
  async update(id, data) {
    const {
      hoTen,
      email,
      matKhau,
      soDienThoai,
      anhDaiDien,
      vaiTro,
      trangThai,
    } = data;
    const [result] = await pool.query(
      `UPDATE NguoiDung 
       SET hoTen = ?, email = ?, matKhau = ?, soDienThoai = ?, anhDaiDien = ?, vaiTro = ?, trangThai = ? 
       WHERE maNguoiDung = ?`,
      [hoTen, email, matKhau, soDienThoai, anhDaiDien, vaiTro, trangThai, id]
    );
    return result.affectedRows;
  },

  // Xóa người dùng
  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM NguoiDung WHERE maNguoiDung = ?",
      [id]
    );
    return result.affectedRows;
  },

  // Lấy người dùng theo email (dùng cho đăng nhập)
  async getByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM NguoiDung WHERE email = ?", [
      email,
    ]);
    return rows[0];
  },
};

export default NguoiDungModel;
