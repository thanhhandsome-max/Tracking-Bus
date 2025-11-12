import ChuyenDiModel from "../models/ChuyenDiModel.js";
import LichTrinhModel from "../models/LichTrinhModel.js";
import TrangThaiHocSinhModel from "../models/TrangThaiHocSinhModel.js";
import XeBuytModel from "../models/XeBuytModel.js";
import TaiXeModel from "../models/TaiXeModel.js";
import TuyenDuongModel from "../models/TuyenDuongModel.js";
import RouteStopModel from "../models/RouteStopModel.js";
import HocSinhModel from "../models/HocSinhModel.js";
import tripService from "../services/tripService.js"; // kết nối tới service xử lý logic trip
import TelemetryService from "../services/telemetryService.js"; // clear cache khi trip ends
import * as response from "../utils/response.js"; // M4-M6: Response envelope

class TripController {
  // Lịch sử chuyến đi cho phụ huynh (các chuyến có con tham gia)
  static async getHistory(req, res) {
    try {
      const userId = req.user?.userId;
      const { from, to, page = 1, limit = 10 } = req.query;

      // Lấy danh sách con của phụ huynh
      const children = await HocSinhModel.getByParent(userId);
      const childIds = children.map((c) => c.maHocSinh);
      if (childIds.length === 0) {
        return res.status(200).json({ success: true, data: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: Number(limit) } });
      }

      // Truy vấn lịch sử các chuyến có con tham gia
      const pool = (await import("../config/db.js")).default;
      const params = [childIds];
      let where = "tth.maHocSinh IN (?)";
      if (from) { where += " AND cd.ngayChay >= ?"; params.push(from); }
      if (to) { where += " AND cd.ngayChay <= ?"; params.push(to); }

      const [rows] = await pool.query(
        `SELECT cd.maChuyen, cd.ngayChay, cd.trangThai,
                lt.loaiChuyen, lt.gioKhoiHanh,
                td.tenTuyen,
                xb.bienSoXe,
                tth.maHocSinh, hs.hoTen as tenHocSinh, tth.trangThai as trangThaiHocSinh
         FROM TrangThaiHocSinh tth
         JOIN ChuyenDi cd ON tth.maChuyen = cd.maChuyen
         JOIN LichTrinh lt ON cd.maLichTrinh = lt.maLichTrinh
         JOIN TuyenDuong td ON lt.maTuyen = td.maTuyen
         JOIN XeBuyt xb ON lt.maXe = xb.maXe
         JOIN HocSinh hs ON tth.maHocSinh = hs.maHocSinh
         WHERE ${where}
         ORDER BY cd.ngayChay DESC, lt.gioKhoiHanh DESC`,
        params
      );

      // Phân trang tại controller (có thể tối ưu SQL sau)
      const total = rows.length;
      const start = (Number(page) - 1) * Number(limit);
      const data = rows.slice(start, start + Number(limit));

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          itemsPerPage: Number(limit),
        },
      });
    } catch (error) {
      console.error("TripController.getHistory error:", error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }
  // Lấy danh sách tất cả chuyến đi (M4-M6: Chuẩn hóa pagination)
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        pageSize = 10,
        q, // search query
        ngayChay,
        trangThai,
        maTuyen,
        maXe,
        maTaiXe,
        sortBy = "ngayChay",
        sortOrder = "desc",
      } = req.query;

      // Normalize query params
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limit = Math.max(1, Math.min(200, parseInt(pageSize) || parseInt(req.query.limit) || 10));
      const search = q || req.query.search;
      const sortDir = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

      // Dùng SQL-level filter
      const filters = {
        ngayChay,
        trangThai,
        maTuyen,
        maXe,
        maTaiXe,
        search, // Thêm search nếu cần
      };

      // Use service if available, otherwise fallback to model
      let result;
      if (tripService && tripService.list) {
        result = await tripService.list({
          page: pageNum,
          limit,
          ...filters,
        });
      } else {
        // Fallback: Get all then filter
        let trips = await ChuyenDiModel.getAll(filters);
        let totalCount = trips.length;

        // Search filter (nếu có)
        if (search) {
          trips = trips.filter(
            (t) =>
              t.tenTuyen?.toLowerCase().includes(search.toLowerCase()) ||
              t.bienSoXe?.toLowerCase().includes(search.toLowerCase()) ||
              t.tenTaiXe?.toLowerCase().includes(search.toLowerCase())
          );
          totalCount = trips.length;
        }

        // Sort (simple client-side sort)
        trips.sort((a, b) => {
          const aVal = a[sortBy] || "";
          const bVal = b[sortBy] || "";
          if (sortDir === "ASC") {
            return aVal > bVal ? 1 : -1;
          }
          return aVal < bVal ? 1 : -1;
        });

        // Pagination
        const offset = (pageNum - 1) * limit;
        const paginatedTrips = trips.slice(offset, offset + limit);

        result = {
          data: paginatedTrips,
          pagination: {
            page: pageNum,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        };
      }

      return response.ok(res, result.data, {
        page: pageNum,
        pageSize: limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        sortBy,
        sortOrder: sortOrder.toLowerCase(),
        q: search || null,
      });
    } catch (error) {
      console.error("Error in TripController.getAll:", error);
      return response.serverError(res, "Lỗi server khi lấy danh sách chuyến đi", error);
    }
  }

  // Lấy thông tin chi tiết một chuyến đi (M4-M6: Response envelope)
  static async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.validationError(res, "Mã chuyến đi là bắt buộc", [
          { field: "id", message: "Mã chuyến đi không được để trống" }
        ]);
      }

      const trip = await (tripService && tripService.getById
        ? tripService.getById(id)
        : ChuyenDiModel.getById(id));

      if (!trip) {
        return response.notFound(res, "Không tìm thấy chuyến đi");
      }

      // Lấy thông tin chi tiết lịch trình
      const schedule = await LichTrinhModel.getById(trip.maLichTrinh);

      // Lấy thông tin xe buýt và tài xế
      const busInfo = schedule ? await XeBuytModel.getById(schedule.maXe) : null;
      const driverInfo = schedule ? await TaiXeModel.getById(schedule.maTaiXe) : null;
      const routeInfo = schedule ? await TuyenDuongModel.getById(schedule.maTuyen) : null;

      // Lấy danh sách điểm dừng của tuyến đường
      let routeStops = [];
      if (routeInfo && routeInfo.maTuyen) {
        routeStops = await RouteStopModel.getByRouteId(routeInfo.maTuyen);
      }

      // Lấy danh sách học sinh trong chuyến đi
      const students = await TrangThaiHocSinhModel.getByTripId(id);

      return response.ok(res, {
        ...trip,
        schedule,
        busInfo,
        driverInfo,
        routeInfo: routeInfo ? {
          ...routeInfo,
          diemDung: routeStops, // Thêm danh sách điểm dừng vào routeInfo
        } : null,
        students,
      });
    } catch (error) {
      if (error.message === "TRIP_NOT_FOUND") {
        return response.notFound(res, "Không tìm thấy chuyến đi");
      }
      console.error("Error in TripController.getById:", error);
      return response.serverError(res, "Lỗi server khi lấy thông tin chuyến đi", error);
    }
  }

  // Tạo chuyến đi mới từ schedule (M4-M6: Response envelope + WS event)
  static async create(req, res) {
    try {
      const {
        maLichTrinh,
        ngayChay,
        trangThai = "chua_khoi_hanh", // M4-M6: planned (map từ chua_khoi_hanh)
        ghiChu = null,
      } = req.body;

      // Validation dữ liệu bắt buộc
      if (!maLichTrinh || !ngayChay) {
        return response.validationError(res, "Mã lịch trình và ngày chạy là bắt buộc", [
          { field: "maLichTrinh", message: "Mã lịch trình không được để trống" },
          { field: "ngayChay", message: "Ngày chạy không được để trống" }
        ]);
      }

      // Validation ngày chạy
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(ngayChay)) {
        return response.validationError(res, "Ngày chạy phải có định dạng YYYY-MM-DD", [
          { field: "ngayChay", message: "Format: YYYY-MM-DD" }
        ]);
      }

      // Use service if available
      let trip;
      try {
        if (tripService && tripService.create) {
          trip = await tripService.create({ maLichTrinh, ngayChay, trangThai, ghiChu });
        } else {
          // Fallback to model
          const schedule = await LichTrinhModel.getById(maLichTrinh);
          if (!schedule) {
            return response.notFound(res, "Không tìm thấy lịch trình");
          }

          if (!schedule.dangApDung) {
            return response.validationError(res, "Lịch trình không đang được áp dụng", [
              { field: "maLichTrinh", message: "Lịch trình phải đang được áp dụng" }
            ]);
          }

          // Check if trip already exists for this schedule + date
          const existing = await ChuyenDiModel.getByScheduleAndDate(maLichTrinh, ngayChay);
          if (existing) {
            return response.error(res, "TRIP_ALREADY_EXISTS", "Chuyến đi đã tồn tại cho lịch trình và ngày này", 409);
          }

          const tripId = await ChuyenDiModel.create({ maLichTrinh, ngayChay, trangThai, ghiChu });
          trip = await ChuyenDiModel.getById(tripId);
        }
      } catch (serviceError) {
        if (serviceError.message === "SCHEDULE_NOT_FOUND") {
          return response.notFound(res, "Không tìm thấy lịch trình");
        }
        if (serviceError.message === "MISSING_REQUIRED_FIELDS") {
          return response.validationError(res, "Thiếu trường bắt buộc", [
            { field: "maLichTrinh", message: "Mã lịch trình là bắt buộc" },
            { field: "ngayChay", message: "Ngày chạy là bắt buộc" }
          ]);
        }
        throw serviceError;
      }

      // M4-M6: Emit WS event trip_created
      const io = req.app.get("io");
      if (io && trip) {
        const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
        if (schedule) {
          io.to(`trip-${trip.maChuyen}`).emit("trip_created", {
            tripId: trip.maChuyen,
            scheduleId: maLichTrinh,
            busId: schedule.maXe,
            driverId: schedule.maTaiXe,
            routeId: schedule.maTuyen,
            date: ngayChay,
            status: trangThai,
            timestamp: new Date().toISOString(),
          });
          // Also notify role-admin
          io.to("role-quan_tri").emit("trip_created", {
            tripId: trip.maChuyen,
            scheduleId: maLichTrinh,
            busId: schedule.maXe,
            driverId: schedule.maTaiXe,
            routeId: schedule.maTuyen,
            date: ngayChay,
            status: trangThai,
            timestamp: new Date().toISOString(),
          });
        }
      }

      return response.created(res, trip);
    } catch (error) {
      console.error("Error in TripController.create:", error);
      return response.serverError(res, "Lỗi server khi tạo chuyến đi", error);
    }
  }

  // Cập nhật chuyến đi
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        maLichTrinh,
        ngayChay,
        trangThai,
        gioBatDauThucTe,
        gioKetThucThucTe,
        ghiChu,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
        });
      }

      // Kiểm tra chuyến đi có tồn tại không
      const existingTrip = await ChuyenDiModel.getById(id);
      if (!existingTrip) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chuyến đi",
        });
      }

      // Validation ngày chạy nếu có thay đổi
      if (ngayChay) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(ngayChay)) {
          return res.status(400).json({
            success: false,
            message: "Ngày chạy phải có định dạng YYYY-MM-DD",
          });
        }
      }

      // Validation trạng thái nếu có thay đổi
      if (trangThai) {
        const validStatuses = [
          "chua_khoi_hanh",
          "dang_chay",
          "da_hoan_thanh",
          "bi_huy",
        ];
        if (!validStatuses.includes(trangThai)) {
          return res.status(400).json({
            success: false,
            message: "Trạng thái không hợp lệ",
            validStatuses,
          });
        }
      }

      // Kiểm tra lịch trình nếu có thay đổi
      if (maLichTrinh && maLichTrinh !== existingTrip.maLichTrinh) {
        const schedule = await LichTrinhModel.getById(maLichTrinh);
        if (!schedule) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy lịch trình",
          });
        }
      }

      // Kiểm tra chuyến đi trùng lặp nếu có thay đổi lịch trình hoặc ngày
      const checkSchedule = maLichTrinh || existingTrip.maLichTrinh;
      const checkDate = ngayChay || existingTrip.ngayChay;

      if (maLichTrinh || ngayChay) {
        const duplicateTrip = await ChuyenDiModel.getByScheduleAndDate(
          checkSchedule,
          checkDate
        );
        if (duplicateTrip && duplicateTrip.maChuyen !== id) {
          return res.status(409).json({
            success: false,
            message: "Chuyến đi đã tồn tại cho lịch trình này trong ngày",
          });
        }
      }

      const updateData = {};
      if (maLichTrinh !== undefined) updateData.maLichTrinh = maLichTrinh;
      if (ngayChay !== undefined) updateData.ngayChay = ngayChay;
      if (trangThai !== undefined) updateData.trangThai = trangThai;
      if (gioBatDauThucTe !== undefined)
        updateData.gioBatDauThucTe = gioBatDauThucTe;
      if (gioKetThucThucTe !== undefined)
        updateData.gioKetThucThucTe = gioKetThucThucTe;
      if (ghiChu !== undefined) updateData.ghiChu = ghiChu;

      const isUpdated = await ChuyenDiModel.update(id, updateData);

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật chuyến đi",
        });
      }

      const updatedTrip = await ChuyenDiModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedTrip,
        message: "Cập nhật chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.update:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật chuyến đi",
        error: error.message,
      });
    }
  }

  // Xóa chuyến đi
  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
        });
      }

      // Kiểm tra chuyến đi có tồn tại không
      const existingTrip = await ChuyenDiModel.getById(id);
      if (!existingTrip) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chuyến đi",
        });
      }

      // Kiểm tra chuyến đi có đang chạy không
      if (existingTrip.trangThai === "dang_chay") {
        return res.status(409).json({
          success: false,
          message: "Không thể xóa chuyến đi đang chạy",
        });
      }

      // Kiểm tra có học sinh nào đang trong chuyến đi không
      const studentsInTrip = await TrangThaiHocSinhModel.getByTripId(id);
      if (studentsInTrip.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Không thể xóa chuyến đi có học sinh tham gia",
          data: { studentsCount: studentsInTrip.length },
        });
      }

      const isDeleted = await ChuyenDiModel.delete(id);

      if (!isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa chuyến đi",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.delete:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa chuyến đi",
        error: error.message,
      });
    }
  }

  // Bắt đầu chuyến đi
  /**
   * 🚀 START TRIP - Controller xử lý request bắt đầu chuyến
   *
   * 🎯 MỤC ĐÍCH:
   * - Nhận HTTP request từ driver app
   * - Gọi service để xử lý logic nghiệp vụ
   * - Trả response về client
   * - Emit Socket.IO event (Day 3)
   *
   * 📖 CÁCH HOẠT ĐỘNG:
   *
   * Controller có 3 nhiệm vụ chính:
   * 1. NHẬN REQUEST (req):
   *    - Lấy tripId từ URL params
   *    - Lấy gioBatDauThucTe từ body (optional)
   *    - Lấy user từ JWT token (req.user - từ middleware)
   *
   * 2. GỌI SERVICE:
   *    - Gọi tripService.startTrip(tripId)
   *    - Service xử lý tất cả logic nghiệp vụ
   *    - Nhận về trip object đã cập nhật
   *
   * 3. TRẢ RESPONSE (res):
   *    - Tạo JSON response
   *    - Set HTTP status code (200, 404, 500...)
   *    - Gửi về client
   *
   * 🔄 FLOW HOẠT ĐỘNG:
   * ```
   * POST /api/trips/123/start
   *   ↓
   * AuthMiddleware.authenticate → Verify JWT
   *   ↓
   * TripController.startTrip(req, res) ← ĐÂY!
   *   ↓
   * Step 1: Lấy tripId = req.params.id
   *   ↓
   * Step 2: Gọi tripService.startTrip(tripId)
   *   ↓ (Service xử lý logic)
   * Step 3: Nhận trip object từ service
   *   ↓
   * Step 4: Emit Socket.IO event (Day 3)
   *   ↓
   * Step 5: res.json({ success: true, trip })
   * ```
   *
   * 💡 TẠI SAO CONTROLLER NGẮN GỌN?
   * - Controller CHỈ xử lý HTTP request/response
   * - Logic nghiệp vụ → Service
   * - Database query → Model
   * - Nguyên tắc: Thin Controller, Fat Service
   *
   * 🧪 VÍ DỤ REQUEST/RESPONSE:
   *
   * Request:
   * ```http
   * POST /api/trips/123/start
   * Headers: {
   *   Authorization: Bearer eyJhbGci...
   * }
   * Body: {} (hoặc { "gioBatDauThucTe": "08:00" })
   * ```
   *
   * Response Success (200):
   * ```json
   * {
   *   "success": true,
   *   "message": "Trip started",
   *   "trip": {
   *     "maChuyen": 123,
   *     "trangThai": "dang_chay",
   *     "gioBatDauThucTe": "08:30"
   *   }
   * }
   * ```
   *
   * Response Error (404):
   * ```json
   * {
   *   "success": false,
   *   "message": "Không tìm thấy chuyến đi"
   * }
   * ```
   *
   * @method POST
   * @param {Object} req - Express request object (được tạo bởi Express khi có request)
   * @param {Object} req.params - URL parameters (được lấy từ đường dẫn)
   * @param {string} req.params.id - Trip ID (maChuyen) (lấy từ /api/trips/:id/start)
   * @param {Object} req.body - Request body (optional) (được gửi từ client)
   * @param {string} req.body.gioBatDauThucTe - Start time override (optional) (lấy từ body)
   * @param {Object} req.user - User from JWT (set by AuthMiddleware) (lấy từ middleware)
   * @param {Object} res - Express response object (được tạo bởi Express để trả về client)
   *
   * @returns {void} Trả response về client qua res.json()
   */
  static async startTrip(req, res) {
    try {
      /**
       * 📥 BƯỚC 1: LẤY DỮ LIỆU TỪ REQUEST
       *
       * Giải thích:
       * - req.params.id: Lấy từ URL /api/trips/:id/start
       *   VD: /api/trips/123/start → id = "123"
       *
       * - req.body.gioBatDauThucTe: Lấy từ JSON body (optional)
       *   VD: { "gioBatDauThucTe": "08:00" }
       *   Dùng khi driver muốn ghi đè thời gian (hiếm khi dùng)
       *
       * - req.user: Được set bởi AuthMiddleware.authenticate
       *   VD: { maNguoiDung: 5, email: "driver@ssb.vn", vaiTro: "tai_xe" }
       *   Dùng để check quyền (Day 3)
       *
       * Destructuring syntax:
       * const { id } = req.params;
       * ↓ Tương đương:
       * const id = req.params.id;
       */
      const { id } = req.params; // Trip ID từ URL
      const { gioBatDauThucTe } = req.body; // Optional start time

      /**
       * ✅ VALIDATION: Kiểm tra tripId có được gửi không
       *
       * Giải thích:
       * - Express tự động parse :id từ URL
       * - Nhưng cần check để chắc chắn
       * - Nếu không có id → Trả 400 Bad Request
       *
       * Tại sao cần check?
       * - Tránh gọi service với undefined
       * - Trả lỗi rõ ràng cho client
       * - Best practice: Validate đầu vào
       */
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
        });
      }

      /**
       * 🔧 BƯỚC 2: GỌI SERVICE XỬ LÝ LOGIC
       *
       * Giải thích:
       * - tripService.startTrip(id): Hàm async, trả về Promise
       * - await: Chờ service hoàn thành
       * - Service sẽ:
       *   + Check trip tồn tại
       *   + Check trạng thái hợp lệ
       *   + Update database
       *   + Trả về trip object
       *
       * Nếu service throw error → Catch block sẽ bắt
       *
       * Note: Hiện tại chưa dùng gioBatDauThucTe
       * Day 4 sẽ bổ sung logic override thời gian
       */
      // Kiểm tra chuyến đi tồn tại
      const existing = await ChuyenDiModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: "Không tìm thấy chuyến đi" });
      }

      // Chỉ start khi đang 'chua_khoi_hanh'
      if (existing.trangThai !== "chua_khoi_hanh") {
        return res.status(400).json({ success: false, message: "Chỉ có thể bắt đầu chuyến đi chưa khởi hành" });
      }

      const startTime = gioBatDauThucTe || new Date(); // TIMESTAMP

      const updated = await ChuyenDiModel.update(id, {
        trangThai: "dang_chay",
        gioBatDauThucTe: startTime,
      });

      if (!updated) {
        return res.status(400).json({ success: false, message: "Không thể bắt đầu chuyến đi" });
      }

      const trip = await ChuyenDiModel.getById(id);

      /**
       * 📡 BƯỚC 3: EMIT SOCKET.IO EVENT (CHỜ DAY 3)
       *
       * Giải thích:
       * - req.app: Express application instance
       * - req.app.get("io"): Lấy Socket.IO instance đã mount trong server.js
       * - io.to(`bus-${busId}`): Chọn room để emit
       * - io.emit("trip_started", data): Gửi event cho clients trong room
       *
       * Tại sao chưa hoạt động?
       * - Socket.IO server chưa được setup (Day 3)
       * - req.app.get("io") sẽ return undefined
       *
       * Flow Day 3:
       * 1. Setup Socket.IO server trong server.js
       * 2. app.set("io", io) để lưu instance
       * 3. Controller lấy io và emit event
       * 4. FE nhận event → Update UI realtime
       *
       * Event payload:
       * {
       *   tripId: 123,
       *   busId: 5,
       *   driverId: 7,
       *   startTime: "08:30",
       *   timestamp: "2025-10-27T01:30:00Z"
       * }
       */
      const io = req.app.get("io");
      if (io) {
        // Lấy thông tin schedule để biết busId, driverId
        const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
        if (schedule) {
          // Emit event vào room bus-{busId}
          // Tất cả clients đang subscribe room này sẽ nhận
          io.to(`bus-${schedule.maXe}`).emit("trip_started", {
            tripId: id,
            busId: schedule.maXe,
            driverId: schedule.maTaiXe,
            startTime: trip.gioBatDauThucTe,
            timestamp: new Date().toISOString(),
          });
        }
      }

      /**
       * ✅ BƯỚC 4: TRẢ RESPONSE THÀNH CÔNG
       *
       * Giải thích:
       * - res.status(200): Set HTTP status = 200 OK
       * - res.json(): Tạo JSON response và gửi về client
       *
       * Response structure:
       * {
       *   success: true,        // Đánh dấu thành công
       *   message: "...",       // Message cho user
       *   trip: { ... }         // Data trip đã cập nhật
       * }
       *
       * Driver app sẽ nhận response này và:
       * - Hiển thị message "Trip started"
       * - Cập nhật UI: Nút "Bắt đầu" → "Đang chạy"
       * - Enable tính năng gửi GPS
       * - Bắt đầu tracking
       */
      res.status(200).json({
        success: true,
        data: trip,
        message: "Bắt đầu chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.startTrip:", error);
      return response.serverError(res, "Lỗi server khi bắt đầu chuyến đi", error);
    }
  }

  // Kết thúc chuyến đi (M4-M6: Response envelope + stats calculation + WS events)
  static async endTrip(req, res) {
    try {
      const { id } = req.params;
      const { gioKetThucThucTe, ghiChu } = req.body;

      if (!id) {
        return response.validationError(res, "Mã chuyến đi là bắt buộc", [
          { field: "id", message: "Mã chuyến đi không được để trống" }
        ]);
      }

      // Get trip first
      const trip = await ChuyenDiModel.getById(id);
      if (!trip) {
        return response.notFound(res, "Không tìm thấy chuyến đi");
      }

      // M4-M6: Only end trips that are started/enroute
      if (trip.trangThai !== "dang_chay" && trip.trangThai !== "dang_thuc_hien") {
        return response.error(res, "INVALID_TRIP_STATUS", "Chỉ có thể kết thúc chuyến đi đang chạy", 400);
      }

      const endTime = gioKetThucThucTe || new Date();

      // M4-M6: Use service if available (will calculate stats)
      let updatedTrip;
      try {
        if (tripService && tripService.complete) {
          updatedTrip = await tripService.complete(id, req.user?.userId);
        } else {
          // Fallback: Update status and end time
          const isUpdated = await ChuyenDiModel.update(id, {
            trangThai: "hoan_thanh", // M4-M6: completed
            gioKetThucThucTe: endTime,
            ghiChu: ghiChu || trip.ghiChu,
          });

          if (!isUpdated) {
            return response.error(res, "TRIP_UPDATE_FAILED", "Không thể kết thúc chuyến đi", 400);
          }

          updatedTrip = await ChuyenDiModel.getById(id);
        }
      } catch (serviceError) {
        if (serviceError.message === "TRIP_NOT_FOUND") {
          return response.notFound(res, "Không tìm thấy chuyến đi");
        }
        throw serviceError;
      }

      // M4-M6: Emit WS events
      const io = req.app.get("io");
      let busId = null;
      if (io && updatedTrip) {
        const schedule = await LichTrinhModel.getById(updatedTrip.maLichTrinh);
        if (schedule) {
          busId = schedule.maXe;
          const eventData = {
            tripId: parseInt(id),
            busId: busId,
            driverId: schedule.maTaiXe,
            routeId: schedule.maTuyen,
            endTime: updatedTrip.gioKetThucThucTe,
            status: "completed",
            timestamp: new Date().toISOString(),
          };

          // Emit to multiple rooms
          io.to(`trip-${id}`).emit("trip_completed", eventData);
          io.to(`bus-${busId}`).emit("trip_completed", eventData);
          io.to("role-quan_tri").emit("trip_completed", eventData);
        }
      }

      // M4-M6: Clear telemetry cache
      if (busId) {
        TelemetryService.clearTripData(parseInt(id), busId);
      }

      return response.ok(res, updatedTrip);
    } catch (error) {
      console.error("Error in TripController.endTrip:", error);
      return response.serverError(res, "Lỗi server khi kết thúc chuyến đi", error);
    }
  }

  // Hủy chuyến đi (M4-M6: Response envelope + WS events)
  static async cancelTrip(req, res) {
    try {
      const { id } = req.params;
      const { lyDoHuy, ghiChu } = req.body;

      if (!id) {
        return response.validationError(res, "Mã chuyến đi là bắt buộc", [
          { field: "id", message: "Mã chuyến đi không được để trống" }
        ]);
      }

      // Get trip
      const trip = await ChuyenDiModel.getById(id);
      if (!trip) {
        return response.notFound(res, "Không tìm thấy chuyến đi");
      }

      // M4-M6: Cannot cancel completed trips
      if (trip.trangThai === "hoan_thanh" || trip.trangThai === "da_hoan_thanh") {
        return response.error(res, "INVALID_TRIP_STATUS", "Không thể hủy chuyến đi đã hoàn thành", 400);
      }

      // Update status
      const cancelReason = lyDoHuy || ghiChu || trip.ghiChu || "Hủy bởi người dùng";
      const isUpdated = await ChuyenDiModel.update(id, {
        trangThai: "huy", // M4-M6: canceled (map từ huy/bi_huy)
        ghiChu: cancelReason,
      });

      if (!isUpdated) {
        return response.error(res, "TRIP_UPDATE_FAILED", "Không thể hủy chuyến đi", 400);
      }

      // M4-M6: Emit WS events
      const io = req.app.get("io");
      let busId = null;
      if (io) {
        const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
        if (schedule) {
          busId = schedule.maXe;
          const eventData = {
            tripId: parseInt(id),
            busId: busId,
            driverId: schedule.maTaiXe,
            routeId: schedule.maTuyen,
            reason: cancelReason,
            status: "canceled",
            timestamp: new Date().toISOString(),
          };

          // Emit to multiple rooms
          io.to(`trip-${id}`).emit("trip_cancelled", eventData);
          io.to(`bus-${busId}`).emit("trip_cancelled", eventData);
          io.to("role-quan_tri").emit("trip_cancelled", eventData);
        }
      }

      // M4-M6: Clear telemetry cache
      if (busId) {
        TelemetryService.clearTripData(parseInt(id), busId);
      }

      const updatedTrip = await ChuyenDiModel.getById(id);
      return response.ok(res, updatedTrip);
    } catch (error) {
      console.error("Error in TripController.cancelTrip:", error);
      return response.serverError(res, "Lỗi server khi hủy chuyến đi", error);
    }
  }

  // Thêm học sinh vào chuyến đi
  static async addStudent(req, res) {
    try {
      const { id } = req.params;
      const { maHocSinh, trangThai = "dang_cho", ghiChu } = req.body;

      if (!id || !maHocSinh) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi và mã học sinh là bắt buộc",
        });
      }

      // Kiểm tra chuyến đi có tồn tại không
      const trip = await ChuyenDiModel.getById(id);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chuyến đi",
        });
      }

      // Kiểm tra học sinh có tồn tại không
      const student = await HocSinhModel.getById(maHocSinh);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học sinh",
        });
      }

      // Kiểm tra học sinh đã trong chuyến đi chưa
      const existingStatus = await TrangThaiHocSinhModel.getByTripAndStudent(
        id,
        maHocSinh
      );
      if (existingStatus) {
        return res.status(409).json({
          success: false,
          message: "Học sinh đã có trong chuyến đi này",
        });
      }

      // Kiểm tra học sinh có đang trong chuyến đi khác không
      const activeTrip = await TrangThaiHocSinhModel.getActiveByStudentId(
        maHocSinh
      );
      if (activeTrip.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Học sinh đang trong chuyến đi khác",
          data: { activeTripId: activeTrip[0].maChuyen },
        });
      }

      const statusData = {
        maChuyen: id,
        maHocSinh,
        trangThai,
        thoiGianCapNhat: new Date().toISOString(),
        ghiChu: ghiChu || null,
      };

      const newStatusId = await TrangThaiHocSinhModel.create(statusData);
      const newStatus = await TrangThaiHocSinhModel.getById(newStatusId);

      res.status(201).json({
        success: true,
        data: newStatus,
        message: "Thêm học sinh vào chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.addStudent:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thêm học sinh vào chuyến đi",
        error: error.message,
      });
    }
  }

  // M4-M6: Check-in học sinh (lên xe) - Attendance API
  static async checkinStudent(req, res) {
    try {
      const { id, studentId } = req.params;
      const { ghiChu } = req.body;

      if (!id || !studentId) {
        return response.validationError(res, "Mã chuyến đi và mã học sinh là bắt buộc", [
          { field: "id", message: "Mã chuyến đi không được để trống" },
          { field: "studentId", message: "Mã học sinh không được để trống" }
        ]);
      }

      // Get trip
      const trip = await ChuyenDiModel.getById(id);
      if (!trip) {
        return response.notFound(res, "Không tìm thấy chuyến đi");
      }

      // M4-M6: Only allow checkin for active trips
      if (trip.trangThai !== "dang_chay" && trip.trangThai !== "dang_thuc_hien") {
        return response.error(res, "INVALID_TRIP_STATUS", "Chỉ có thể điểm danh khi chuyến đi đang chạy", 400);
      }

      // Get student status
      const studentStatus = await TrangThaiHocSinhModel.getById(id, studentId);
      if (!studentStatus) {
        return response.notFound(res, "Học sinh không có trong chuyến đi này");
      }

      // M4-M6: Update status to 'da_don' (onboard)
      const isUpdated = await TrangThaiHocSinhModel.update(id, studentId, {
        trangThai: "da_don", // M4-M6: onboard
        thoiGianThucTe: new Date(),
        ghiChu: ghiChu || studentStatus.ghiChu,
      });

      if (!isUpdated) {
        return response.error(res, "UPDATE_FAILED", "Không thể cập nhật trạng thái học sinh", 400);
      }

      // Get updated status
      const updatedStatus = await TrangThaiHocSinhModel.getById(id, studentId);
      const student = await HocSinhModel.getById(studentId);

      // M4-M6: Emit WS event pickup_status_update
      const io = req.app.get("io");
      if (io) {
        const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
        const eventData = {
          tripId: parseInt(id),
          studentId: parseInt(studentId),
          studentName: student?.hoTen || `Học sinh #${studentId}`,
          status: "onboard", // M4-M6: Standardized status
          tsServer: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        };

        // Emit to trip room (parents + admin)
        io.to(`trip-${id}`).emit("pickup_status_update", eventData);
        
        // Emit to parent's user room
        if (student?.maPhuHuynh) {
          io.to(`user-${student.maPhuHuynh}`).emit("pickup_status_update", eventData);
        }
        
        // Emit to role-admin
        io.to("role-quan_tri").emit("pickup_status_update", eventData);
      }

      return response.ok(res, {
        ...updatedStatus,
        studentName: student?.hoTen,
        status: "onboard", // M4-M6: Standardized
      });
    } catch (error) {
      console.error("Error in TripController.checkinStudent:", error);
      return response.serverError(res, "Lỗi server khi điểm danh học sinh", error);
    }
  }

  // M4-M6: Check-out học sinh (xuống xe) - Attendance API
  static async checkoutStudent(req, res) {
    try {
      const { id, studentId } = req.params;
      const { ghiChu } = req.body;

      if (!id || !studentId) {
        return response.validationError(res, "Mã chuyến đi và mã học sinh là bắt buộc", [
          { field: "id", message: "Mã chuyến đi không được để trống" },
          { field: "studentId", message: "Mã học sinh không được để trống" }
        ]);
      }

      // Get trip
      const trip = await ChuyenDiModel.getById(id);
      if (!trip) {
        return response.notFound(res, "Không tìm thấy chuyến đi");
      }

      // Get student status
      const studentStatus = await TrangThaiHocSinhModel.getById(id, studentId);
      if (!studentStatus) {
        return response.notFound(res, "Học sinh không có trong chuyến đi này");
      }

      // M4-M6: Update status to 'da_tra' (dropped)
      const isUpdated = await TrangThaiHocSinhModel.update(id, studentId, {
        trangThai: "da_tra", // M4-M6: dropped
        thoiGianThucTe: new Date(),
        ghiChu: ghiChu || studentStatus.ghiChu,
      });

      if (!isUpdated) {
        return response.error(res, "UPDATE_FAILED", "Không thể cập nhật trạng thái học sinh", 400);
      }

      // Get updated status
      const updatedStatus = await TrangThaiHocSinhModel.getById(id, studentId);
      const student = await HocSinhModel.getById(studentId);

      // M4-M6: Emit WS event pickup_status_update
      const io = req.app.get("io");
      if (io) {
        const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
        const eventData = {
          tripId: parseInt(id),
          studentId: parseInt(studentId),
          studentName: student?.hoTen || `Học sinh #${studentId}`,
          status: "dropped", // M4-M6: Standardized status
          tsServer: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        };

        // Emit to trip room (parents + admin)
        io.to(`trip-${id}`).emit("pickup_status_update", eventData);
        
        // Emit to parent's user room
        if (student?.maPhuHuynh) {
          io.to(`user-${student.maPhuHuynh}`).emit("pickup_status_update", eventData);
        }
        
        // Emit to role-admin
        io.to("role-quan_tri").emit("pickup_status_update", eventData);
      }

      return response.ok(res, {
        ...updatedStatus,
        studentName: student?.hoTen,
        status: "dropped", // M4-M6: Standardized
      });
    } catch (error) {
      console.error("Error in TripController.checkoutStudent:", error);
      return response.serverError(res, "Lỗi server khi điểm danh học sinh", error);
    }
  }

  // Cập nhật trạng thái học sinh trong chuyến đi (Legacy - keep for backward compatibility)
  static async updateStudentStatus(req, res) {
    try {
      const { id, studentId } = req.params;
      const { trangThai, ghiChu } = req.body;

      if (!id || !studentId) {
        return response.validationError(res, "Mã chuyến đi và mã học sinh là bắt buộc", [
          { field: "id", message: "Mã chuyến đi không được để trống" },
          { field: "studentId", message: "Mã học sinh không được để trống" }
        ]);
      }

      if (!trangThai) {
        return response.validationError(res, "Trạng thái là bắt buộc", [
          { field: "trangThai", message: "Trạng thái không được để trống" }
        ]);
      }

      // Validation trạng thái
      const validStatuses = [
        "dang_cho",
        "da_len_xe",
        "da_xuong_xe",
        "vang_mat",
      ];
      if (!validStatuses.includes(trangThai)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
          validStatuses,
        });
      }

      // Kiểm tra trạng thái học sinh có tồn tại không
      const existingStatus = await TrangThaiHocSinhModel.getByTripAndStudent(
        id,
        studentId
      );
      if (!existingStatus) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học sinh trong chuyến đi này",
        });
      }

      // Cập nhật trạng thái
      const isUpdated = await TrangThaiHocSinhModel.update(
        existingStatus.maTrangThai,
        {
          trangThai,
          thoiGianCapNhat: new Date().toISOString(),
          ghiChu: ghiChu || existingStatus.ghiChu,
        }
      );

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật trạng thái học sinh",
        });
      }

      const updatedStatus = await TrangThaiHocSinhModel.getById(
        existingStatus.maTrangThai
      );

      res.status(200).json({
        success: true,
        data: updatedStatus,
        message: "Cập nhật trạng thái học sinh thành công",
      });
    } catch (error) {
      console.error("Error in TripController.updateStudentStatus:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái học sinh",
        error: error.message,
      });
    }
  }

  // Lấy thống kê chuyến đi
  static async getStats(req, res) {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          success: false,
          code: "VALIDATION_400",
          message:
            "Vui lòng cung cấp ngày bắt đầu (from) và ngày kết thúc (to)",
        });
      }

      // 1. Gọi hàm Model đã tối ưu
      const stats = await ChuyenDiModel.getStats(from, to);

      // 2. Xử lý và tính toán
      const totalTrips = parseFloat(stats.totalTrips || 0);
      const completedTrips = parseFloat(stats.completedTrips || 0);
      const onTimeTrips = parseFloat(stats.onTimeTrips || 0);

      // Tính onTimePercentage (dựa trên số chuyến đã hoàn thành)
      const onTimePercentage =
        completedTrips > 0 ? (onTimeTrips / completedTrips) * 100 : 0;

      // 3. Tạo response data khớp 100% với openapi.yaml
      const responseData = {
        totalTrips: totalTrips,
        completedTrips: completedTrips,
        cancelledTrips: parseFloat(stats.cancelledTrips || 0),
        delayedTrips: parseFloat(stats.delayedTrips || 0),
        averageDuration: parseFloat((stats.averageDurationInSeconds || 0) / 60), // Chuyển sang phút
        onTimePercentage: parseFloat(onTimePercentage.toFixed(2)), // Làm tròn 2 chữ số
      };

      res.status(200).json({
        success: true,
        meta: { queryRange: { from, to } },
        data: responseData,
      });
    } catch (error) {
      console.error("Error in TripController.getStats:", error);
      res.status(500).json({
        success: false,
        code: "INTERNAL_500",
        message: "Lỗi server khi lấy thống kê chuyến đi",
        error: error.message,
      });
    }
  }
}

export default TripController;
