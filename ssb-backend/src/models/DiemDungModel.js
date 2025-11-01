import pool from "../config/db.js";

const DiemDungModel = {
  // Lấy tất cả điểm dừng của một tuyến
  async getByRoute(maTuyen) {
    const [rows] = await pool.query(
      `SELECT * FROM DiemDung WHERE maTuyen = ? ORDER BY thuTu`,
      [maTuyen]
    );
    return rows;
  },

  // Alias for getByRoute (used by telemetryService)
  async getByRouteId(maTuyen) {
    return this.getByRoute(maTuyen);
  },

  // Lấy điểm dừng theo ID
  async getById(id) {
    const [rows] = await pool.query(`SELECT * FROM DiemDung WHERE maDiem = ?`, [
      id,
    ]);
    return rows[0];
  },

  // Lấy điểm dừng theo tuyến và thứ tự
  async getByRouteAndOrder(maTuyen, thuTu) {
    const [rows] = await pool.query(
      `SELECT * FROM DiemDung WHERE maTuyen = ? AND thuTu = ?`,
      [maTuyen, thuTu]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Tạo điểm dừng mới
  async create(data) {
    const { maTuyen, tenDiem, kinhDo, viDo, thuTu } = data;
    const [result] = await pool.query(
      `INSERT INTO DiemDung (maTuyen, tenDiem, kinhDo, viDo, thuTu)
       VALUES (?, ?, ?, ?, ?)`,
      [maTuyen, tenDiem, kinhDo, viDo, thuTu]
    );
    return result.insertId;
  },

  // Tạo nhiều điểm dừng cùng lúc
  async createMultiple(maTuyen, diemDungList) {
    const values = diemDungList.map((diem) => [
      maTuyen,
      diem.tenDiem,
      diem.kinhDo,
      diem.viDo,
      diem.thuTu,
    ]);

    const [result] = await pool.query(
      `INSERT INTO DiemDung (maTuyen, tenDiem, kinhDo, viDo, thuTu) VALUES ?`,
      [values]
    );
    return result.affectedRows;
  },

  // Cập nhật điểm dừng (partial update)
  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.tenDiem !== undefined) {
      fields.push("tenDiem = ?");
      values.push(data.tenDiem);
    }
    if (data.kinhDo !== undefined) {
      fields.push("kinhDo = ?");
      values.push(data.kinhDo);
    }
    if (data.viDo !== undefined) {
      fields.push("viDo = ?");
      values.push(data.viDo);
    }
    if (data.thuTu !== undefined) {
      fields.push("thuTu = ?");
      values.push(data.thuTu);
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(id);
    const query = `UPDATE DiemDung SET ${fields.join(", ")} WHERE maDiem = ?`;

    const [result] = await pool.query(query, values);
    return result.affectedRows > 0;
  },

  // Xóa điểm dừng
  async delete(id) {
    const [result] = await pool.query("DELETE FROM DiemDung WHERE maDiem = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  },

  // Xóa tất cả điểm dừng của một tuyến
  async deleteByRoute(maTuyen) {
    const [result] = await pool.query(
      "DELETE FROM DiemDung WHERE maTuyen = ?",
      [maTuyen]
    );
    return result.affectedRows;
  },

  // Sắp xếp lại thứ tự các điểm dừng
  async reorder(maTuyen, diemDungIds) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (let i = 0; i < diemDungIds.length; i++) {
        await connection.query(
          "UPDATE DiemDung SET thuTu = ? WHERE maDiem = ? AND maTuyen = ?",
          [i + 1, diemDungIds[i], maTuyen]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

export default DiemDungModel;
