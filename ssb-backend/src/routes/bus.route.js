// src/api/routes/bus.route.js
const express = require("express");
const router = express.Router();

const busController = require("../controllers/buscontroller"); // Import controller

// Định nghĩa route: Khi có request GET đến đường dẫn gốc ('/')
// nó sẽ được xử lý bởi hàm getAllBuses trong busController
router.get("/", busController.getAllBuses);

// Các route khác (POST, PUT, DELETE...) sẽ được thêm ở đây

module.exports = router;
