/**
 * 🚌 TRIP ROUTES - Quản lý các chuyến đi xe buýt
 *
 * 🎯 MỤC ĐÍCH FILE NÀY:
 * - Định nghĩa các endpoint API để quản lý chuyến đi (Trip Lifecycle)
 * - Kết nối HTTP requests từ client → Controller xử lý logic , controller là TripController.js là nơi xử lý logic chính
 * - Áp dụng middleware authentication và authorization
 *
 * 🔧 CÁCH HOẠT ĐỘNG:
 * 1. Client gửi HTTP request (POST /api/trips/:id/start)
 * 2. Express nhận request → Router này bắt request
 * 3. Middleware AuthMiddleware.authenticate kiểm tra JWT token
 * 4. Nếu hợp lệ → Chuyển tiếp đến TripController.startTrip()
 * 5. Controller xử lý logic → Trả response về client
 *
 * 🗺️ CẤU TRÚC ROUTES:
 * - GET    /api/trips/stats        → Thống kê chuyến đi (Admin only)
 * - POST   /api/trips/:id/start    → Bắt đầu chuyến đi (Driver only) [MỚI - DAY 2]
 * - POST   /api/trips/:id/end      → Kết thúc chuyến đi (Driver only) [TODO - DAY 4]
 * - POST   /api/trips/:id/telemetry → Nhận GPS từ driver (Driver only) [TODO - DAY 4]
 *
 * 📚 LIÊN KẾT:
 * - Controller: src/controllers/TripController.js // Xử lý logic chính
 * - Middleware: src/middlewares/AuthMiddleware.js // Xác thực JWT và phân quyền
 * - Service: src/services/tripService.js (sẽ tạo) // Xử lý tương tác DB
 * - Mount point: src/app.js → app.use('/api/trips', tripRoutes) // Đăng ký route này trong app.js
 *
 * @author Nguyễn Tuấn Tài - M4/M5/M6
 * @date 2025-10-27 (Day 2 - Trip Lifecycle)
 */

import express from "express";
import TripController from "controllers/TripController.js";
import AuthMiddleware from "middlewares/AuthMiddleware.js";

const router = express.Router();

/**
 * 📊 GET /api/trips/stats
 *
 * 🎯 Mục đích: Lấy thống kê tổng quan về chuyến đi
 * 🔐 Quyền: Admin only
 * 📖 Ví dụ response:
 * {
 *   "totalTrips": 150, // Tổng số chuyến đi
 *   "completedTrips": 120, // Số chuyến đi đã hoàn thành
 *   "ongoingTrips": 5, // Số chuyến đi đang diễn ra
 *   "cancelledTrips": 25 // Số chuyến đi đã bị hủy
 * }
 */
router.get(
  "/stats", // Endpoint: /api/trips/stats
  AuthMiddleware.authenticate, // Kiểm tra user đã đăng nhập?
  AuthMiddleware.requireAdmin, // Kiểm tra user là Admin?
  TripController.getStats // Xử lý logic lấy thống kê trip
);

/**
 * 🚀 POST /api/trips/:id/start
 *
 * 🎯 Mục đích: Tài xế bắt đầu một chuyến đi
 * 🔐 Quyền: Driver only (chỉ tài xế được phân công mới start được)
 *
 * 📥 Request:
 * - URL Params: id (maChuyen - ID của chuyến đi)
 * - Body: {} (có thể rỗng hoặc gửi thêm gioBatDauThucTe)
 * - Headers: Authorization: Bearer <JWT_TOKEN> (cần có token hợp lệ)
 *
 * 📤 Response Success (200):
 * {
 *   "success": true,
 *   "message": "Trip started",
 *   "trip": {
 *     "maChuyen": 1,
 *     "trangThai": "dang_chay",
 *     "gioBatDauThucTe": "2025-10-27T06:30:00.000Z"
 *   }
 * }
 *
 * ❌ Response Error (404):
 * {
 *   "success": false,
 *   "message": "Không tìm thấy chuyến đi"
 * }
 *
 * 🔄 FLOW HOẠT ĐỘNG:
 * 1. Driver mở app → Nhấn "Bắt đầu chuyến"
 * 2. App gửi POST /api/trips/123/start với JWT token
 * 3. AuthMiddleware.authenticate → Kiểm tra token có hợp lệ?
 *    - Nếu KHÔNG → Trả 401 Unauthorized
 *    - Nếu CÓ → Tiếp tục
 * 4. TripController.startTrip() được gọi:
 *    - Lấy tripId từ req.params.id
 *    - Gọi tripService.startTrip(tripId)
 *    - Service cập nhật DB: trangThai = "dang_chay", gioBatDauThucTe = NOW()
 *    - Console.log event trip_started (Day 3 sẽ emit qua Socket.IO)
 * 5. Trả response về driver app // response là object trip mới dùng để cập nhật UI
 *
 * 🧪 TEST BẰNG POSTMAN: // Postman dùng để kiểm tra API
 * POST http://localhost:4000/api/trips/1/start
 * // Cần có header Authorization với token hợp lệ
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * Body: {} (hoặc { "gioBatDauThucTe": "08:00" })
 *
 * 💡 TẠI SAO CẦN ROUTE NÀY?
 * - Cho phép tài xế "check-in" khi bắt đầu lái xe
 * - Cập nhật trạng thái chuyến đi trong hệ thống
 * - Phụ huynh biết xe đã khởi hành, bắt đầu tracking
 * - Ghi lại thời gian bắt đầu thực tế để so sánh với kế hoạch
 * - Trigger các sự kiện realtime (Day 3) để FE cập nhật UI
 *
 * 🔗 LIÊN KẾT VỚI CÁC PHẦN KHÁC:
 * - Day 1: wsAuth.js → Sử dụng JWT để verify driver
 * - Day 2: tripService.js → Logic update database
 * - Day 3: Socket.IO → Emit event "trip_started" cho FE
 * - Day 4: Telemetry → Sau khi start, driver bắt đầu gửi GPS
 *
 * @method POST
 * @route /api/trips/:id/start
 * @access Private (Driver only)
 * @param {string} req.params.id - ID của chuyến đi (maChuyen)
 * @returns {Object} Trip object với trạng thái mới
 */
router.post(
  "/:id/start",
  AuthMiddleware.authenticate, // Bước 1: Kiểm tra user đã đăng nhập?
  // TODO Day 3: Thêm middleware kiểm tra quyền Driver
  // AuthMiddleware.requireDriver, // Bước 2: Kiểm tra là tài xế?
  TripController.startTrip // Bước 3: Xử lý logic start trip
);

/**
 * 📝 TODO - CÁC ROUTES SẼ BỔ SUNG SAU:
 *
 * Day 4 (29/10):
 * - POST /api/trips/:id/end → Kết thúc chuyến đi
 * - POST /api/trips/:id/telemetry → Nhận GPS data từ driver
 * - GET /api/trips/:id → Lấy chi tiết một chuyến
 *
 * Day 5 (30/10):
 * - GET /api/trips → Danh sách chuyến đi (có filter, pagination)
 * - POST /api/trips → Tạo chuyến mới (từ schedule)
 *
 * Ví dụ route sẽ thêm:
 *
 * router.post(
 *   "/:id/telemetry",
 *   AuthMiddleware.authenticate,
 *   AuthMiddleware.requireDriver,
 *   TripController.receiveTelemetry
 * );
 *
 * router.post(
 *   "/:id/end",
 *   AuthMiddleware.authenticate,
 *   AuthMiddleware.requireDriver,
 *   TripController.endTrip
 * );
 */

export default router;
