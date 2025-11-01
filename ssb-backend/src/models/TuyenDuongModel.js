import pool from "../config/db.js";

const TuyenDuongModel = {
  // Lấy tất cả tuyến đường
  async getAll() {
    const [rows] = await pool.query(
      `SELECT * FROM TuyenDuong WHERE trangThai = TRUE ORDER BY tenTuyen`
    );
    return rows;
  },

  // Lấy tuyến đường theo ID (bao gồm các điểm dừng)
  async getById(id) {
    const [tuyen] = await pool.query(
      `SELECT * FROM TuyenDuong WHERE maTuyen = ?`,
      [id]
    );

    if (tuyen.length === 0) {
      return null;
    }

    // Lấy danh sách điểm dừng
    const [diemDung] = await pool.query(
      `SELECT * FROM DiemDung 
       WHERE maTuyen = ? 
       ORDER BY thuTu`,
      [id]
    );

    return {
      ...tuyen[0],
      diemDung: diemDung || [],
    };
  },

  // Lấy tuyến đường theo tên
  async getByName(tenTuyen) {
    const [tuyen] = await pool.query(
      `SELECT * FROM TuyenDuong WHERE tenTuyen = ?`,
      [tenTuyen]
    );
    return tuyen.length > 0 ? tuyen[0] : null;
  },

  // Tạo tuyến đường mới
  async create(data) {
    const { tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh } = data;
    const [result] = await pool.query(
      `INSERT INTO TuyenDuong (tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh)
       VALUES (?, ?, ?, ?)`,
      [tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh]
    );
    return result.insertId;
  },

  // Cập nhật tuyến đường (partial update)
  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.tenTuyen !== undefined) {
      fields.push("tenTuyen = ?");
      values.push(data.tenTuyen);
    }
    if (data.diemBatDau !== undefined) {
      fields.push("diemBatDau = ?");
      values.push(data.diemBatDau);
    }
    if (data.diemKetThuc !== undefined) {
      fields.push("diemKetThuc = ?");
      values.push(data.diemKetThuc);
    }
    if (data.thoiGianUocTinh !== undefined) {
      fields.push("thoiGianUocTinh = ?");
      values.push(data.thoiGianUocTinh);
    }
    if (data.trangThai !== undefined) {
      fields.push("trangThai = ?");
      values.push(data.trangThai);
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(id);
    const query = `UPDATE TuyenDuong SET ${fields.join(
      ", "
    )} WHERE maTuyen = ?`;

    const [result] = await pool.query(query, values);
    return result.affectedRows > 0;
  },

  // Xóa tuyến đường (soft delete)
  async delete(id) {
    const [result] = await pool.query(
      "UPDATE TuyenDuong SET trangThai = FALSE WHERE maTuyen = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  // Xóa vĩnh viễn
  async hardDelete(id) {
    const [result] = await pool.query(
      "DELETE FROM TuyenDuong WHERE maTuyen = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  // Thống kê tuyến đường
  async getStats() {
    const [totalResult] = await pool.query(
      `SELECT COUNT(*) as total FROM TuyenDuong WHERE trangThai = TRUE`
    );

    const [avgTime] = await pool.query(
      `SELECT AVG(thoiGianUocTinh) as avgTime FROM TuyenDuong WHERE trangThai = TRUE`
    );

    return {
      total: totalResult[0].total || 0,
      avgTime: Math.round(avgTime[0].avgTime || 0),
    };
  },
};

export default TuyenDuongModel;
