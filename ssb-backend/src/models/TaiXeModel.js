import pool from "../config/db.js";

const TaiXeModel = {
  // Lấy tất cả tài xế
  async getAll() {
    const [rows] = await pool.query("SELECT * FROM TaiXe");
    return rows;
  },

  // Lấy tài xế theo mã
  async getById(id) {
    const [rows] = await pool.query("SELECT * FROM TaiXe WHERE maTaiXe = ?", [
      id,
    ]);
    return rows[0];
  },

  // Tạo mới tài xế
  async create(data) {
    const {
      maTaiXe,
      soBangLai,
      ngayHetHanBangLai,
      soNamKinhNghiem,
      trangThai,
    } = data;
    const [result] = await pool.query(
      `INSERT INTO TaiXe (maTaiXe, soBangLai, ngayHetHanBangLai, soNamKinhNghiem, trangThai)
       VALUES (?, ?, ?, ?, ?)`,
      [
        maTaiXe,
        soBangLai,
        ngayHetHanBangLai,
        soNamKinhNghiem,
        trangThai ?? "hoat_dong",
      ]
    );
    return result.insertId;
  },

  // Cập nhật thông tin tài xế
  async update(id, data) {
    const { soBangLai, ngayHetHanBangLai, soNamKinhNghiem, trangThai } = data;
    const [result] = await pool.query(
      `UPDATE TaiXe 
       SET soBangLai = ?, ngayHetHanBangLai = ?, soNamKinhNghiem = ?, trangThai = ?
       WHERE maTaiXe = ?`,
      [soBangLai, ngayHetHanBangLai, soNamKinhNghiem, trangThai, id]
    );
    return result.affectedRows;
  },

  // Xóa tài xế (khi xóa thì do có ràng buộc ON DELETE CASCADE, nên nếu xóa NguoiDung cũng tự mất)
  async delete(id) {
    const [result] = await pool.query("DELETE FROM TaiXe WHERE maTaiXe = ?", [
      id,
    ]);
    return result.affectedRows;
  },

  // Lấy thông tin tài xế cùng thông tin người dùng liên quan
  async getWithUserInfo() {
    const [rows] = await pool.query(`
      SELECT tx.*, nd.hoTen, nd.email, nd.soDienThoai, nd.vaiTro
      FROM TaiXe tx
      JOIN NguoiDung nd ON tx.maTaiXe = nd.maNguoiDung
    `);
    return rows;
  },
};

export default TaiXeModel;
