import ChuyenDiModel from "../models/ChuyenDiModel.js";
import LichTrinhModel from "../models/LichTrinhModel.js";
import socketService from "./SocketService.js";

const VALID_TRANG_THAI = ["chua_khoi_hanh", "dang_chay", "hoan_thanh", "huy"];

class TripService {
  /**
   * Lấy danh sách chuyến đi có phân trang và lọc
   */
  static async list(options = {}) {
    const {
      page = 1,
      limit = 10,
      ngayChay,
      trangThai,
      maLichTrinh,
      sortBy = "ngayChay",
      sortDir = "DESC",
    } = options;

    // Sử dụng getAll với filters
    const filters = {};
    if (ngayChay) filters.ngayChay = ngayChay;
    if (trangThai) filters.trangThai = trangThai;
    if (maLichTrinh) filters.maLichTrinh = maLichTrinh;

    const allTrips = await ChuyenDiModel.getAll(filters);

    // Sắp xếp
    const validSortDir = sortDir.toUpperCase() === "ASC" ? 1 : -1;
    allTrips.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1 * validSortDir;
      if (a[sortBy] > b[sortBy]) return 1 * validSortDir;
      return 0;
    });

    // Phân trang
    const total = allTrips.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = allTrips.slice(start, end);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy thông tin chuyến đi theo ID
   */
  static async getById(id) {
    return await ChuyenDiModel.getById(id);
  }

  /**
   * Tạo chuyến đi mới
   */
  static async create(data) {
    const { maLichTrinh, ngayChay, trangThai, ghiChu } = data;

    // Validate required fields
    if (!maLichTrinh || !ngayChay) {
      throw new Error("MISSING_REQUIRED_FIELDS");
    }

    // Validate trạng thái (nếu có)
    if (trangThai && !VALID_TRANG_THAI.includes(trangThai)) {
      throw new Error("INVALID_STATUS");
    }

    // Kiểm tra lịch trình tồn tại
    const schedule = await LichTrinhModel.getById(maLichTrinh);
    if (!schedule || !schedule.dangApDung) {
      throw new Error("SCHEDULE_NOT_FOUND");
    }

    // Kiểm tra chuyến đã tồn tại chưa (UNIQUE: maLichTrinh + ngayChay)
    const pool = (await import("../config/db.js")).default;
    const [existing] = await pool.query(
      "SELECT * FROM ChuyenDi WHERE maLichTrinh = ? AND ngayChay = ?",
      [maLichTrinh, ngayChay]
    );

    if (existing.length > 0) {
      throw new Error("TRIP_ALREADY_EXISTS");
    }

    // Tạo chuyến đi
    const tripId = await ChuyenDiModel.create({
      maLichTrinh,
      ngayChay,
      trangThai: trangThai || "chua_khoi_hanh",
      ghiChu,
    });

    return await ChuyenDiModel.getById(tripId);
  }

  /**
   * Cập nhật chuyến đi
   */
  static async update(id, data) {
    const { trangThai, gioBatDauThucTe, gioKetThucThucTe, ghiChu } = data;

    // Kiểm tra chuyến đi tồn tại
    const existing = await ChuyenDiModel.getById(id);
    if (!existing) {
      return null;
    }

    // Validate trạng thái (nếu có)
    if (trangThai && !VALID_TRANG_THAI.includes(trangThai)) {
      throw new Error("INVALID_STATUS");
    }

    // Chuẩn bị dữ liệu update
    const updateData = {};
    if (trangThai !== undefined) updateData.trangThai = trangThai;
    if (gioBatDauThucTe !== undefined)
      updateData.gioBatDauThucTe = gioBatDauThucTe;
    if (gioKetThucThucTe !== undefined)
      updateData.gioKetThucThucTe = gioKetThucThucTe;
    if (ghiChu !== undefined) updateData.ghiChu = ghiChu;

    // Cập nhật
    const success = await ChuyenDiModel.update(id, updateData);
    if (!success) {
      return null;
    }

    const updatedTrip = await ChuyenDiModel.getById(id);

    // Phát sự kiện real-time khi trạng thái thay đổi
    if (trangThai && trangThai !== existing.trangThai) {
      socketService.notifyTripStatusUpdate(id, {
        tripId: id,
        oldStatus: existing.trangThai,
        newStatus: trangThai,
        trip: updatedTrip,
      });
    }

    return updatedTrip;
  }

  /**
   * Bắt đầu chuyến đi
   */
  static async start(id) {
    // Kiểm tra chuyến đi tồn tại
    const existing = await ChuyenDiModel.getById(id);
    if (!existing) {
      return null;
    }

    // Chỉ cho phép bắt đầu nếu trạng thái là "chua_khoi_hanh"
    if (existing.trangThai !== "chua_khoi_hanh") {
      throw new Error("TRIP_ALREADY_STARTED");
    }

    // Bắt đầu chuyến đi
    const success = await ChuyenDiModel.start(id);
    if (!success) {
      return null;
    }

    const updatedTrip = await ChuyenDiModel.getById(id);

    // Phát sự kiện real-time
    socketService.notifyTripStatusUpdate(id, {
      tripId: id,
      status: "dang_chay",
      trip: updatedTrip,
    });

    return updatedTrip;
  }

  /**
   * Kết thúc chuyến đi
   */
  static async complete(id) {
    // Kiểm tra chuyến đi tồn tại
    const existing = await ChuyenDiModel.getById(id);
    if (!existing) {
      return null;
    }

    // Chỉ cho phép kết thúc nếu trạng thái là "dang_chay"
    if (existing.trangThai !== "dang_chay") {
      throw new Error("TRIP_NOT_RUNNING");
    }

    // Kết thúc chuyến đi
    const success = await ChuyenDiModel.complete(id);
    if (!success) {
      return null;
    }

    const updatedTrip = await ChuyenDiModel.getById(id);

    // Phát sự kiện real-time
    socketService.notifyTripStatusUpdate(id, {
      tripId: id,
      status: "hoan_thanh",
      trip: updatedTrip,
    });

    return updatedTrip;
  }

  /**
   * Hủy chuyến đi
   */
  static async cancel(id, ghiChu) {
    // Kiểm tra chuyến đi tồn tại
    const existing = await ChuyenDiModel.getById(id);
    if (!existing) {
      return null;
    }

    // Không cho phép hủy chuyến đã hoàn thành
    if (existing.trangThai === "hoan_thanh") {
      throw new Error("CANNOT_CANCEL_COMPLETED_TRIP");
    }

    // Hủy chuyến đi
    const success = await ChuyenDiModel.cancel(id, ghiChu);
    if (!success) {
      return null;
    }

    const updatedTrip = await ChuyenDiModel.getById(id);

    // Phát sự kiện real-time
    socketService.notifyTripStatusUpdate(id, {
      tripId: id,
      status: "huy",
      reason: ghiChu,
      trip: updatedTrip,
    });

    return updatedTrip;
  }

  /**
   * Xóa chuyến đi
   */
  static async remove(id) {
    // Kiểm tra chuyến đi tồn tại
    const existing = await ChuyenDiModel.getById(id);
    if (!existing) {
      return false;
    }

    // Không cho phép xóa chuyến đang chạy
    if (existing.trangThai === "dang_chay") {
      throw new Error("CANNOT_DELETE_RUNNING_TRIP");
    }

    return await ChuyenDiModel.delete(id);
  }

  /**
   * Lấy danh sách học sinh trong chuyến
   */
  static async getStudents(id) {
    // Kiểm tra chuyến đi tồn tại
    const existing = await ChuyenDiModel.getById(id);
    if (!existing) {
      return null;
    }

    return await ChuyenDiModel.getStudents(id);
  }

  /**
   * Lấy chuyến đi của tài xế trong ngày
   */
  static async getByDriverAndDate(maTaiXe, ngayChay) {
    return await ChuyenDiModel.getByDriverAndDate(maTaiXe, ngayChay);
  }

  /**
   * Thống kê chuyến đi
   */
  static async getStats(filters = {}) {
    return await ChuyenDiModel.getStats(filters);
  }
}

export default TripService;
