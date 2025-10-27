// ScheduleController - Controller chuyên nghiệp cho quản lý lịch trình với real-time features
import LichTrinhModel from "../models/LichTrinhModel.js";
import XeBuytModel from "../models/XeBuytModel.js";
import TaiXeModel from "../models/TaiXeModel.js";
import TuyenDuongModel from "../models/TuyenDuongModel.js";
import ChuyenDiModel from "../models/ChuyenDiModel.js";

class ScheduleController {
  // Lấy danh sách tất cả lịch trình
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        maTuyen,
        maXe,
        maTaiXe,
        loaiChuyen,
        dangApDung,
      } = req.query;
      const offset = (page - 1) * limit;

      let schedules = await LichTrinhModel.getAll();
      let totalCount = schedules.length;

      // Lọc theo tuyến đường
      if (maTuyen) {
        schedules = schedules.filter(
          (schedule) => schedule.maTuyen === maTuyen
        );
        totalCount = schedules.length;
      }

      // Lọc theo xe buýt
      if (maXe) {
        schedules = schedules.filter((schedule) => schedule.maXe === maXe);
        totalCount = schedules.length;
      }

      // Lọc theo tài xế
      if (maTaiXe) {
        schedules = schedules.filter(
          (schedule) => schedule.maTaiXe === maTaiXe
        );
        totalCount = schedules.length;
      }

      // Lọc theo loại chuyến
      if (loaiChuyen) {
        schedules = schedules.filter(
          (schedule) => schedule.loaiChuyen === loaiChuyen
        );
        totalCount = schedules.length;
      }

      // Lọc theo trạng thái áp dụng
      if (dangApDung !== undefined) {
        const isActive = dangApDung === "true";
        schedules = schedules.filter(
          (schedule) => schedule.dangApDung === isActive
        );
        totalCount = schedules.length;
      }

      // Phân trang
      const paginatedSchedules = schedules.slice(
        offset,
        offset + parseInt(limit)
      );

      res.status(200).json({
        success: true,
        data: paginatedSchedules,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
        },
        message: "Lấy danh sách lịch trình thành công",
      });
    } catch (error) {
      console.error("Error in ScheduleController.getAll:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách lịch trình",
        error: error.message,
      });
    }
  }

  // Lấy thông tin chi tiết một lịch trình
  static async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã lịch trình là bắt buộc",
        });
      }

      const schedule = await LichTrinhModel.getById(id);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lịch trình",
        });
      }

      // Lấy thông tin chi tiết xe buýt và tài xế
      const busInfo = await XeBuytModel.getById(schedule.maXe);
      const driverInfo = await TaiXeModel.getById(schedule.maTaiXe);
      const routeInfo = await TuyenDuongModel.getById(schedule.maTuyen);

      // Lấy lịch sử chuyến đi của lịch trình này
      const tripHistory = await ChuyenDiModel.getByScheduleId(id);

      res.status(200).json({
        success: true,
        data: {
          ...schedule,
          busInfo,
          driverInfo,
          routeInfo,
          tripHistory,
        },
        message: "Lấy thông tin lịch trình thành công",
      });
    } catch (error) {
      console.error("Error in ScheduleController.getById:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin lịch trình",
        error: error.message,
      });
    }
  }

  // Tạo lịch trình mới
  static async create(req, res) {
    try {
      const { maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh, dangApDung } =
        req.body;

      // Validation dữ liệu bắt buộc
      if (!maTuyen || !maXe || !maTaiXe || !loaiChuyen || !gioKhoiHanh) {
        return res.status(400).json({
          success: false,
          message:
            "Mã tuyến, mã xe, mã tài xế, loại chuyến và giờ khởi hành là bắt buộc",
        });
      }

      // Kiểm tra tuyến đường có tồn tại không
      const route = await TuyenDuongModel.getById(maTuyen);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tuyến đường",
        });
      }

      // Kiểm tra xe buýt có tồn tại và đang hoạt động không
      const bus = await XeBuytModel.getById(maXe);
      if (!bus) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe buýt",
        });
      }
      if (bus.trangThai !== "hoat_dong") {
        return res.status(400).json({
          success: false,
          message: "Xe buýt không đang hoạt động",
        });
      }

      // Kiểm tra tài xế có tồn tại và đang hoạt động không
      const driver = await TaiXeModel.getById(maTaiXe);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài xế",
        });
      }
      if (driver.trangThai !== "hoat_dong") {
        return res.status(400).json({
          success: false,
          message: "Tài xế không đang hoạt động",
        });
      }

      // Validation loại chuyến
      const validTripTypes = ["di", "ve"];
      if (!validTripTypes.includes(loaiChuyen)) {
        return res.status(400).json({
          success: false,
          message: "Loại chuyến phải là 'di' hoặc 've'",
        });
      }

      // Validation giờ khởi hành
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(gioKhoiHanh)) {
        return res.status(400).json({
          success: false,
          message: "Giờ khởi hành phải có định dạng HH:MM",
        });
      }

      // Kiểm tra xung đột lịch trình (TODO: implement checkConflicts in model)
      // const conflicts = await LichTrinhModel.checkConflicts(
      //   maXe,
      //   maTaiXe,
      //   gioKhoiHanh
      // );
      // if (conflicts.length > 0) {
      //   return res.status(409).json({
      //     success: false,
      //     message: "Xung đột lịch trình với xe buýt hoặc tài xế",
      //     conflicts,
      //   });
      // }

      const scheduleData = {
        maTuyen,
        maXe,
        maTaiXe,
        loaiChuyen,
        gioKhoiHanh,
        dangApDung: dangApDung !== undefined ? dangApDung : true,
      };

      const newScheduleId = await LichTrinhModel.create(scheduleData);
      const newSchedule = await LichTrinhModel.getById(newScheduleId);

      res.status(201).json({
        success: true,
        data: newSchedule,
        message: "Tạo lịch trình mới thành công",
      });
    } catch (error) {
      console.error("Error in ScheduleController.create:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo lịch trình mới",
        error: error.message,
      });
    }
  }

  // Cập nhật lịch trình
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh, dangApDung } =
        req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã lịch trình là bắt buộc",
        });
      }

      // Kiểm tra lịch trình có tồn tại không
      const existingSchedule = await LichTrinhModel.getById(id);
      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lịch trình",
        });
      }

      // Validation các trường nếu có thay đổi
      if (maTuyen) {
        const route = await TuyenDuongModel.getById(maTuyen);
        if (!route) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy tuyến đường",
          });
        }
      }

      if (maXe) {
        const bus = await XeBuytModel.getById(maXe);
        if (!bus) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy xe buýt",
          });
        }
        if (bus.trangThai !== "hoat_dong") {
          return res.status(400).json({
            success: false,
            message: "Xe buýt không đang hoạt động",
          });
        }
      }

      if (maTaiXe) {
        const driver = await TaiXeModel.getById(maTaiXe);
        if (!driver) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy tài xế",
          });
        }
        if (driver.trangThai !== "hoat_dong") {
          return res.status(400).json({
            success: false,
            message: "Tài xế không đang hoạt động",
          });
        }
      }

      if (loaiChuyen) {
        const validTripTypes = ["di", "ve"];
        if (!validTripTypes.includes(loaiChuyen)) {
          return res.status(400).json({
            success: false,
            message: "Loại chuyến phải là 'di' hoặc 've'",
          });
        }
      }

      if (gioKhoiHanh) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(gioKhoiHanh)) {
          return res.status(400).json({
            success: false,
            message: "Giờ khởi hành phải có định dạng HH:MM",
          });
        }
      }

      // Kiểm tra xung đột nếu có thay đổi về xe, tài xế hoặc giờ (TODO: implement checkConflicts)
      // const checkXe = maXe || existingSchedule.maXe;
      // const checkTaiXe = maTaiXe || existingSchedule.maTaiXe;
      // const checkGio = gioKhoiHanh || existingSchedule.gioKhoiHanh;
      //
      // if (maXe || maTaiXe || gioKhoiHanh) {
      //   const conflicts = await LichTrinhModel.checkConflicts(
      //     checkXe,
      //     checkTaiXe,
      //     checkGio,
      //     id
      //   );
      //   if (conflicts.length > 0) {
      //     return res.status(409).json({
      //       success: false,
      //       message: "Xung đột lịch trình với xe buýt hoặc tài xế",
      //       conflicts,
      //     });
      //   }
      // }

      const updateData = {};
      if (maTuyen !== undefined) updateData.maTuyen = maTuyen;
      if (maXe !== undefined) updateData.maXe = maXe;
      if (maTaiXe !== undefined) updateData.maTaiXe = maTaiXe;
      if (loaiChuyen !== undefined) updateData.loaiChuyen = loaiChuyen;
      if (gioKhoiHanh !== undefined) updateData.gioKhoiHanh = gioKhoiHanh;
      if (dangApDung !== undefined) updateData.dangApDung = dangApDung;

      const isUpdated = await LichTrinhModel.update(id, updateData);

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật lịch trình",
        });
      }

      const updatedSchedule = await LichTrinhModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: "Cập nhật lịch trình thành công",
      });
    } catch (error) {
      console.error("Error in ScheduleController.update:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật lịch trình",
        error: error.message,
      });
    }
  }

  // Xóa lịch trình
  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã lịch trình là bắt buộc",
        });
      }

      // Kiểm tra lịch trình có tồn tại không
      const existingSchedule = await LichTrinhModel.getById(id);
      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lịch trình",
        });
      }

      // Kiểm tra lịch trình có đang được sử dụng trong chuyến đi không
      const trips = await ChuyenDiModel.getByScheduleId(id);
      if (trips.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Không thể xóa lịch trình đang được sử dụng trong chuyến đi",
          data: { tripsCount: trips.length },
        });
      }

      const isDeleted = await LichTrinhModel.delete(id);

      if (!isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa lịch trình",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa lịch trình thành công",
      });
    } catch (error) {
      console.error("Error in ScheduleController.delete:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa lịch trình",
        error: error.message,
      });
    }
  }

  // Cập nhật trạng thái lịch trình và phát sự kiện real-time
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { trangThai } = req.body;

      if (!id || !trangThai) {
        return res.status(400).json({
          success: false,
          message: "Mã lịch trình và trạng thái là bắt buộc",
        });
      }

      // Validation trạng thái
      const validStatuses = [
        "chua_khoi_hanh",
        "dang_chay",
        "da_hoan_thanh",
        "bi_huy",
      ];
      if (!validStatuses.includes(trangThai)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
          validStatuses,
        });
      }

      // Kiểm tra lịch trình có tồn tại không
      const schedule = await LichTrinhModel.getById(id);
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lịch trình",
        });
      }

      // Cập nhật trạng thái
      const isUpdated = await LichTrinhModel.update(id, { trangThai });

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật trạng thái lịch trình",
        });
      }

      // Phát sự kiện real-time qua Socket.IO
      const io = req.app.get("io");
      if (io && schedule.maXe) {
        io.to(`bus-${schedule.maXe}`).emit("schedule_status_update", {
          scheduleId: id,
          busId: schedule.maXe,
          driverId: schedule.maTaiXe,
          status: trangThai,
          timestamp: new Date().toISOString(),
        });
      }

      const updatedSchedule = await LichTrinhModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: "Cập nhật trạng thái lịch trình thành công",
      });
    } catch (error) {
      console.error("Error in ScheduleController.updateStatus:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái lịch trình",
        error: error.message,
      });
    }
  }

  // Lấy lịch trình theo ngày
  static async getByDate(req, res) {
    try {
      const { date } = req.params;
      const { maTuyen, loaiChuyen } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Ngày là bắt buộc",
        });
      }

      // Validation định dạng ngày
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: "Ngày phải có định dạng YYYY-MM-DD",
        });
      }

      let schedules = await LichTrinhModel.getByDate(date);

      // Lọc theo tuyến đường
      if (maTuyen) {
        schedules = schedules.filter(
          (schedule) => schedule.maTuyen === maTuyen
        );
      }

      // Lọc theo loại chuyến
      if (loaiChuyen) {
        schedules = schedules.filter(
          (schedule) => schedule.loaiChuyen === loaiChuyen
        );
      }

      res.status(200).json({
        success: true,
        data: schedules,
        message: "Lấy lịch trình theo ngày thành công",
      });
    } catch (error) {
      console.error("Error in ScheduleController.getByDate:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch trình theo ngày",
        error: error.message,
      });
    }
  }

  // Lấy thống kê lịch trình
  static async getStats(req, res) {
    try {
      const allSchedules = await LichTrinhModel.getAll();

      const stats = {
        total: allSchedules.length,
        active: allSchedules.filter((schedule) => schedule.dangApDung).length,
        inactive: allSchedules.filter((schedule) => !schedule.dangApDung)
          .length,
        byTripType: {
          di: allSchedules.filter((schedule) => schedule.loaiChuyen === "di")
            .length,
          ve: allSchedules.filter((schedule) => schedule.loaiChuyen === "ve")
            .length,
        },
        byRoute: {},
        byTimeSlot: {},
      };

      // Thống kê theo tuyến đường
      allSchedules.forEach((schedule) => {
        const routeName = schedule.tenTuyen || "Unknown";
        stats.byRoute[routeName] = (stats.byRoute[routeName] || 0) + 1;
      });

      // Thống kê theo khung giờ
      allSchedules.forEach((schedule) => {
        const hour = parseInt(schedule.gioKhoiHanh.split(":")[0]);
        let timeSlot;
        if (hour >= 6 && hour < 12) timeSlot = "Sáng (6h-12h)";
        else if (hour >= 12 && hour < 18) timeSlot = "Chiều (12h-18h)";
        else if (hour >= 18 && hour < 22) timeSlot = "Tối (18h-22h)";
        else timeSlot = "Đêm (22h-6h)";

        stats.byTimeSlot[timeSlot] = (stats.byTimeSlot[timeSlot] || 0) + 1;
      });

      res.status(200).json({
        success: true,
        data: stats,
        message: "Lấy thống kê lịch trình thành công",
      });
    } catch (error) {
      console.error("Error in ScheduleController.getStats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê lịch trình",
        error: error.message,
      });
    }
  }
}

export default ScheduleController;
