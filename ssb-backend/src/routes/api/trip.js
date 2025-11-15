import express from "express";
import TripController from "../../controllers/TripController.js";
import AuthMiddleware from "../../middlewares/AuthMiddleware.js";
import ValidationMiddleware from "../../middlewares/ValidationMiddleware.js";

const router = express.Router();

// =============================================================================
// CRUD Endpoints for Trips
// =============================================================================

// GET /api/v1/trips/history - Lịch sử chuyến đi cho phụ huynh
router.get(
  "/history",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "phu_huynh"),
  TripController.getHistory
);

// GET /api/v1/trips - Lấy danh sách chuyến đi
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "tai_xe", "phu_huynh"),
  ValidationMiddleware.validatePagination,
  TripController.getAll
);

// GET /api/v1/trips/stats - Lấy thống kê chuyến đi
router.get(
  "/stats",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  TripController.getStats
);

// =============================================================================
// 🔥 FIX: Specific routes MUST be defined BEFORE generic /:id route
// =============================================================================
// Trip State Management Endpoints
// =============================================================================

// POST /api/v1/trips/:id/start - Bắt đầu chuyến đi
router.post(
  "/:id/start",
  AuthMiddleware.authenticate,
  AuthMiddleware.checkTripAccess,
  ValidationMiddleware.validateId,
  TripController.startTrip
);

// POST /api/v1/trips/:id/end - Kết thúc chuyến đi
router.post(
  "/:id/end",
  AuthMiddleware.authenticate,
  AuthMiddleware.checkTripAccess,
  ValidationMiddleware.validateId,
  TripController.endTrip
);

// POST /api/v1/trips/:id/cancel - Hủy chuyến đi
router.post(
  "/:id/cancel",
  AuthMiddleware.authenticate,
  AuthMiddleware.checkTripAccess,
  ValidationMiddleware.validateId,
  TripController.cancelTrip
);

// =============================================================================
// Student Management in Trips
// =============================================================================

// POST /api/v1/trips/:id/students/:studentId/checkin - Check-in học sinh (lên xe)
router.post(
  "/:id/students/:studentId/checkin",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "tai_xe"),
  ValidationMiddleware.validateId,
  TripController.checkinStudent
);

// POST /api/v1/trips/:id/students/:studentId/checkout - Check-out học sinh (xuống xe)
router.post(
  "/:id/students/:studentId/checkout",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "tai_xe"),
  ValidationMiddleware.validateId,
  TripController.checkoutStudent
);

// POST /api/v1/trips/:id/students/:studentId/absent - Đánh vắng học sinh
router.post(
  "/:id/students/:studentId/absent",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "tai_xe"),
  ValidationMiddleware.validateId,
  TripController.markStudentAbsent
);

// POST /api/v1/trips/:id/incident - Báo cáo sự cố
// 🔥 FIX: Route này phải được định nghĩa TRƯỚC route /:id để tránh conflict
router.post(
  "/:id/incident",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "tai_xe"),
  ValidationMiddleware.validateId,
  TripController.reportIncident
);

// POST /api/v1/trips/:id/students - Thêm học sinh vào chuyến đi
router.post(
  "/:id/students",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "tai_xe"),
  ValidationMiddleware.validateId,
  TripController.addStudent
);

// PUT /api/v1/trips/:id/students/:studentId - Cập nhật trạng thái học sinh (Legacy)
router.put(
  "/:id/students/:studentId",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "tai_xe"),
  ValidationMiddleware.validateId,
  TripController.updateStudentStatus
);

// =============================================================================
// Generic CRUD Endpoints (must be AFTER specific routes)
// =============================================================================

// GET /api/v1/trips/:id - Lấy thông tin chi tiết chuyến đi
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.checkTripAccess,
  ValidationMiddleware.validateId,
  TripController.getById
);

// POST /api/v1/trips - Tạo chuyến đi mới
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateTrip,
  TripController.create
);

// PUT /api/v1/trips/:id - Cập nhật chuyến đi
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.checkTripAccess,
  ValidationMiddleware.validateId,
  TripController.update
);

// DELETE /api/v1/trips/:id - Xóa chuyến đi
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateId,
  TripController.delete
);

export default router;
