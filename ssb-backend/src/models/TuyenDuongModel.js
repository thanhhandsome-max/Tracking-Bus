import pool from "../config/db.js";

const TuyenDuongModel = {
  // Lấy tất cả tuyến đường
  async getAll() {
    const [rows] = await pool.query(
      `SELECT * FROM TuyenDuong WHERE trangThai = TRUE ORDER BY tenTuyen`
    );
    return rows;
  },

  // Lấy tuyến đường theo ID (không bao gồm stops - stops sẽ lấy riêng qua RouteStopModel)
  async getById(id) {
    const [tuyen] = await pool.query(
      `SELECT * FROM TuyenDuong WHERE maTuyen = ?`,
      [id]
    );

    if (tuyen.length === 0) {
      return null;
    }

    return tuyen[0];
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
    const {
      tenTuyen,
      diemBatDau,
      diemKetThuc,
      thoiGianUocTinh,
      origin_lat,
      origin_lng,
      dest_lat,
      dest_lng,
      polyline,
    } = data;
    const [result] = await pool.query(
      `INSERT INTO TuyenDuong 
       (tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh, 
        origin_lat, origin_lng, dest_lat, dest_lng, polyline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenTuyen,
        diemBatDau,
        diemKetThuc,
        thoiGianUocTinh,
        origin_lat || null,
        origin_lng || null,
        dest_lat || null,
        dest_lng || null,
        polyline || null,
      ]
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
    if (data.origin_lat !== undefined) {
      fields.push("origin_lat = ?");
      values.push(data.origin_lat);
    }
    if (data.origin_lng !== undefined) {
      fields.push("origin_lng = ?");
      values.push(data.origin_lng);
    }
    if (data.dest_lat !== undefined) {
      fields.push("dest_lat = ?");
      values.push(data.dest_lat);
    }
    if (data.dest_lng !== undefined) {
      fields.push("dest_lng = ?");
      values.push(data.dest_lng);
    }
    if (data.polyline !== undefined) {
      fields.push("polyline = ?");
      values.push(data.polyline);
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
