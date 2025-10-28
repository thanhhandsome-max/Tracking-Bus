import BusService from "../services/BusService.js";

class BusController {
  // GET /api/v1/buses
  static async list(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy,
        sortDir,
      } = req.query;

      const result = await BusService.list({
        page: Number(page),
        limit: Number(limit),
        search,
        status,
        sortBy,
        sortDir,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // GET /api/v1/buses/:id
  static async get(req, res) {
    try {
      const { id } = req.params;
      const bus = await BusService.getById(id);

      if (!bus) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt",
        });
      }

      return res.status(200).json({
        success: true,
        data: bus,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }


  static async getStats(req, res) {
    try {
      // 1. Lấy thông tin cơ bản về xe từ Model
      // Lưu ý: Đảm bảo XeBuytModel đã được import và có hàm getStats đúng
      const XeBuytModel = (await import("../models/XeBuytModel.js")).default; 
      const busData = await XeBuytModel.getStats();

      // 2. Xử lý số lượng xe theo trạng thái
      let activeBuses = 0;
      let maintenanceBuses = 0;
      (busData.busCounts || []).forEach(row => {
        if (row.trangThai === 'hoat_dong') {
          activeBuses = row.count;
        } else if (row.trangThai === 'bao_tri') {
          maintenanceBuses = row.count;
        }
      });

      // 3. Lấy thông tin thống kê chuyến đi TỔNG (tạm thời)
      // Lưu ý: Đảm bảo ChuyenDiModel đã được import và có hàm getStats đúng
      const ChuyenDiModel = (await import("../models/ChuyenDiModel.js")).default;
      const today = new Date().toISOString().split('T')[0]; 
      const tripStatsOverall = await ChuyenDiModel.getStats(today, today); 

      // 4. Tạo response data khớp với openapi.yaml
      const responseData = {
        totalBuses: busData.totalBuses || 0,
        activeBuses: activeBuses,
        maintenanceBuses: maintenanceBuses,
        averageUtilization: 0, // Tạm thời
        totalTrips: tripStatsOverall.totalTrips || 0, 
        completedTrips: tripStatsOverall.completedTrips || 0, 
        delayedTrips: tripStatsOverall.delayedTrips || 0, 
      };
      
      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error("Error in BusController.getStats:", error);
      // Sử dụng cấu trúc lỗi nhất quán (nếu có)
      res.status(500).json({
        success: false,
        // code: "INTERNAL_500", // Thêm mã lỗi nếu có
        message: "Lỗi server khi lấy thống kê xe buýt",
        error: error.message, // Chỉ trả về error.message ở môi trường dev
      });
    }
  }


    

  // POST /api/v1/buses
  static async create(req, res) {
    try {
      const { bienSoXe, dongXe, sucChua, trangThai } = req.body;

      const newBus = await BusService.create({
        bienSoXe,
        dongXe,
        sucChua,
        trangThai,
      });

      return res.status(201).json({
        success: true,
        data: newBus,
        message: "Tạo xe buýt thành công",
      });
    } catch (err) {
      console.error(err);

      if (err.message === "PLATE_EXISTS") {
        return res.status(409).json({
          success: false,
          message: "Biển số xe đã tồn tại",
        });
      }

      if (err.message.startsWith("SEAT_COUNT_MIN_")) {
        return res.status(400).json({
          success: false,
          message: `Số ghế phải >= ${err.message.split("_").pop()}`,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // PUT /api/v1/buses/:id
  static async update(req, res) {
    try {
      const { id } = req.params;
      const payload = req.body;

      const updatedBus = await BusService.update(id, payload);

      if (!updatedBus) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt",
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedBus,
        message: "Cập nhật xe buýt thành công",
      });
    } catch (err) {
      console.error(err);

      if (err.message === "PLATE_EXISTS") {
        return res.status(409).json({
          success: false,
          message: "Biển số xe đã tồn tại",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // DELETE /api/v1/buses/:id
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const success = await BusService.remove(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Xóa xe buýt thành công",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // POST /api/v1/buses/:id/assign-driver
  static async assignDriver(req, res) {
    try {
      const { id } = req.params;
      const { driverId } = req.body;

      const result = await BusService.assignDriver(id, driverId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt hoặc tài xế",
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
        message: "Phân công tài xế thành công",
      });
    } catch (err) {
      console.error(err);

      if (err.message === "DRIVER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài xế",
        });
      }

      if (err.message === "DRIVER_NOT_AVAILABLE") {
        return res.status(400).json({
          success: false,
          message: "Tài xế không khả dụng",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // POST /api/v1/buses/:id/position
  static async updatePosition(req, res) {
    try {
      const { id } = req.params;
      const { lat, lng, speed, heading, timestamp } = req.body;

      const result = await BusService.updatePosition(id, {
        lat,
        lng,
        speed,
        heading,
        timestamp,
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt",
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
        message: "Cập nhật vị trí thành công",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }
}

export default BusController;
