// src/api/routes/bus.route.js
import express from "express";
const router = express.Router();

import busController from "../controllers/buscontroller.js"; // Import controller

// Định nghĩa route: Khi có request GET đến đường dẫn gốc ('/')
// nó sẽ được xử lý bởi hàm getAllBuses trong busController
router.get("/", busController.getAllBuses);

// Các route khác (POST, PUT, DELETE...) sẽ được thêm ở đây

export default router;
