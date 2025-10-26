import express from "express";
import TripController from "controllers/TripController.js";
import AuthMiddleware from "middlewares/AuthMiddleware.js";

const router = express.Router();

// GET /api/v1/reports/trips/stats 
router.get(
  "/stats", // Route này sẽ thành /api/v1/reports/trips/stats khi gắn vào app
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin, // Đảm bảo chỉ admin mới được truy cập
  TripController.getStats
);
// ... (các route GET, POST, PUT khác của trip giữ nguyên) ...

export default router;