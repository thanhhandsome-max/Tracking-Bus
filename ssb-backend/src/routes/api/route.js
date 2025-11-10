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

// GET /api/v1/routes/:id - Lấy thông tin chi tiết tuyến đường
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "tai_xe"),
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

// POST /api/v1/routes/:id/stops - Thêm điểm dừng vào tuyến đường
router.post(
  "/:id/stops",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateId,
  ValidationMiddleware.validateRouteStop,
  RouteController.addStopToRoute
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
