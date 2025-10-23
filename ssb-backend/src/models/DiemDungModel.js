import pool from "../config/db.config.js";

const DiemDungModel = {
  // Lấy tất cả điểm dừng
  async getAll() {
    const [rows] = await pool.query(`SELECT * FROM DiemDung`);
    return rows;
  },

  // Lấy điểm dừng theo mã
  async getById(maDiem) {
    const [rows] = await pool.query(`SELECT * FROM DiemDung WHERE maDiem = ?`, [
      maDiem,
    ]);
    return rows[0];
  },

  // Lấy điểm dừng theo mã tuyến
  async getByTuyen(maTuyen) {
    const [rows] = await pool.query(
      `SELECT * FROM DiemDung WHERE maTuyen = ? ORDER BY thuTu ASC`,
      [maTuyen]
    );
    return rows;
  },

  // Thêm điểm dừng mới
  async create(data) {
    const { maTuyen, tenDiem, kinhDo, viDo, thuTu } = data;
    const [result] = await pool.query(
      `INSERT INTO DiemDung (maTuyen, tenDiem, kinhDo, viDo, thuTu)
       VALUES (?, ?, ?, ?, ?)`,
      [maTuyen, tenDiem, kinhDo, viDo, thuTu]
    );
    return result.insertId;
  },

  // Cập nhật điểm dừng
  async update(maDiem, data) {
    const { tenDiem, kinhDo, viDo, thuTu } = data;
    const [result] = await pool.query(
      `UPDATE DiemDung SET tenDiem = ?, kinhDo = ?, viDo = ?, thuTu = ? WHERE maDiem = ?`,
      [tenDiem, kinhDo, viDo, thuTu, maDiem]
    );
    return result.affectedRows > 0;
  },

  // Xóa điểm dừng
  async delete(maDiem) {
    const [result] = await pool.query(`DELETE FROM DiemDung WHERE maDiem = ?`, [
      maDiem,
    ]);
    return result.affectedRows > 0;
  },
};

export default DiemDungModel;
