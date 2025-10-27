import LichTrinhModel from "../models/LichTrinhModel.js";
import TuyenDuongModel from "../models/TuyenDuongModel.js";
import XeBuytModel from "../models/XeBuytModel.js";
import TaiXeModel from "../models/TaiXeModel.js";

const VALID_LOAI_CHUYEN = ["don_sang", "tra_chieu"];

class ScheduleService {
  /**
   * Lấy danh sách lịch trình có phân trang
   */
  static async list(options = {}) {
    const {
      page = 1,
      limit = 10,
      maTuyen,
      maXe,
      maTaiXe,
      loaiChuyen,
      sortBy = "gioKhoiHanh",
      sortDir = "ASC",
    } = options;

    let query = `
      SELECT 
        lt.*,
        td.tenTuyen,
        xb.bienSoXe,
        xb.dongXe,
        nd.hoTen as tenTaiXe
      FROM LichTrinh lt
      INNER JOIN TuyenDuong td ON lt.maTuyen = td.maTuyen
      INNER JOIN XeBuyt xb ON lt.maXe = xb.maXe
      INNER JOIN NguoiDung nd ON lt.maTaiXe = nd.maNguoiDung
      WHERE lt.dangApDung = TRUE
    `;
    const params = [];

    // Lọc theo tuyến
    if (maTuyen) {
      query += " AND lt.maTuyen = ?";
      params.push(maTuyen);
    }

    // Lọc theo xe
    if (maXe) {
      query += " AND lt.maXe = ?";
      params.push(maXe);
    }

    // Lọc theo tài xế
    if (maTaiXe) {
      query += " AND lt.maTaiXe = ?";
      params.push(maTaiXe);
    }

    // Lọc theo loại chuyến
    if (loaiChuyen) {
      query += " AND lt.loaiChuyen = ?";
      params.push(loaiChuyen);
    }

    // Sắp xếp
    const validSortDir = sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY lt.${sortBy} ${validSortDir}`;

    // Phân trang
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    // Execute query
    const pool = (await import("../config/db.js")).default;
    const [rows] = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM LichTrinh lt
      WHERE lt.dangApDung = TRUE
    `;
    const countParams = [];

    if (maTuyen) {
      countQuery += " AND lt.maTuyen = ?";
      countParams.push(maTuyen);
    }
    if (maXe) {
      countQuery += " AND lt.maXe = ?";
      countParams.push(maXe);
    }
    if (maTaiXe) {
      countQuery += " AND lt.maTaiXe = ?";
      countParams.push(maTaiXe);
    }
    if (loaiChuyen) {
      countQuery += " AND lt.loaiChuyen = ?";
      countParams.push(loaiChuyen);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy thông tin lịch trình theo ID
   */
  static async getById(id) {
    const schedule = await LichTrinhModel.getById(id);
    if (!schedule || !schedule.dangApDung) {
      return null;
    }
    return schedule;
  }

  /**
   * Tạo lịch trình mới
   */
  static async create(data) {
    const { maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh } = data;

    // Validate required fields
    if (!maTuyen || !maXe || !maTaiXe || !loaiChuyen || !gioKhoiHanh) {
      throw new Error("MISSING_REQUIRED_FIELDS");
    }

    // Validate loại chuyến
    if (!VALID_LOAI_CHUYEN.includes(loaiChuyen)) {
      throw new Error("INVALID_TRIP_TYPE");
    }

    // Kiểm tra tuyến tồn tại
    const route = await TuyenDuongModel.getById(maTuyen);
    if (!route || !route.trangThai) {
      throw new Error("ROUTE_NOT_FOUND");
    }

    // Kiểm tra xe tồn tại
    const bus = await XeBuytModel.getById(maXe);
    if (!bus) {
      throw new Error("BUS_NOT_FOUND");
    }

    // Kiểm tra tài xế tồn tại
    const driver = await TaiXeModel.getById(maTaiXe);
    if (!driver) {
      throw new Error("DRIVER_NOT_FOUND");
    }

    // Kiểm tra xung đột lịch trình (xe hoặc tài xế đã có lịch cùng giờ)
    const hasConflict = await LichTrinhModel.checkConflict(
      maXe,
      maTaiXe,
      gioKhoiHanh,
      loaiChuyen
    );

    if (hasConflict) {
      throw new Error("SCHEDULE_CONFLICT");
    }

    // Tạo lịch trình
    const scheduleId = await LichTrinhModel.create({
      maTuyen,
      maXe,
      maTaiXe,
      loaiChuyen,
      gioKhoiHanh,
      dangApDung: true,
    });

    return await LichTrinhModel.getById(scheduleId);
  }

  /**
   * Cập nhật lịch trình
   */
  static async update(id, data) {
    const { maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh, dangApDung } =
      data;

    // Kiểm tra lịch trình tồn tại
    const existing = await LichTrinhModel.getById(id);
    if (!existing) {
      return null;
    }

    // Validate loại chuyến (nếu có)
    if (loaiChuyen && !VALID_LOAI_CHUYEN.includes(loaiChuyen)) {
      throw new Error("INVALID_TRIP_TYPE");
    }

    // Kiểm tra tuyến tồn tại (nếu thay đổi)
    if (maTuyen && maTuyen !== existing.maTuyen) {
      const route = await TuyenDuongModel.getById(maTuyen);
      if (!route || !route.trangThai) {
        throw new Error("ROUTE_NOT_FOUND");
      }
    }

    // Kiểm tra xe tồn tại (nếu thay đổi)
    if (maXe && maXe !== existing.maXe) {
      const bus = await XeBuytModel.getById(maXe);
      if (!bus) {
        throw new Error("BUS_NOT_FOUND");
      }
    }

    // Kiểm tra tài xế tồn tại (nếu thay đổi)
    if (maTaiXe && maTaiXe !== existing.maTaiXe) {
      const driver = await TaiXeModel.getById(maTaiXe);
      if (!driver) {
        throw new Error("DRIVER_NOT_FOUND");
      }
    }

    // Kiểm tra xung đột lịch trình (nếu thay đổi xe, tài xế hoặc giờ)
    const checkMaXe = maXe || existing.maXe;
    const checkMaTaiXe = maTaiXe || existing.maTaiXe;
    const checkGioKhoiHanh = gioKhoiHanh || existing.gioKhoiHanh;
    const checkLoaiChuyen = loaiChuyen || existing.loaiChuyen;

    const hasConflict = await LichTrinhModel.checkConflict(
      checkMaXe,
      checkMaTaiXe,
      checkGioKhoiHanh,
      checkLoaiChuyen,
      id
    );

    if (hasConflict) {
      throw new Error("SCHEDULE_CONFLICT");
    }

    // Chuẩn bị dữ liệu update
    const updateData = {};
    if (maTuyen !== undefined) updateData.maTuyen = maTuyen;
    if (maXe !== undefined) updateData.maXe = maXe;
    if (maTaiXe !== undefined) updateData.maTaiXe = maTaiXe;
    if (loaiChuyen !== undefined) updateData.loaiChuyen = loaiChuyen;
    if (gioKhoiHanh !== undefined) updateData.gioKhoiHanh = gioKhoiHanh;
    if (dangApDung !== undefined) updateData.dangApDung = dangApDung;

    // Cập nhật
    const success = await LichTrinhModel.update(id, updateData);
    if (!success) {
      return null;
    }

    return await LichTrinhModel.getById(id);
  }

  /**
   * Xóa lịch trình (soft delete)
   */
  static async remove(id) {
    // Kiểm tra lịch trình tồn tại
    const existing = await LichTrinhModel.getById(id);
    if (!existing) {
      return false;
    }

    return await LichTrinhModel.delete(id);
  }

  /**
   * Lấy lịch trình theo tuyến
   */
  static async getByRoute(maTuyen) {
    return await LichTrinhModel.getByRoute(maTuyen);
  }

  /**
   * Lấy lịch trình theo xe
   */
  static async getByBus(maXe) {
    return await LichTrinhModel.getByBus(maXe);
  }

  /**
   * Lấy lịch trình theo tài xế
   */
  static async getByDriver(maTaiXe) {
    return await LichTrinhModel.getByDriver(maTaiXe);
  }

  /**
   * Thống kê lịch trình
   */
  static async getStats() {
    return await LichTrinhModel.getStats();
  }
}

export default ScheduleService;
