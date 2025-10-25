// BusController - Controller chuyên nghiệp cho quản lý xe buýt
import XeBuytModel from "../models/XeBuytModel.js";
import LichTrinhModel from "../models/LichTrinhModel.js";
import TaiXeModel from "../models/TaiXeModel.js";
import ChuyenDiModel from "../models/ChuyenDiModel.js";

class BusController {
  // Lấy danh sách tất cả xe buýt
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search, trangThai } = req.query;
      const offset = (page - 1) * limit;

      let buses = await XeBuytModel.getAll();
      let totalCount = buses.length;

      // Tìm kiếm theo biển số xe hoặc dòng xe
      if (search) {
        buses = buses.filter(
          (bus) =>
            bus.bienSoXe.toLowerCase().includes(search.toLowerCase()) ||
            bus.dongXe?.toLowerCase().includes(search.toLowerCase())
        );
        totalCount = buses.length;
      }

      // Lọc theo trạng thái
      if (trangThai) {
        buses = buses.filter((bus) => bus.trangThai === trangThai);
        totalCount = buses.length;
      }

      // Phân trang
      const paginatedBuses = buses.slice(offset, offset + parseInt(limit));

      res.status(200).json({
        success: true,
        data: paginatedBuses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
        },
        message: "Lấy danh sách xe buýt thành công",
      });
    } catch (error) {
      console.error("Error in BusController.getAll:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách xe buýt",
        error: error.message,
      });
    }
  }

  // Lấy thông tin chi tiết một xe buýt
  static async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã xe buýt là bắt buộc",
        });
      }

      const bus = await XeBuytModel.getById(id);

      if (!bus) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt",
        });
      }

      // Lấy lịch trình hiện tại của xe buýt
      const schedules = await LichTrinhModel.getByBusId(id);

      // Lấy thông tin tài xế hiện tại
      let currentDriver = null;
      if (schedules.length > 0) {
        const activeSchedule = schedules.find(
          (schedule) => schedule.dangApDung
        );
        if (activeSchedule) {
          currentDriver = await TaiXeModel.getById(activeSchedule.maTaiXe);
        }
      }

      // Lấy chuyến đi gần nhất
      const recentTrips = await ChuyenDiModel.getByBusId(id, 5);

      res.status(200).json({
        success: true,
        data: {
          ...bus,
          schedules,
          currentDriver,
          recentTrips,
        },
        message: "Lấy thông tin xe buýt thành công",
      });
    } catch (error) {
      console.error("Error in BusController.getById:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin xe buýt",
        error: error.message,
      });
    }
  }

  // Tạo xe buýt mới
  static async create(req, res) {
    try {
      const { bienSoXe, dongXe, sucChua, trangThai } = req.body;

      // Validation dữ liệu bắt buộc
      if (!bienSoXe || !sucChua) {
        return res.status(400).json({
          success: false,
          message: "Biển số xe và sức chứa là bắt buộc",
        });
      }

      // Validation biển số xe
      const plateRegex = /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/;
      if (!plateRegex.test(bienSoXe)) {
        return res.status(400).json({
          success: false,
          message: "Biển số xe không hợp lệ (VD: 29A-12345)",
        });
      }

      // Validation sức chứa
      if (sucChua < 10 || sucChua > 100) {
        return res.status(400).json({
          success: false,
          message: "Sức chứa phải từ 10 đến 100 người",
        });
      }

      // Kiểm tra biển số xe đã tồn tại chưa
      const existingBus = await XeBuytModel.getByPlate(bienSoXe);
      if (existingBus) {
        return res.status(409).json({
          success: false,
          message: "Biển số xe đã tồn tại trong hệ thống",
        });
      }

      // Validation trạng thái
      const validStatuses = ["hoat_dong", "bao_tri", "ngung_hoat_dong"];
      if (trangThai && !validStatuses.includes(trangThai)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
          validStatuses,
        });
      }

      const busData = {
        bienSoXe,
        dongXe: dongXe || null,
        sucChua: parseInt(sucChua),
        trangThai: trangThai || "hoat_dong",
      };

      const busId = await XeBuytModel.create(busData);
      const newBus = await XeBuytModel.getById(busId);

      res.status(201).json({
        success: true,
        data: newBus,
        message: "Tạo xe buýt mới thành công",
      });
    } catch (error) {
      console.error("Error in BusController.create:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo xe buýt mới",
        error: error.message,
      });
    }
  }

  // Cập nhật thông tin xe buýt
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { bienSoXe, dongXe, sucChua, trangThai } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã xe buýt là bắt buộc",
        });
      }

      // Kiểm tra xe buýt có tồn tại không
      const existingBus = await XeBuytModel.getById(id);
      if (!existingBus) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt",
        });
      }

      // Validation biển số xe nếu có thay đổi
      if (bienSoXe && bienSoXe !== existingBus.bienSoXe) {
        const plateRegex = /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/;
        if (!plateRegex.test(bienSoXe)) {
          return res.status(400).json({
            success: false,
            message: "Biển số xe không hợp lệ (VD: 29A-12345)",
          });
        }

        // Kiểm tra biển số xe trùng lặp
        const duplicateBus = await XeBuytModel.getByPlate(bienSoXe);
        if (duplicateBus) {
          return res.status(409).json({
            success: false,
            message: "Biển số xe đã tồn tại trong hệ thống",
          });
        }
      }

      // Validation sức chứa nếu có thay đổi
      if (sucChua !== undefined && (sucChua < 10 || sucChua > 100)) {
        return res.status(400).json({
          success: false,
          message: "Sức chứa phải từ 10 đến 100 người",
        });
      }

      // Validation trạng thái nếu có thay đổi
      if (trangThai) {
        const validStatuses = ["hoat_dong", "bao_tri", "ngung_hoat_dong"];
        if (!validStatuses.includes(trangThai)) {
          return res.status(400).json({
            success: false,
            message: "Trạng thái không hợp lệ",
            validStatuses,
          });
        }
      }

      const updateData = {};
      if (bienSoXe !== undefined) updateData.bienSoXe = bienSoXe;
      if (dongXe !== undefined) updateData.dongXe = dongXe;
      if (sucChua !== undefined) updateData.sucChua = parseInt(sucChua);
      if (trangThai !== undefined) updateData.trangThai = trangThai;

      const isUpdated = await XeBuytModel.update(id, updateData);

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật xe buýt",
        });
      }

      const updatedBus = await XeBuytModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedBus,
        message: "Cập nhật xe buýt thành công",
      });
    } catch (error) {
      console.error("Error in BusController.update:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật xe buýt",
        error: error.message,
      });
    }
  }

  // Xóa xe buýt
  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã xe buýt là bắt buộc",
        });
      }

      // Kiểm tra xe buýt có tồn tại không
      const existingBus = await XeBuytModel.getById(id);
      if (!existingBus) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt",
        });
      }

      // Kiểm tra xe buýt có đang được sử dụng trong lịch trình không
      const schedules = await LichTrinhModel.getByBusId(id);
      if (schedules.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Không thể xóa xe buýt đang được sử dụng trong lịch trình",
          data: { schedulesCount: schedules.length },
        });
      }

      const isDeleted = await XeBuytModel.delete(id);

      if (!isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa xe buýt",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa xe buýt thành công",
      });
    } catch (error) {
      console.error("Error in BusController.delete:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa xe buýt",
        error: error.message,
      });
    }
  }

  // Cập nhật vị trí xe buýt (real-time)
  static async updateLocation(req, res) {
    try {
      const { id } = req.params;
      const { viDo, kinhDo, tocDo, huongDi } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã xe buýt là bắt buộc",
        });
      }

      // Validation dữ liệu bắt buộc
      if (!viDo || !kinhDo) {
        return res.status(400).json({
          success: false,
          message: "Vĩ độ và kinh độ là bắt buộc",
        });
      }

      // Validation tọa độ
      if (viDo < -90 || viDo > 90) {
        return res.status(400).json({
          success: false,
          message: "Vĩ độ phải từ -90 đến 90",
        });
      }

      if (kinhDo < -180 || kinhDo > 180) {
        return res.status(400).json({
          success: false,
          message: "Kinh độ phải từ -180 đến 180",
        });
      }

      // Kiểm tra xe buýt có tồn tại không
      const bus = await XeBuytModel.getById(id);
      if (!bus) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt",
        });
      }

      // Kiểm tra xe buýt có đang hoạt động không
      if (bus.trangThai !== "hoat_dong") {
        return res.status(400).json({
          success: false,
          message: "Xe buýt không đang hoạt động",
        });
      }

      const locationData = {
        viDo: parseFloat(viDo),
        kinhDo: parseFloat(kinhDo),
        tocDo: tocDo ? parseFloat(tocDo) : null,
        huongDi: huongDi ? parseFloat(huongDi) : null,
        thoiGianCapNhat: new Date().toISOString(),
      };

      // Cập nhật vị trí trong database
      await XeBuytModel.updateLocation(id, locationData);

      // Phát sự kiện real-time
      const io = req.app.get("io");
      if (io) {
        io.to(`bus-${id}`).emit("location_update", {
          busId: id,
          location: locationData,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        data: locationData,
        message: "Cập nhật vị trí xe buýt thành công",
      });
    } catch (error) {
      console.error("Error in BusController.updateLocation:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật vị trí xe buýt",
        error: error.message,
      });
    }
  }

  // Cập nhật trạng thái xe buýt
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { trangThai, lyDo } = req.body;

      if (!id || !trangThai) {
        return res.status(400).json({
          success: false,
          message: "Mã xe buýt và trạng thái là bắt buộc",
        });
      }

      // Validation trạng thái
      const validStatuses = ["hoat_dong", "bao_tri", "ngung_hoat_dong"];
      if (!validStatuses.includes(trangThai)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
          validStatuses,
        });
      }

      // Kiểm tra xe buýt có tồn tại không
      const bus = await XeBuytModel.getById(id);
      if (!bus) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt",
        });
      }

      // Cập nhật trạng thái
      const isUpdated = await XeBuytModel.update(id, {
        trangThai,
        lyDoThayDoi: lyDo || null,
      });

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật trạng thái xe buýt",
        });
      }

      // Phát sự kiện real-time
      const io = req.app.get("io");
      if (io) {
        io.to(`bus-${id}`).emit("status_update", {
          busId: id,
          status: trangThai,
          reason: lyDo,
          timestamp: new Date().toISOString(),
        });
      }

      const updatedBus = await XeBuytModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedBus,
        message: "Cập nhật trạng thái xe buýt thành công",
      });
    } catch (error) {
      console.error("Error in BusController.updateStatus:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái xe buýt",
        error: error.message,
      });
    }
  }

  // Lấy lịch trình của xe buýt
  static async getSchedules(req, res) {
    try {
      const { id } = req.params;
      const { trangThai } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã xe buýt là bắt buộc",
        });
      }

      // Kiểm tra xe buýt có tồn tại không
      const bus = await XeBuytModel.getById(id);
      if (!bus) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt",
        });
      }

      let schedules = await LichTrinhModel.getByBusId(id);

      // Lọc theo trạng thái áp dụng
      if (trangThai === "dang_ap_dung") {
        schedules = schedules.filter((schedule) => schedule.dangApDung);
      } else if (trangThai === "khong_ap_dung") {
        schedules = schedules.filter((schedule) => !schedule.dangApDung);
      }

      res.status(200).json({
        success: true,
        data: schedules,
        message: "Lấy lịch trình xe buýt thành công",
      });
    } catch (error) {
      console.error("Error in BusController.getSchedules:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch trình xe buýt",
        error: error.message,
      });
    }
  }

  // Lấy thống kê xe buýt
  static async getStats(req, res) {
    try {
      const allBuses = await XeBuytModel.getAll();

      const stats = {
        total: allBuses.length,
        byStatus: {
          hoat_dong: allBuses.filter((bus) => bus.trangThai === "hoat_dong")
            .length,
          bao_tri: allBuses.filter((bus) => bus.trangThai === "bao_tri").length,
          ngung_hoat_dong: allBuses.filter(
            (bus) => bus.trangThai === "ngung_hoat_dong"
          ).length,
        },
        byCapacity: {
          small: allBuses.filter((bus) => bus.sucChua <= 30).length,
          medium: allBuses.filter(
            (bus) => bus.sucChua > 30 && bus.sucChua <= 50
          ).length,
          large: allBuses.filter((bus) => bus.sucChua > 50).length,
        },
        averageCapacity: 0,
        totalCapacity: 0,
      };

      // Tính tổng và trung bình sức chứa
      stats.totalCapacity = allBuses.reduce((sum, bus) => sum + bus.sucChua, 0);
      stats.averageCapacity =
        allBuses.length > 0
          ? Math.round(stats.totalCapacity / allBuses.length)
          : 0;

      res.status(200).json({
        success: true,
        data: stats,
        message: "Lấy thống kê xe buýt thành công",
      });
    } catch (error) {
      console.error("Error in BusController.getStats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê xe buýt",
        error: error.message,
      });
    }
  }
}

export default BusController;
