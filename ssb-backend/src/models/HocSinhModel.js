import pool from "../config/db.js";

const HocSinhModel = {
  // Lấy tất cả học sinh
  async getAll() {
    const [rows] = await pool.query("SELECT * FROM HocSinh");
    return rows;
  },

  // Lấy học sinh theo mã
  async getById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM HocSinh WHERE maHocSinh = ?",
      [id]
    );
    return rows[0];
  },

  // Tạo học sinh mới
  async create(data) {
    const { hoTen, ngaySinh, lop, maPhuHuynh, diaChi, anhDaiDien } = data;
    const [result] = await pool.query(
      `INSERT INTO HocSinh (hoTen, ngaySinh, lop, maPhuHuynh, diaChi, anhDaiDien)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [hoTen, ngaySinh, lop, maPhuHuynh ?? null, diaChi, anhDaiDien]
    );
    return result.insertId;
  },

  // Cập nhật thông tin học sinh
  async update(id, data) {
    const { hoTen, ngaySinh, lop, maPhuHuynh, diaChi, anhDaiDien } = data;
    const [result] = await pool.query(
      `UPDATE HocSinh
       SET hoTen = ?, ngaySinh = ?, lop = ?, maPhuHuynh = ?, diaChi = ?, anhDaiDien = ?
       WHERE maHocSinh = ?`,
      [hoTen, ngaySinh, lop, maPhuHuynh ?? null, diaChi, anhDaiDien, id]
    );
    return result.affectedRows > 0;
  },

  // Xóa học sinh
  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM HocSinh WHERE maHocSinh = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  // Lấy thông tin học sinh cùng thông tin phụ huynh
  async getWithParentInfo() {
    const [rows] = await pool.query(`
      SELECT hs.*, nd.hoTen AS tenPhuHuynh, nd.email AS emailPhuHuynh, nd.soDienThoai AS sdtPhuHuynh
      FROM HocSinh hs
      LEFT JOIN NguoiDung nd ON hs.maPhuHuynh = nd.maNguoiDung
    `);
    return rows;
  },
};

export default HocSinhModel;
