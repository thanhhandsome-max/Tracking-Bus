import pool from "../config/db.config.js";

const TrangThaiHocSinhModel = {
  // Lấy tất cả trạng thái học sinh trên chuyến đi
  async getAll() {
    const [rows] = await pool.query(`SELECT * FROM TrangThaiHocSinh`);
    return rows;
  },

  // Lấy trạng thái học sinh theo mã chuyến và mã học sinh
  async getById(maChuyen, maHocSinh) {
    const [rows] = await pool.query(
      `SELECT * FROM TrangThaiHocSinh WHERE maChuyen = ? AND maHocSinh = ?`,
      [maChuyen, maHocSinh]
    );
    return rows[0];
  },

  // Thêm trạng thái học sinh mới
  async create(data) {
    const {
      maChuyen,
      maHocSinh,
      thuTuDiemDon,
      trangThai,
      thoiGianThucTe,
      ghiChu,
    } = data;
    const [result] = await pool.query(
      `INSERT INTO TrangThaiHocSinh (maChuyen, maHocSinh, thuTuDiemDon, trangThai, thoiGianThucTe, ghiChu)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        maChuyen,
        maHocSinh,
        thuTuDiemDon,
        trangThai || "cho_don",
        thoiGianThucTe,
        ghiChu,
      ]
    );
    return result.insertId;
  },

  // Cập nhật trạng thái học sinh
  async update(maChuyen, maHocSinh, data) {
    const { thuTuDiemDon, trangThai, thoiGianThucTe, ghiChu } = data;
    const [result] = await pool.query(
      `UPDATE TrangThaiHocSinh SET thuTuDiemDon = ?, trangThai = ?, thoiGianThucTe = ?, ghiChu = ?
       WHERE maChuyen = ? AND maHocSinh = ?`,
      [thuTuDiemDon, trangThai, thoiGianThucTe, ghiChu, maChuyen, maHocSinh]
    );
    return result.affectedRows > 0;
  },

  // Xóa trạng thái học sinh
  async delete(maChuyen, maHocSinh) {
    const [result] = await pool.query(
      `DELETE FROM TrangThaiHocSinh WHERE maChuyen = ? AND maHocSinh = ?`,
      [maChuyen, maHocSinh]
    );
    return result.affectedRows > 0;
  },
};

export default TrangThaiHocSinhModel;
