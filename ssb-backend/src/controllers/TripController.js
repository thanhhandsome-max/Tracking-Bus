// TripController - Controller chuyên nghiệp cho xử lý vận hành chuyến đi
import ChuyenDiModel from "../models/ChuyenDiModel.js";
import LichTrinhModel from "../models/LichTrinhModel.js";
import TrangThaiHocSinhModel from "../models/TrangThaiHocSinhModel.js";
import XeBuytModel from "../models/XeBuytModel.js";
import TaiXeModel from "../models/TaiXeModel.js";
import TuyenDuongModel from "../models/TuyenDuongModel.js";
import HocSinhModel from "../models/HocSinhModel.js";

class TripController {
  // Lấy danh sách tất cả chuyến đi
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        ngayChay,
        trangThai,
        maTuyen,
        maXe,
        maTaiXe,
      } = req.query;
      const offset = (page - 1) * limit;

      let trips = await ChuyenDiModel.getAll();
      let totalCount = trips.length;

      // Lọc theo ngày chạy
      if (ngayChay) {
        trips = trips.filter((trip) => trip.ngayChay === ngayChay);
        totalCount = trips.length;
      }

      // Lọc theo trạng thái
      if (trangThai) {
        trips = trips.filter((trip) => trip.trangThai === trangThai);
        totalCount = trips.length;
      }

      // Lọc theo tuyến đường
      if (maTuyen) {
        trips = trips.filter((trip) => trip.maTuyen === maTuyen);
        totalCount = trips.length;
      }

      // Lọc theo xe buýt
      if (maXe) {
        trips = trips.filter((trip) => trip.maXe === maXe);
        totalCount = trips.length;
      }

      // Lọc theo tài xế
      if (maTaiXe) {
        trips = trips.filter((trip) => trip.maTaiXe === maTaiXe);
        totalCount = trips.length;
      }

      // Phân trang
      const paginatedTrips = trips.slice(offset, offset + parseInt(limit));

      res.status(200).json({
        success: true,
        data: paginatedTrips,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
        },
        message: "Lấy danh sách chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.getAll:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách chuyến đi",
        error: error.message,
      });
    }
  }

  // Lấy thông tin chi tiết một chuyến đi
  static async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
        });
      }

      const trip = await ChuyenDiModel.getById(id);

      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chuyến đi",
        });
      }

      // Lấy thông tin chi tiết lịch trình
      const schedule = await LichTrinhModel.getById(trip.maLichTrinh);

      // Lấy thông tin xe buýt và tài xế
      const busInfo = await XeBuytModel.getById(schedule.maXe);
      const driverInfo = await TaiXeModel.getById(schedule.maTaiXe);
      const routeInfo = await TuyenDuongModel.getById(schedule.maTuyen);

      // Lấy danh sách học sinh trong chuyến đi
      const students = await TrangThaiHocSinhModel.getByTripId(id);

      res.status(200).json({
        success: true,
        data: {
          ...trip,
          schedule,
          busInfo,
          driverInfo,
          routeInfo,
          students,
        },
        message: "Lấy thông tin chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.getById:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin chuyến đi",
        error: error.message,
      });
    }
  }

  // Tạo chuyến đi mới
  static async create(req, res) {
    try {
      const {
        maLichTrinh,
        ngayChay,
        trangThai = "chua_khoi_hanh",
        gioBatDauThucTe = null,
        gioKetThucThucTe = null,
        ghiChu = null,
      } = req.body;

      // Validation dữ liệu bắt buộc
      if (!maLichTrinh || !ngayChay) {
        return res.status(400).json({
          success: false,
          message: "Mã lịch trình và ngày chạy là bắt buộc",
        });
      }

      // Validation ngày chạy
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(ngayChay)) {
        return res.status(400).json({
          success: false,
          message: "Ngày chạy phải có định dạng YYYY-MM-DD",
        });
      }

      // Kiểm tra lịch trình có tồn tại không
      const schedule = await LichTrinhModel.getById(maLichTrinh);
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lịch trình",
        });
      }

      // Kiểm tra lịch trình có đang áp dụng không
      if (!schedule.dangApDung) {
        return res.status(400).json({
          success: false,
          message: "Lịch trình không đang được áp dụng",
        });
      }

      // Kiểm tra xe buýt có đang hoạt động không
      const bus = await XeBuytModel.getById(schedule.maXe);
      if (!bus || bus.trangThai !== "hoat_dong") {
        return res.status(400).json({
          success: false,
          message: "Xe buýt không đang hoạt động",
        });
      }

      // Kiểm tra tài xế có đang hoạt động không
      const driver = await TaiXeModel.getById(schedule.maTaiXe);
      if (!driver || driver.trangThai !== "hoat_dong") {
        return res.status(400).json({
          success: false,
          message: "Tài xế không đang hoạt động",
        });
      }

      // Kiểm tra chuyến đi đã tồn tại chưa
      const existingTrip = await ChuyenDiModel.getByScheduleAndDate(
        maLichTrinh,
        ngayChay
      );
      if (existingTrip) {
        return res.status(409).json({
          success: false,
          message: "Chuyến đi đã tồn tại cho lịch trình này trong ngày",
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

      const tripData = {
        maLichTrinh,
        ngayChay,
        trangThai,
        gioBatDauThucTe,
        gioKetThucThucTe,
        ghiChu,
      };

      const newTripId = await ChuyenDiModel.create(tripData);
      const newTrip = await ChuyenDiModel.getById(newTripId);

      res.status(201).json({
        success: true,
        data: newTrip,
        message: "Tạo chuyến đi mới thành công",
      });
    } catch (error) {
      console.error("Error in TripController.create:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo chuyến đi mới",
        error: error.message,
      });
    }
  }

  // Cập nhật chuyến đi
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        maLichTrinh,
        ngayChay,
        trangThai,
        gioBatDauThucTe,
        gioKetThucThucTe,
        ghiChu,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
        });
      }

      // Kiểm tra chuyến đi có tồn tại không
      const existingTrip = await ChuyenDiModel.getById(id);
      if (!existingTrip) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chuyến đi",
        });
      }

      // Validation ngày chạy nếu có thay đổi
      if (ngayChay) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(ngayChay)) {
          return res.status(400).json({
            success: false,
            message: "Ngày chạy phải có định dạng YYYY-MM-DD",
          });
        }
      }

      // Validation trạng thái nếu có thay đổi
      if (trangThai) {
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
      }

      // Kiểm tra lịch trình nếu có thay đổi
      if (maLichTrinh && maLichTrinh !== existingTrip.maLichTrinh) {
        const schedule = await LichTrinhModel.getById(maLichTrinh);
        if (!schedule) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy lịch trình",
          });
        }
      }

      // Kiểm tra chuyến đi trùng lặp nếu có thay đổi lịch trình hoặc ngày
      const checkSchedule = maLichTrinh || existingTrip.maLichTrinh;
      const checkDate = ngayChay || existingTrip.ngayChay;

      if (maLichTrinh || ngayChay) {
        const duplicateTrip = await ChuyenDiModel.getByScheduleAndDate(
          checkSchedule,
          checkDate
        );
        if (duplicateTrip && duplicateTrip.maChuyen !== id) {
          return res.status(409).json({
            success: false,
            message: "Chuyến đi đã tồn tại cho lịch trình này trong ngày",
          });
        }
      }

      const updateData = {};
      if (maLichTrinh !== undefined) updateData.maLichTrinh = maLichTrinh;
      if (ngayChay !== undefined) updateData.ngayChay = ngayChay;
      if (trangThai !== undefined) updateData.trangThai = trangThai;
      if (gioBatDauThucTe !== undefined)
        updateData.gioBatDauThucTe = gioBatDauThucTe;
      if (gioKetThucThucTe !== undefined)
        updateData.gioKetThucThucTe = gioKetThucThucTe;
      if (ghiChu !== undefined) updateData.ghiChu = ghiChu;

      const isUpdated = await ChuyenDiModel.update(id, updateData);

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật chuyến đi",
        });
      }

      const updatedTrip = await ChuyenDiModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedTrip,
        message: "Cập nhật chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.update:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật chuyến đi",
        error: error.message,
      });
    }
  }

  // Xóa chuyến đi
  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
        });
      }

      // Kiểm tra chuyến đi có tồn tại không
      const existingTrip = await ChuyenDiModel.getById(id);
      if (!existingTrip) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chuyến đi",
        });
      }

      // Kiểm tra chuyến đi có đang chạy không
      if (existingTrip.trangThai === "dang_chay") {
        return res.status(409).json({
          success: false,
          message: "Không thể xóa chuyến đi đang chạy",
        });
      }

      // Kiểm tra có học sinh nào đang trong chuyến đi không
      const studentsInTrip = await TrangThaiHocSinhModel.getByTripId(id);
      if (studentsInTrip.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Không thể xóa chuyến đi có học sinh tham gia",
          data: { studentsCount: studentsInTrip.length },
        });
      }

      const isDeleted = await ChuyenDiModel.delete(id);

      if (!isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa chuyến đi",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.delete:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa chuyến đi",
        error: error.message,
      });
    }
  }

  // Bắt đầu chuyến đi
  static async startTrip(req, res) {
    try {
      const { id } = req.params;
      const { gioBatDauThucTe } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
        });
      }

      // Kiểm tra chuyến đi có tồn tại không
      const trip = await ChuyenDiModel.getById(id);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chuyến đi",
        });
      }

      // Kiểm tra trạng thái hiện tại
      if (trip.trangThai !== "chua_khoi_hanh") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể bắt đầu chuyến đi chưa khởi hành",
        });
      }

      const startTime =
        gioBatDauThucTe || new Date().toISOString().slice(11, 16);

      // Cập nhật trạng thái và giờ bắt đầu
      const isUpdated = await ChuyenDiModel.update(id, {
        trangThai: "dang_chay",
        gioBatDauThucTe: startTime,
      });

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể bắt đầu chuyến đi",
        });
      }

      // Phát sự kiện real-time
      const io = req.app.get("io");
      if (io) {
        const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
        if (schedule) {
          io.to(`bus-${schedule.maXe}`).emit("trip_started", {
            tripId: id,
            busId: schedule.maXe,
            driverId: schedule.maTaiXe,
            startTime,
            timestamp: new Date().toISOString(),
          });
        }
      }

      const updatedTrip = await ChuyenDiModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedTrip,
        message: "Bắt đầu chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.startTrip:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi bắt đầu chuyến đi",
        error: error.message,
      });
    }
  }

  // Kết thúc chuyến đi
  static async endTrip(req, res) {
    try {
      const { id } = req.params;
      const { gioKetThucThucTe, ghiChu } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
        });
      }

      // Kiểm tra chuyến đi có tồn tại không
      const trip = await ChuyenDiModel.getById(id);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chuyến đi",
        });
      }

      // Kiểm tra trạng thái hiện tại
      if (trip.trangThai !== "dang_chay") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể kết thúc chuyến đi đang chạy",
        });
      }

      const endTime =
        gioKetThucThucTe || new Date().toISOString().slice(11, 16);

      // Cập nhật trạng thái và giờ kết thúc
      const isUpdated = await ChuyenDiModel.update(id, {
        trangThai: "da_hoan_thanh",
        gioKetThucThucTe: endTime,
        ghiChu: ghiChu || trip.ghiChu,
      });

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể kết thúc chuyến đi",
        });
      }

      // Phát sự kiện real-time
      const io = req.app.get("io");
      if (io) {
        const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
        if (schedule) {
          io.to(`bus-${schedule.maXe}`).emit("trip_completed", {
            tripId: id,
            busId: schedule.maXe,
            driverId: schedule.maTaiXe,
            endTime,
            timestamp: new Date().toISOString(),
          });
        }
      }

      const updatedTrip = await ChuyenDiModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedTrip,
        message: "Kết thúc chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.endTrip:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi kết thúc chuyến đi",
        error: error.message,
      });
    }
  }

  // Hủy chuyến đi
  static async cancelTrip(req, res) {
    try {
      const { id } = req.params;
      const { lyDoHuy } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi là bắt buộc",
        });
      }

      // Kiểm tra chuyến đi có tồn tại không
      const trip = await ChuyenDiModel.getById(id);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chuyến đi",
        });
      }

      // Kiểm tra trạng thái hiện tại
      if (trip.trangThai === "da_hoan_thanh") {
        return res.status(400).json({
          success: false,
          message: "Không thể hủy chuyến đi đã hoàn thành",
        });
      }

      // Cập nhật trạng thái
      const isUpdated = await ChuyenDiModel.update(id, {
        trangThai: "bi_huy",
        ghiChu: lyDoHuy || trip.ghiChu,
      });

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể hủy chuyến đi",
        });
      }

      // Phát sự kiện real-time
      const io = req.app.get("io");
      if (io) {
        const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
        if (schedule) {
          io.to(`bus-${schedule.maXe}`).emit("trip_cancelled", {
            tripId: id,
            busId: schedule.maXe,
            driverId: schedule.maTaiXe,
            reason: lyDoHuy,
            timestamp: new Date().toISOString(),
          });
        }
      }

      const updatedTrip = await ChuyenDiModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedTrip,
        message: "Hủy chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.cancelTrip:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi hủy chuyến đi",
        error: error.message,
      });
    }
  }

  // Thêm học sinh vào chuyến đi
  static async addStudent(req, res) {
    try {
      const { id } = req.params;
      const { maHocSinh, trangThai = "dang_cho", ghiChu } = req.body;

      if (!id || !maHocSinh) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi và mã học sinh là bắt buộc",
        });
      }

      // Kiểm tra chuyến đi có tồn tại không
      const trip = await ChuyenDiModel.getById(id);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chuyến đi",
        });
      }

      // Kiểm tra học sinh có tồn tại không
      const student = await HocSinhModel.getById(maHocSinh);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học sinh",
        });
      }

      // Kiểm tra học sinh đã trong chuyến đi chưa
      const existingStatus = await TrangThaiHocSinhModel.getByTripAndStudent(
        id,
        maHocSinh
      );
      if (existingStatus) {
        return res.status(409).json({
          success: false,
          message: "Học sinh đã có trong chuyến đi này",
        });
      }

      // Kiểm tra học sinh có đang trong chuyến đi khác không
      const activeTrip = await TrangThaiHocSinhModel.getActiveByStudentId(
        maHocSinh
      );
      if (activeTrip.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Học sinh đang trong chuyến đi khác",
          data: { activeTripId: activeTrip[0].maChuyen },
        });
      }

      const statusData = {
        maChuyen: id,
        maHocSinh,
        trangThai,
        thoiGianCapNhat: new Date().toISOString(),
        ghiChu: ghiChu || null,
      };

      const newStatusId = await TrangThaiHocSinhModel.create(statusData);
      const newStatus = await TrangThaiHocSinhModel.getById(newStatusId);

      res.status(201).json({
        success: true,
        data: newStatus,
        message: "Thêm học sinh vào chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.addStudent:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thêm học sinh vào chuyến đi",
        error: error.message,
      });
    }
  }

  // Cập nhật trạng thái học sinh trong chuyến đi
  static async updateStudentStatus(req, res) {
    try {
      const { id, studentId } = req.params;
      const { trangThai, ghiChu } = req.body;

      if (!id || !studentId) {
        return res.status(400).json({
          success: false,
          message: "Mã chuyến đi và mã học sinh là bắt buộc",
        });
      }

      if (!trangThai) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái là bắt buộc",
        });
      }

      // Validation trạng thái
      const validStatuses = [
        "dang_cho",
        "da_len_xe",
        "da_xuong_xe",
        "vang_mat",
      ];
      if (!validStatuses.includes(trangThai)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
          validStatuses,
        });
      }

      // Kiểm tra trạng thái học sinh có tồn tại không
      const existingStatus = await TrangThaiHocSinhModel.getByTripAndStudent(
        id,
        studentId
      );
      if (!existingStatus) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học sinh trong chuyến đi này",
        });
      }

      // Cập nhật trạng thái
      const isUpdated = await TrangThaiHocSinhModel.update(
        existingStatus.maTrangThai,
        {
          trangThai,
          thoiGianCapNhat: new Date().toISOString(),
          ghiChu: ghiChu || existingStatus.ghiChu,
        }
      );

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật trạng thái học sinh",
        });
      }

      const updatedStatus = await TrangThaiHocSinhModel.getById(
        existingStatus.maTrangThai
      );

      res.status(200).json({
        success: true,
        data: updatedStatus,
        message: "Cập nhật trạng thái học sinh thành công",
      });
    } catch (error) {
      console.error("Error in TripController.updateStudentStatus:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái học sinh",
        error: error.message,
      });
    }
  }

  // Lấy thống kê chuyến đi
  static async getStats(req, res) {
    try {
      const { ngayBatDau, ngayKetThuc } = req.query;

      let trips = await ChuyenDiModel.getAll();

      // Lọc theo khoảng thời gian
      if (ngayBatDau && ngayKetThuc) {
        trips = trips.filter((trip) => {
          const tripDate = new Date(trip.ngayChay);
          const startDate = new Date(ngayBatDau);
          const endDate = new Date(ngayKetThuc);
          return tripDate >= startDate && tripDate <= endDate;
        });
      }

      const stats = {
        total: trips.length,
        byStatus: {
          chua_khoi_hanh: trips.filter(
            (trip) => trip.trangThai === "chua_khoi_hanh"
          ).length,
          dang_chay: trips.filter((trip) => trip.trangThai === "dang_chay")
            .length,
          da_hoan_thanh: trips.filter(
            (trip) => trip.trangThai === "da_hoan_thanh"
          ).length,
          bi_huy: trips.filter((trip) => trip.trangThai === "bi_huy").length,
        },
        byRoute: {},
        byBus: {},
        byDriver: {},
        completionRate: 0,
        averageDuration: 0,
      };

      // Tính tỷ lệ hoàn thành
      const completedTrips = stats.byStatus.da_hoan_thanh;
      stats.completionRate =
        trips.length > 0
          ? Math.round((completedTrips / trips.length) * 100)
          : 0;

      // Thống kê theo tuyến đường, xe buýt, tài xế
      for (const trip of trips) {
        const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
        if (schedule) {
          // Theo tuyến đường
          const routeName = schedule.tenTuyen || "Unknown";
          stats.byRoute[routeName] = (stats.byRoute[routeName] || 0) + 1;

          // Theo xe buýt
          const busPlate = schedule.bienSoXe || "Unknown";
          stats.byBus[busPlate] = (stats.byBus[busPlate] || 0) + 1;

          // Theo tài xế
          const driverName = schedule.tenTaiXe || "Unknown";
          stats.byDriver[driverName] = (stats.byDriver[driverName] || 0) + 1;
        }
      }

      // Tính thời gian trung bình
      const tripsWithDuration = trips.filter(
        (trip) => trip.gioBatDauThucTe && trip.gioKetThucThucTe
      );

      if (tripsWithDuration.length > 0) {
        const totalMinutes = tripsWithDuration.reduce((sum, trip) => {
          const start = new Date(`2000-01-01T${trip.gioBatDauThucTe}`);
          const end = new Date(`2000-01-01T${trip.gioKetThucThucTe}`);
          return sum + (end - start) / (1000 * 60);
        }, 0);
        stats.averageDuration = Math.round(
          totalMinutes / tripsWithDuration.length
        );
      }

      res.status(200).json({
        success: true,
        data: stats,
        message: "Lấy thống kê chuyến đi thành công",
      });
    } catch (error) {
      console.error("Error in TripController.getStats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê chuyến đi",
        error: error.message,
      });
    }
  }
}

export default TripController;
