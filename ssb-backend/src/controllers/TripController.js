import ChuyenDiModel from "../models/ChuyenDiModel.js";
import LichTrinhModel from "../models/LichTrinhModel.js";
import TrangThaiHocSinhModel from "../models/TrangThaiHocSinhModel.js";
import XeBuytModel from "../models/XeBuytModel.js";
import TaiXeModel from "../models/TaiXeModel.js";
import TuyenDuongModel from "../models/TuyenDuongModel.js";
import HocSinhModel from "../models/HocSinhModel.js";
import tripService from "../services/tripService.js"; // kết nối tới service xử lý logic trip

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
  // Lấy danh sách tất cả chuyến đi
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        ngayChay,
        trangThai,
        maTuyen,
        maXe,
        maTaiXe,
      } = req.query;
      const offset = (page - 1) * limit;

      // Dùng SQL-level filter để chính xác hơn (đặc biệt với ngày/thời gian)
      const filters = {
        ngayChay,
        trangThai,
        maTuyen,
        maXe,
        maTaiXe,
      };

      let trips = await ChuyenDiModel.getAll(filters);
      let totalCount = trips.length;

      // Phân trang (server-side slicing)
      const paginatedTrips = trips.slice(offset, offset + parseInt(limit));

      res.status(200).json({
        success: true,
        data: paginatedTrips,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
        },
        message: "Lấy danh sách chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.getAll:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách chuyến đi",
        error: error.message,
      });
    }
  }

  // Lấy thông tin chi tiết một chuyến đi
  static async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
        });
      }

      const trip = await ChuyenDiModel.getById(id);

      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chuyến đi",
        });
      }

      // Lấy thông tin chi tiết lịch trình
      const schedule = await LichTrinhModel.getById(trip.maLichTrinh);

      // Lấy thông tin xe buýt và tài xế
      const busInfo = await XeBuytModel.getById(schedule.maXe);
      const driverInfo = await TaiXeModel.getById(schedule.maTaiXe);
      const routeInfo = await TuyenDuongModel.getById(schedule.maTuyen);

      // Lấy danh sách học sinh trong chuyến đi
      const students = await TrangThaiHocSinhModel.getByTripId(id);

      res.status(200).json({
        success: true,
        data: {
          ...trip,
          schedule,
          busInfo,
          driverInfo,
          routeInfo,
          students,
        },
        message: "Lấy thông tin chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.getById:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin chuyến đi",
        error: error.message,
      });
    }
  }

  // Tạo chuyến đi mới
  static async create(req, res) {
    try {
      const {
        maLichTrinh,
        ngayChay,
        trangThai = "chua_khoi_hanh",
        gioBatDauThucTe = null,
        gioKetThucThucTe = null,
        ghiChu = null,
      } = req.body;

      // Validation dữ liệu bắt buộc
      if (!maLichTrinh || !ngayChay) {
        return res.status(400).json({
          success: false,
          message: "Mã lịch trình và ngày chạy là bắt buộc",
        });
      }

      // Validation ngày chạy
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(ngayChay)) {
        return res.status(400).json({
          success: false,
          message: "Ngày chạy phải có định dạng YYYY-MM-DD",
        });
      }

      // Kiểm tra lịch trình có tồn tại không
      const schedule = await LichTrinhModel.getById(maLichTrinh);
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lịch trình",
        });
      }

      // Kiểm tra lịch trình có đang áp dụng không
      if (!schedule.dangApDung) {
        return res.status(400).json({
          success: false,
          message: "Lịch trình không đang được áp dụng",
        });
      }

      // Kiểm tra xe buýt có đang hoạt động không
      const bus = await XeBuytModel.getById(schedule.maXe);
      if (!bus || bus.trangThai !== "hoat_dong") {
        return res.status(400).json({
          success: false,
          message: "Xe buýt không đang hoạt động",
        });
      }

      // Kiểm tra tài xế có đang hoạt động không
      const driver = await TaiXeModel.getById(schedule.maTaiXe);
      if (!driver || driver.trangThai !== "hoat_dong") {
        return res.status(400).json({
          success: false,
          message: "Tài xế không đang hoạt động",
        });
      }

      // Kiểm tra chuyến đi đã tồn tại chưa
      const existingTrip = await ChuyenDiModel.getByScheduleAndDate(
        maLichTrinh,
        ngayChay
      );
      if (existingTrip) {
        return res.status(409).json({
          success: false,
          message: "Chuyến đi đã tồn tại cho lịch trình này trong ngày",
        });
      }

      // Validation trạng thái
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

      const tripData = {
        maLichTrinh,
        ngayChay,
        trangThai,
        gioBatDauThucTe,
        gioKetThucThucTe,
        ghiChu,
      };

      const newTripId = await ChuyenDiModel.create(tripData);
      const newTrip = await ChuyenDiModel.getById(newTripId);

      res.status(201).json({
        success: true,
        data: newTrip,
        message: "Tạo chuyến đi mới thành công",
      });
    } catch (error) {
      console.error("Error in TripController.create:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo chuyến đi mới",
        error: error.message,
      });
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
      /**
       * ❌ XỬ LÝ LỖI
       *
       * Giải thích:
       * - try/catch: Bắt mọi error từ service
       * - Service throw error → Catch block bắt
       *
       * Các loại error:
       * 1. "Không tìm thấy chuyến đi" → 404
       * 2. "Chỉ có thể bắt đầu chuyến đi chưa khởi hành" → 400
       * 3. "Không thể bắt đầu chuyến đi" → 500
       * 4. Database errors → 500
       *
       * console.error():
       * - Log error ra console để debug
       * - Production: Nên log vào file hoặc service (Winston, Sentry)
       * - Format: "Error in TripController.startTrip: <message>"
       *
       * Response error:
       * {
       *   success: false,
       *   message: "Lỗi server khi bắt đầu chuyến đi",
       *   error: "Không tìm thấy chuyến đi"
       * }
       *
       * Note: Có thể cải thiện bằng cách check error type
       * và trả về status code phù hợp (404, 400, 500...)
       */
      console.error("Error in TripController.startTrip:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi bắt đầu chuyến đi",
        error: error.message,
      });
    }
  }

  // Kết thúc chuyến đi
  static async endTrip(req, res) {
    try {
  const { id } = req.params;
  const { gioKetThucThucTe, ghiChu } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
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

      // Kiểm tra trạng thái hiện tại
      if (trip.trangThai !== "dang_chay") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể kết thúc chuyến đi đang chạy",
        });
      }

      const endTime = gioKetThucThucTe || new Date();

      // Cập nhật trạng thái và giờ kết thúc
      const isUpdated = await ChuyenDiModel.update(id, {
        trangThai: "hoan_thanh",
        gioKetThucThucTe: endTime,
        ghiChu: ghiChu || trip.ghiChu,
      });

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể kết thúc chuyến đi",
        });
      }

      // Phát sự kiện real-time
      const io = req.app.get("io");
      if (io) {
        const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
        if (schedule) {
          io.to(`bus-${schedule.maXe}`).emit("trip_completed", {
            tripId: id,
            busId: schedule.maXe,
            driverId: schedule.maTaiXe,
            endTime,
            timestamp: new Date().toISOString(),
          });
        }
      }

      const updatedTrip = await ChuyenDiModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedTrip,
        message: "Kết thúc chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.endTrip:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi kết thúc chuyến đi",
        error: error.message,
      });
    }
  }

  // Hủy chuyến đi
  static async cancelTrip(req, res) {
    try {
      const { id } = req.params;
      const { lyDoHuy } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
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

      // Kiểm tra trạng thái hiện tại
      if (trip.trangThai === "da_hoan_thanh") {
        return res.status(400).json({
          success: false,
          message: "Không thể hủy chuyến đi đã hoàn thành",
        });
      }

      // Cập nhật trạng thái
      const isUpdated = await ChuyenDiModel.update(id, {
        trangThai: "bi_huy",
        ghiChu: lyDoHuy || trip.ghiChu,
      });

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể hủy chuyến đi",
        });
      }

      // Phát sự kiện real-time
      const io = req.app.get("io");
      if (io) {
        const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
        if (schedule) {
          io.to(`bus-${schedule.maXe}`).emit("trip_cancelled", {
            tripId: id,
            busId: schedule.maXe,
            driverId: schedule.maTaiXe,
            reason: lyDoHuy,
            timestamp: new Date().toISOString(),
          });
        }
      }

      const updatedTrip = await ChuyenDiModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedTrip,
        message: "Hủy chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.cancelTrip:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi hủy chuyến đi",
        error: error.message,
      });
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

  // Cập nhật trạng thái học sinh trong chuyến đi
  static async updateStudentStatus(req, res) {
    try {
      const { id, studentId } = req.params;
      const { trangThai, ghiChu } = req.body;

      if (!id || !studentId) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi và mã học sinh là bắt buộc",
        });
      }

      if (!trangThai) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái là bắt buộc",
        });
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
