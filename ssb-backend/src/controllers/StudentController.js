// StudentController - Controller chuyên nghiệp cho quản lý học sinh
import StudentService from "../services/StudentService.js";
import HocSinhModel from "../models/HocSinhModel.js";
import NguoiDungModel from "../models/NguoiDungModel.js";
import * as response from "../utils/response.js";

class StudentController {
  // Lấy danh sách tất cả học sinh
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        pageSize,
        limit,
        q, // search query
        lop,
        sortBy = "maHocSinh",
        sortOrder = "desc",
      } = req.query;

      // Normalize query params - accept both pageSize and limit
      const pageNum = Math.max(1, parseInt(page) || 1);
      const pageSizeValue = pageSize || limit || 10;
      const limitValue = Math.max(1, Math.min(200, parseInt(pageSizeValue) || 10));
      const search = q || req.query.search;
      const sortDir = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

      // Use service if available
      let result;
      if (StudentService && StudentService.list) {
        result = await StudentService.list({
          page: pageNum,
          limit: limitValue,
          search,
          lop,
          sortBy,
          sortDir,
        });
      } else {
        // Fallback to direct model access
        let students = await HocSinhModel.getWithParentInfo();
        let totalCount = students.length;

        if (search) {
          students = students.filter(
            (s) =>
              s.hoTen?.toLowerCase().includes(search.toLowerCase()) ||
              s.maHocSinh?.toString().includes(search.toLowerCase())
          );
          totalCount = students.length;
        }

        if (lop) {
          students = students.filter((s) => s.lop === lop);
          totalCount = students.length;
        }

        const offset = (pageNum - 1) * limitValue;
        const paginatedStudents = students.slice(offset, offset + limitValue);

        result = {
          data: paginatedStudents,
          pagination: {
            page: pageNum,
            limit: limitValue,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limitValue),
          },
        };
      }

      return response.ok(res, result.data, {
        page: pageNum,
        pageSize: limitValue,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        sortBy,
        sortOrder: sortOrder.toLowerCase(),
        q: search || null,
      });
    } catch (error) {
      console.error("Error in StudentController.getAll:", error);
      return response.serverError(res, "Lỗi server khi lấy danh sách học sinh", error);
    }
  }

  // Lấy thông tin chi tiết một học sinh
  static async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.validationError(res, "Mã học sinh là bắt buộc", [
          { field: "id", message: "Mã học sinh không được để trống" }
        ]);
      }

      const student = await (StudentService && StudentService.getById 
        ? StudentService.getById(id)
        : HocSinhModel.getById(id));

      if (!student) {
        return response.notFound(res, "Không tìm thấy học sinh");
      }

      // Lấy thông tin phụ huynh nếu có
      let parentInfo = null;
      if (student.maPhuHuynh) {
        parentInfo = await NguoiDungModel.getById(student.maPhuHuynh);
      }

      return response.ok(res, {
        ...student,
        parentInfo,
      });
    } catch (error) {
      console.error("Error in StudentController.getById:", error);
      return response.serverError(res, "Lỗi server khi lấy thông tin học sinh", error);
    }
  }

  // Tạo học sinh mới
  static async create(req, res) {
    try {
      const { hoTen, ngaySinh, lop, maPhuHuynh, diaChi, anhDaiDien } = req.body;

      // Validation dữ liệu bắt buộc
      if (!hoTen || !ngaySinh || !lop) {
        return res.status(400).json({
          success: false,
          message: "Họ tên, ngày sinh và lớp là bắt buộc",
        });
      }

      // Validation ngày sinh
      const birthDate = new Date(ngaySinh);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 3 || age > 18) {
        return res.status(400).json({
          success: false,
          message: "Tuổi học sinh phải từ 3 đến 18 tuổi",
        });
      }

      // Kiểm tra phụ huynh có tồn tại không (nếu có)
      if (maPhuHuynh) {
        const parent = await NguoiDungModel.getById(maPhuHuynh);
        if (!parent) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy phụ huynh",
          });
        }
      }

      const studentData = {
        hoTen,
        ngaySinh,
        lop,
        maPhuHuynh: maPhuHuynh || null,
        diaChi: diaChi || null,
        anhDaiDien: anhDaiDien || null,
      };

      const studentId = await HocSinhModel.create(studentData);
      const newStudent = await HocSinhModel.getById(studentId);

      res.status(201).json({
        success: true,
        data: newStudent,
        message: "Tạo học sinh mới thành công",
      });
    } catch (error) {
      console.error("Error in StudentController.create:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo học sinh mới",
        error: error.message,
      });
    }
  }

  // Cập nhật thông tin học sinh
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { hoTen, ngaySinh, lop, maPhuHuynh, diaChi, anhDaiDien } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã học sinh là bắt buộc",
        });
      }

      // Kiểm tra học sinh có tồn tại không
      const existingStudent = await HocSinhModel.getById(id);
      if (!existingStudent) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học sinh",
        });
      }

      // Validation ngày sinh nếu có thay đổi
      if (ngaySinh) {
        const birthDate = new Date(ngaySinh);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 3 || age > 18) {
          return res.status(400).json({
            success: false,
            message: "Tuổi học sinh phải từ 3 đến 18 tuổi",
          });
        }
      }

      // Kiểm tra phụ huynh có tồn tại không (nếu có thay đổi)
      if (maPhuHuynh) {
        const parent = await NguoiDungModel.getById(maPhuHuynh);
        if (!parent) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy phụ huynh",
          });
        }
      }

      const updateData = {};
      if (hoTen !== undefined) updateData.hoTen = hoTen;
      if (ngaySinh !== undefined) updateData.ngaySinh = ngaySinh;
      if (lop !== undefined) updateData.lop = lop;
      if (maPhuHuynh !== undefined) updateData.maPhuHuynh = maPhuHuynh;
      if (diaChi !== undefined) updateData.diaChi = diaChi;
      if (anhDaiDien !== undefined) updateData.anhDaiDien = anhDaiDien;

      const isUpdated = await HocSinhModel.update(id, updateData);

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật học sinh",
        });
      }

      const updatedStudent = await HocSinhModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedStudent,
        message: "Cập nhật thông tin học sinh thành công",
      });
    } catch (error) {
      console.error("Error in StudentController.update:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật học sinh",
        error: error.message,
      });
    }
  }

  // Xóa học sinh
  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã học sinh là bắt buộc",
        });
      }

      // Kiểm tra học sinh có tồn tại không
      const existingStudent = await HocSinhModel.getById(id);
      if (!existingStudent) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học sinh",
        });
      }

      const isDeleted = await HocSinhModel.delete(id);

      if (!isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa học sinh",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa học sinh thành công",
      });
    } catch (error) {
      console.error("Error in StudentController.delete:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa học sinh",
        error: error.message,
      });
    }
  }

  // GET /api/v1/students/by-parent - Lấy học sinh của phụ huynh hiện tại
  static async getByCurrentParent(req, res) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Chưa đăng nhập",
        });
      }

      const students = await HocSinhModel.getByParent(userId);

      // Lấy thêm thông tin tài xế và tuyến đường từ chuyến đi gần nhất
      const ChuyenDiModel = (await import("../models/ChuyenDiModel.js")).default;
      const LichTrinhModel = (await import("../models/LichTrinhModel.js")).default;

      const studentsWithTripInfo = await Promise.all(
        students.map(async (student) => {
          // Lấy chuyến đi gần nhất của học sinh này (nếu có)
          const today = new Date().toISOString().slice(0, 10);
          const recentTrips = await ChuyenDiModel.getAll({
            ngayChay: today,
          });

          // Tìm trip có học sinh này
          let tripInfo = null;
          for (const trip of recentTrips) {
            const tripStudents = await ChuyenDiModel.getStudents(trip.maChuyen);
            const hasStudent = tripStudents.some((ts) => ts.maHocSinh === student.maHocSinh);
            if (hasStudent) {
              const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
              tripInfo = {
                maChuyen: trip.maChuyen,
                tenTuyen: trip.tenTuyen,
                bienSoXe: trip.bienSoXe,
                trangThai: trip.trangThai,
                gioKhoiHanh: schedule?.gioKhoiHanh || trip.gioKhoiHanh,
              };
              break;
            }
          }

          return {
            ...student,
            tripInfo,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: studentsWithTripInfo,
        message: "Lấy danh sách học sinh thành công",
      });
    } catch (error) {
      console.error("Error in StudentController.getByCurrentParent:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách học sinh",
        error: error.message,
      });
    }
  }

  // Lấy danh sách học sinh theo lớp
  static async getByClass(req, res) {
    try {
      const { lop } = req.params;

      if (!lop) {
        return res.status(400).json({
          success: false,
          message: "Lớp là bắt buộc",
        });
      }

      const allStudents = await HocSinhModel.getWithParentInfo();
      const students = allStudents.filter((student) => student.lop === lop);

      res.status(200).json({
        success: true,
        data: students,
        message: "Lấy danh sách học sinh theo lớp thành công",
      });
    } catch (error) {
      console.error("Error in StudentController.getByClass:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách học sinh theo lớp",
        error: error.message,
      });
    }
  }

  // Lấy thống kê học sinh
  static async getStats(req, res) {
    try {
      const allStudents = await HocSinhModel.getWithParentInfo();

      const stats = {
        total: allStudents.length,
        byClass: {},
        byGrade: {},
        averageAge: 0,
        withParent: 0,
        withoutParent: 0,
      };

      // Thống kê theo lớp
      allStudents.forEach((student) => {
        const className = student.lop || "Unknown";
        stats.byClass[className] = (stats.byClass[className] || 0) + 1;
      });

      // Thống kê theo khối (từ lớp)
      allStudents.forEach((student) => {
        const grade = student.lop ? student.lop.charAt(0) : "Unknown";
        stats.byGrade[grade] = (stats.byGrade[grade] || 0) + 1;
      });

      // Thống kê có phụ huynh
      stats.withParent = allStudents.filter(
        (student) => student.maPhuHuynh
      ).length;
      stats.withoutParent = allStudents.length - stats.withParent;

      // Tính tuổi trung bình
      const today = new Date();
      const totalAge = allStudents.reduce((sum, student) => {
        if (student.ngaySinh) {
          const birthDate = new Date(student.ngaySinh);
          const age = today.getFullYear() - birthDate.getFullYear();
          return sum + age;
        }
        return sum;
      }, 0);
      stats.averageAge =
        allStudents.length > 0 ? Math.round(totalAge / allStudents.length) : 0;

      res.status(200).json({
        success: true,
        data: stats,
        message: "Lấy thống kê học sinh thành công",
      });
    } catch (error) {
      console.error("Error in StudentController.getStats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê học sinh",
        error: error.message,
      });
    }
  }
}

export default StudentController;
