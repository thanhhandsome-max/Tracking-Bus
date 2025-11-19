import express from "express";
import RouteController from "../../controllers/RouteController.js";
import AuthMiddleware from "../../middlewares/AuthMiddleware.js";
import ValidationMiddleware from "../../middlewares/ValidationMiddleware.js";

const router = express.Router();

// =============================================================================
// CRUD Endpoints for Routes
// =============================================================================

// GET /api/v1/routes - Lấy danh sách tuyến đường
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "tai_xe"),
  ValidationMiddleware.validatePagination,
  RouteController.getAllRoutes
);

// GET /api/v1/routes/stats - Lấy thống kê tuyến đường
router.get(
  "/stats",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  RouteController.getRouteStats
);

// GET /api/v1/routes/suggestions/routes - Đề xuất tuyến đường hoàn chỉnh
// ⚠️ QUAN TRỌNG: Phải đặt TRƯỚC route /:id để tránh match /suggestions như là :id
router.get(
  "/suggestions/routes",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  RouteController.suggestRoutes
);

// GET /api/v1/routes/suggestions/stops - Đề xuất điểm dừng dựa trên học sinh
// ⚠️ QUAN TRỌNG: Phải đặt TRƯỚC route /:id để tránh match /suggestions như là :id
router.get(
  "/suggestions/stops",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  RouteController.suggestStops
);

// GET /api/v1/routes/:id - Lấy thông tin chi tiết tuyến đường
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.checkRouteAccess,
  ValidationMiddleware.validateId,
  RouteController.getRouteById
);

// POST /api/v1/routes - Tạo tuyến đường mới
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateRoute,
  RouteController.createRoute
);

// POST /api/v1/routes/auto-create - Tạo tuyến đường tự động từ start → end với auto suggestion
router.post(
  "/auto-create",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  RouteController.autoCreateRoute
);

// POST /api/v1/routes/batch - Tạo nhiều tuyến đường cùng lúc (batch) với transaction
router.post(
  "/batch",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  RouteController.createRoutesBatch
);

// PUT /api/v1/routes/:id - Cập nhật tuyến đường
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateId,
  RouteController.updateRoute
);

// DELETE /api/v1/routes/:id - Xóa tuyến đường
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateId,
  RouteController.deleteRoute
);

// =============================================================================
// Stop Management Endpoints
// =============================================================================

// GET /api/v1/routes/:id/stops - Lấy danh sách điểm dừng của tuyến đường
router.get(
  "/:id/stops",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "tai_xe"),
  ValidationMiddleware.validateId,
  RouteController.getRouteStops
);

// GET /api/v1/routes/:id/stop-suggestions - Lấy gợi ý điểm dừng và học sinh cho route
router.get(
  "/:id/stop-suggestions",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateId,
  RouteController.getStopSuggestions
);

// POST /api/v1/routes/:id/stops - Thêm điểm dừng vào tuyến đường
router.post(
  "/:id/stops",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateId,
  ValidationMiddleware.validateRouteStop,
  RouteController.addStopToRoute
);

// PUT /api/v1/routes/:id/stops/:stopId - Cập nhật điểm dừng trong tuyến đường
router.put(
  "/:id/stops/:stopId",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateId,
  RouteController.updateStopInRoute
);

// DELETE /api/v1/routes/:id/stops/:stopId - Xóa điểm dừng khỏi tuyến đường
router.delete(
  "/:id/stops/:stopId",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateId,
  RouteController.removeStopFromRoute
);

// PATCH /api/v1/routes/:id/stops/reorder - Sắp xếp lại thứ tự stops
router.patch(
  "/:id/stops/reorder",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateId,
  RouteController.reorderStops
);

// POST /api/v1/routes/:id/rebuild-polyline - Rebuild polyline cho route
router.post(
  "/:id/rebuild-polyline",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateId,
  RouteController.rebuildPolyline
);

export default router;
