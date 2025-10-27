import express from "express";
import StudentController from "../../controllers/StudentController.js";
import AuthMiddleware from "../../middlewares/AuthMiddleware.js";
import ValidationMiddleware from "../../middlewares/ValidationMiddleware.js";

const router = express.Router();

// =============================================================================
// CRUD Endpoints
// =============================================================================

// GET /api/v1/students - Danh sách học sinh
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "phu_huynh"),
  ValidationMiddleware.validatePagination,
  StudentController.getAll
);

// GET /api/v1/students/stats - Thống kê học sinh
router.get(
  "/stats",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  StudentController.getStats
);

// GET /api/v1/students/class/:lop - Học sinh theo lớp
router.get(
  "/class/:lop",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri", "phu_huynh"),
  StudentController.getByClass
);

// GET /api/v1/students/:id - Chi tiết học sinh
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.checkStudentAccess,
  ValidationMiddleware.validateId,
  StudentController.getById
);

// POST /api/v1/students - Tạo học sinh mới
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateStudent,
  StudentController.create
);

// PUT /api/v1/students/:id - Cập nhật học sinh
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.checkStudentAccess,
  ValidationMiddleware.validateId,
  ValidationMiddleware.validateStudent,
  StudentController.update
);

// DELETE /api/v1/students/:id - Xóa học sinh
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ValidationMiddleware.validateId,
  StudentController.delete
);

export default router;
