import pool from "../config/db.js";

const ChuyenDiModel = {
  // Lấy tất cả chuyến đi
  async getAll(filters = {}) {
    let query = `
      SELECT 
        cd.*,
        lt.loaiChuyen,
        lt.gioKhoiHanh,
        td.tenTuyen,
        xb.bienSoXe,
        nd.hoTen as tenTaiXe
      FROM ChuyenDi cd
      INNER JOIN LichTrinh lt ON cd.maLichTrinh = lt.maLichTrinh
      INNER JOIN TuyenDuong td ON lt.maTuyen = td.maTuyen
      INNER JOIN XeBuyt xb ON lt.maXe = xb.maXe
      INNER JOIN NguoiDung nd ON lt.maTaiXe = nd.maNguoiDung
      WHERE 1=1
    `;
    const params = [];

    if (filters.ngayChay) {
      query += " AND cd.ngayChay = ?";
      params.push(filters.ngayChay);
    }
    if (filters.trangThai) {
      query += " AND cd.trangThai = ?";
      params.push(filters.trangThai);
    }
    if (filters.maLichTrinh) {
      query += " AND cd.maLichTrinh = ?";
      params.push(filters.maLichTrinh);
    }

    query += " ORDER BY cd.ngayChay DESC, lt.gioKhoiHanh";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Lấy chuyến đi theo ID
  async getById(id) {
    const [rows] = await pool.query(
      `SELECT 
        cd.*,
        lt.loaiChuyen,
        lt.gioKhoiHanh,
        lt.maXe,
        lt.maTaiXe,
        td.tenTuyen,
        td.diemBatDau,
        td.diemKetThuc,
        xb.bienSoXe,
        xb.dongXe,
        nd.hoTen as tenTaiXe,
        nd.soDienThoai as sdtTaiXe
       FROM ChuyenDi cd
       INNER JOIN LichTrinh lt ON cd.maLichTrinh = lt.maLichTrinh
       INNER JOIN TuyenDuong td ON lt.maTuyen = td.maTuyen
       INNER JOIN XeBuyt xb ON lt.maXe = xb.maXe
       INNER JOIN NguoiDung nd ON lt.maTaiXe = nd.maNguoiDung
       WHERE cd.maChuyen = ?`,
      [id]
    );
    return rows[0];
  },

  // Lấy chuyến đi theo tài xế và ngày
  async getByDriverAndDate(maTaiXe, ngayChay) {
    const [rows] = await pool.query(
      `SELECT 
        cd.*,
        lt.loaiChuyen,
        lt.gioKhoiHanh,
        td.tenTuyen,
        xb.bienSoXe
       FROM ChuyenDi cd
       INNER JOIN LichTrinh lt ON cd.maLichTrinh = lt.maLichTrinh
       INNER JOIN TuyenDuong td ON lt.maTuyen = td.maTuyen
       INNER JOIN XeBuyt xb ON lt.maXe = xb.maXe
       WHERE lt.maTaiXe = ? AND cd.ngayChay = ?
       ORDER BY lt.gioKhoiHanh`,
      [maTaiXe, ngayChay]
    );
    return rows;
  },

  // Tạo chuyến đi mới
  async create(data) {
    const { maLichTrinh, ngayChay, trangThai, ghiChu } = data;
    const [result] = await pool.query(
      `INSERT INTO ChuyenDi (maLichTrinh, ngayChay, trangThai, ghiChu)
       VALUES (?, ?, ?, ?)`,
      [maLichTrinh, ngayChay, trangThai || "chua_khoi_hanh", ghiChu]
    );
    return result.insertId;
  },

  // Cập nhật chuyến đi (partial update)
  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.trangThai !== undefined) {
      fields.push("trangThai = ?");
      values.push(data.trangThai);
    }
    if (data.gioBatDauThucTe !== undefined) {
      fields.push("gioBatDauThucTe = ?");
      values.push(data.gioBatDauThucTe);
    }
    if (data.gioKetThucThucTe !== undefined) {
      fields.push("gioKetThucThucTe = ?");
      values.push(data.gioKetThucThucTe);
    }
    if (data.ghiChu !== undefined) {
      fields.push("ghiChu = ?");
      values.push(data.ghiChu);
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(id);
    const query = `UPDATE ChuyenDi SET ${fields.join(", ")} WHERE maChuyen = ?`;

    const [result] = await pool.query(query, values);
    return result.affectedRows > 0;
  },

  // Bắt đầu chuyến đi
  async start(id) {
    const [result] = await pool.query(
      `UPDATE ChuyenDi 
       SET trangThai = 'dang_chay', gioBatDauThucTe = NOW()
       WHERE maChuyen = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  // Kết thúc chuyến đi
  async complete(id) {
    const [result] = await pool.query(
      `UPDATE ChuyenDi 
       SET trangThai = 'hoan_thanh', gioKetThucThucTe = NOW()
       WHERE maChuyen = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  // Hủy chuyến đi
  async cancel(id, ghiChu) {
    const [result] = await pool.query(
      `UPDATE ChuyenDi 
       SET trangThai = 'huy', ghiChu = ?
       WHERE maChuyen = ?`,
      [ghiChu, id]
    );
    return result.affectedRows > 0;
  },

  // Xóa chuyến đi
  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM ChuyenDi WHERE maChuyen = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  // Lấy danh sách học sinh trong chuyến
  async getStudents(maChuyen) {
    const [rows] = await pool.query(
      `SELECT 
        tths.*,
        hs.hoTen,
        hs.lop,
        hs.anhDaiDien,
        nd.hoTen as tenPhuHuynh,
        nd.soDienThoai as sdtPhuHuynh
       FROM TrangThaiHocSinh tths
       INNER JOIN HocSinh hs ON tths.maHocSinh = hs.maHocSinh
       LEFT JOIN NguoiDung nd ON hs.maPhuHuynh = nd.maNguoiDung
       WHERE tths.maChuyen = ?
       ORDER BY tths.thuTuDiemDon`,
      [maChuyen]
    );
    return rows;
  },

  // Thống kê chuyến đi
  async getStats(filters = {}) {
    let query = `
      SELECT 
        trangThai,
        COUNT(*) as count
      FROM ChuyenDi
      WHERE 1=1
    `;
    const params = [];

    if (filters.ngayChay) {
      query += " AND ngayChay = ?";
      params.push(filters.ngayChay);
    }
    if (filters.ngayBatDau && filters.ngayKetThuc) {
      query += " AND ngayChay BETWEEN ? AND ?";
      params.push(filters.ngayBatDau, filters.ngayKetThuc);
    }

    query += " GROUP BY trangThai";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Lấy chuyến đi theo lịch trình và ngày
  async getByScheduleAndDate(maLichTrinh, ngayChay) {
    const [rows] = await pool.query(
      `SELECT cd.*,
        lt.gioKhoiHanh,
        lt.loaiChuyen,
        td.tenTuyen,
        xb.bienSoXe,
        nd.hoTen as tenTaiXe
       FROM ChuyenDi cd
       INNER JOIN LichTrinh lt ON cd.maLichTrinh = lt.maLichTrinh
       INNER JOIN TuyenDuong td ON lt.maTuyen = td.maTuyen
       INNER JOIN XeBuyt xb ON lt.maXe = xb.maXe
       INNER JOIN NguoiDung nd ON lt.maTaiXe = nd.maNguoiDung
       WHERE cd.maLichTrinh = ? AND DATE(cd.ngayChay) = DATE(?)`,
      [maLichTrinh, ngayChay]
    );
    return rows[0];
  },
};

export default ChuyenDiModel;
