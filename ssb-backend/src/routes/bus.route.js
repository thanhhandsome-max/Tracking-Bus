import express from "express";
const router = express.Router();

import BusController from "controllers/BusController.js"; // Corrected case
import AuthMiddleware from "middlewares/AuthMiddleware.js";

// Định nghĩa route: Khi có request GET đến đường dẫn gốc ('/')
// nó sẽ được xử lý bởi hàm getAllBuses trong busController
router.get(
  "/stats", // Route này sẽ thành /api/v1/reports/buses/stats khi gắn vào app
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin, // Chỉ admin mới được truy cập
  BusController.getStats
);
// Các route khác (POST, PUT, DELETE...) sẽ được thêm ở đây

export default router;
