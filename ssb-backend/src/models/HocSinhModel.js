import pool from "../config/db.js";

const HocSinhModel = {
  // Lấy tất cả học sinh
  async getAll() {
    const [rows] = await pool.query(
      `SELECT 
        hs.*,
        nd.hoTen as tenPhuHuynh,
        nd.soDienThoai as sdtPhuHuynh,
        nd.email as emailPhuHuynh
       FROM HocSinh hs
       LEFT JOIN NguoiDung nd ON hs.maPhuHuynh = nd.maNguoiDung
       WHERE hs.trangThai = TRUE
       ORDER BY hs.hoTen`
    );
    return rows;
  },

  // Lấy học sinh theo ID
  async getById(id) {
    const [rows] = await pool.query(
      `SELECT 
        hs.*,
        nd.hoTen as tenPhuHuynh,
        nd.soDienThoai as sdtPhuHuynh,
        nd.email as emailPhuHuynh
       FROM HocSinh hs
       LEFT JOIN NguoiDung nd ON hs.maPhuHuynh = nd.maNguoiDung
       WHERE hs.maHocSinh = ?`,
      [id]
    );
    return rows[0];
  },

  // Lấy học sinh theo phụ huynh
  async getByParent(maPhuHuynh) {
    const [rows] = await pool.query(
      `SELECT * FROM HocSinh 
       WHERE maPhuHuynh = ? AND trangThai = TRUE
       ORDER BY hoTen`,
      [maPhuHuynh]
    );
    return rows;
  },

  // Lấy học sinh theo lớp
  async getByClass(lop) {
    const [rows] = await pool.query(
      `SELECT 
        hs.*,
        nd.hoTen as tenPhuHuynh,
        nd.soDienThoai as sdtPhuHuynh
       FROM HocSinh hs
       LEFT JOIN NguoiDung nd ON hs.maPhuHuynh = nd.maNguoiDung
       WHERE hs.lop = ? AND hs.trangThai = TRUE
       ORDER BY hs.hoTen`,
      [lop]
    );
    return rows;
  },

  // Tạo học sinh mới
  async create(data) {
    const { hoTen, ngaySinh, lop, maPhuHuynh, diaChi, anhDaiDien } = data;
    const [result] = await pool.query(
      `INSERT INTO HocSinh (hoTen, ngaySinh, lop, maPhuHuynh, diaChi, anhDaiDien)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [hoTen, ngaySinh, lop, maPhuHuynh, diaChi, anhDaiDien]
    );
    return result.insertId;
  },

  // Cập nhật thông tin học sinh (partial update)
  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.hoTen !== undefined) {
      fields.push("hoTen = ?");
      values.push(data.hoTen);
    }
    if (data.ngaySinh !== undefined) {
      fields.push("ngaySinh = ?");
      values.push(data.ngaySinh);
    }
    if (data.lop !== undefined) {
      fields.push("lop = ?");
      values.push(data.lop);
    }
    if (data.maPhuHuynh !== undefined) {
      fields.push("maPhuHuynh = ?");
      values.push(data.maPhuHuynh);
    }
    if (data.diaChi !== undefined) {
      fields.push("diaChi = ?");
      values.push(data.diaChi);
    }
    if (data.anhDaiDien !== undefined) {
      fields.push("anhDaiDien = ?");
      values.push(data.anhDaiDien);
    }
    if (data.trangThai !== undefined) {
      fields.push("trangThai = ?");
      values.push(data.trangThai);
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(id);
    const query = `UPDATE HocSinh SET ${fields.join(", ")} WHERE maHocSinh = ?`;

    const [result] = await pool.query(query, values);
    return result.affectedRows > 0;
  },

  // Xóa học sinh (soft delete)
  async delete(id) {
    const [result] = await pool.query(
      "UPDATE HocSinh SET trangThai = FALSE WHERE maHocSinh = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  // Xóa vĩnh viễn
  async hardDelete(id) {
    const [result] = await pool.query(
      "DELETE FROM HocSinh WHERE maHocSinh = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  // Gán phụ huynh cho học sinh
  async assignParent(maHocSinh, maPhuHuynh) {
    const [result] = await pool.query(
      "UPDATE HocSinh SET maPhuHuynh = ? WHERE maHocSinh = ?",
      [maPhuHuynh, maHocSinh]
    );
    return result.affectedRows > 0;
  },

  // Thống kê học sinh
  async getStats() {
    const [totalResult] = await pool.query(
      `SELECT COUNT(*) as total FROM HocSinh WHERE trangThai = TRUE`
    );

    const [classCounts] = await pool.query(
      `SELECT lop, COUNT(*) as count 
       FROM HocSinh 
       WHERE trangThai = TRUE 
       GROUP BY lop 
       ORDER BY lop`
    );

    const [withParent] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM HocSinh 
       WHERE maPhuHuynh IS NOT NULL AND trangThai = TRUE`
    );

    return {
      total: totalResult[0].total || 0,
      byClass: classCounts || [],
      withParent: withParent[0].count || 0,
    };
  },

  // Alias for getAll (which already includes parent info)
  async getWithParentInfo() {
    return this.getAll();
  },
};

export default HocSinhModel;
