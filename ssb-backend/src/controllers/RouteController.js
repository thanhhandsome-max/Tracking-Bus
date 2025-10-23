// RouteController - Controller chuyên nghiệp cho quản lý tuyến đường và điểm dừng
import TuyenDuongModel from "../models/TuyenDuongModel.js";
import DiemDungModel from "../models/DiemDungModel.js";
import LichTrinhModel from "../models/LichTrinhModel.js";

class RouteController {
  // Lấy danh sách tất cả tuyến đường
  static async getAllRoutes(req, res) {
    try {
      const { page = 1, limit = 10, search, trangThai } = req.query;
      const offset = (page - 1) * limit;

      let routes = await TuyenDuongModel.getAll();
      let totalCount = routes.length;

      // Tìm kiếm theo tên tuyến
      if (search) {
        routes = routes.filter(
          (route) =>
            route.tenTuyen.toLowerCase().includes(search.toLowerCase()) ||
            route.moTa?.toLowerCase().includes(search.toLowerCase())
        );
        totalCount = routes.length;
      }

      // Lọc theo trạng thái
      if (trangThai) {
        routes = routes.filter((route) => route.trangThai === trangThai);
        totalCount = routes.length;
      }

      // Phân trang
      const paginatedRoutes = routes.slice(offset, offset + parseInt(limit));

      res.status(200).json({
        success: true,
        data: paginatedRoutes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
        },
        message: "Lấy danh sách tuyến đường thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.getAllRoutes:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách tuyến đường",
        error: error.message,
      });
    }
  }

  // Lấy thông tin chi tiết một tuyến đường
  static async getRouteById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã tuyến đường là bắt buộc",
        });
      }

      const route = await TuyenDuongModel.getById(id);

      if (!route) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tuyến đường",
        });
      }

      // Lấy danh sách điểm dừng của tuyến đường
      const stops = await DiemDungModel.getByRouteId(id);

      // Lấy lịch trình của tuyến đường
      const schedules = await LichTrinhModel.getByRouteId(id);

      res.status(200).json({
        success: true,
        data: {
          ...route,
          stops,
          schedules,
        },
        message: "Lấy thông tin tuyến đường thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.getRouteById:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin tuyến đường",
        error: error.message,
      });
    }
  }

  // Tạo tuyến đường mới
  static async createRoute(req, res) {
    try {
      const {
        tenTuyen,
        moTa,
        diemBatDau,
        diemKetThuc,
        khoangCach,
        thoiGianDuKien,
        trangThai,
      } = req.body;

      // Validation dữ liệu bắt buộc
      if (!tenTuyen || !diemBatDau || !diemKetThuc) {
        return res.status(400).json({
          success: false,
          message: "Tên tuyến, điểm bắt đầu và điểm kết thúc là bắt buộc",
        });
      }

      // Kiểm tra tên tuyến đã tồn tại chưa
      const existingRoute = await TuyenDuongModel.getByName(tenTuyen);
      if (existingRoute) {
        return res.status(409).json({
          success: false,
          message: "Tên tuyến đường đã tồn tại trong hệ thống",
        });
      }

      // Validation khoảng cách
      if (khoangCach && (khoangCach < 0 || khoangCach > 1000)) {
        return res.status(400).json({
          success: false,
          message: "Khoảng cách phải từ 0 đến 1000 km",
        });
      }

      // Validation thời gian dự kiến
      if (thoiGianDuKien && (thoiGianDuKien < 0 || thoiGianDuKien > 480)) {
        return res.status(400).json({
          success: false,
          message: "Thời gian dự kiến phải từ 0 đến 480 phút",
        });
      }

      const routeData = {
        tenTuyen,
        moTa: moTa || null,
        diemBatDau,
        diemKetThuc,
        khoangCach: khoangCach ? parseFloat(khoangCach) : null,
        thoiGianDuKien: thoiGianDuKien ? parseInt(thoiGianDuKien) : null,
        trangThai: trangThai || "hoat_dong",
      };

      const newRouteId = await TuyenDuongModel.create(routeData);
      const newRoute = await TuyenDuongModel.getById(newRouteId);

      res.status(201).json({
        success: true,
        data: newRoute,
        message: "Tạo tuyến đường mới thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.createRoute:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo tuyến đường mới",
        error: error.message,
      });
    }
  }

  // Cập nhật tuyến đường
  static async updateRoute(req, res) {
    try {
      const { id } = req.params;
      const {
        tenTuyen,
        moTa,
        diemBatDau,
        diemKetThuc,
        khoangCach,
        thoiGianDuKien,
        trangThai,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã tuyến đường là bắt buộc",
        });
      }

      // Kiểm tra tuyến đường có tồn tại không
      const existingRoute = await TuyenDuongModel.getById(id);
      if (!existingRoute) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tuyến đường",
        });
      }

      // Kiểm tra tên tuyến trùng lặp (nếu có thay đổi)
      if (tenTuyen && tenTuyen !== existingRoute.tenTuyen) {
        const duplicateRoute = await TuyenDuongModel.getByName(tenTuyen);
        if (duplicateRoute) {
          return res.status(409).json({
            success: false,
            message: "Tên tuyến đường đã tồn tại trong hệ thống",
          });
        }
      }

      // Validation khoảng cách
      if (khoangCach !== undefined && (khoangCach < 0 || khoangCach > 1000)) {
        return res.status(400).json({
          success: false,
          message: "Khoảng cách phải từ 0 đến 1000 km",
        });
      }

      // Validation thời gian dự kiến
      if (
        thoiGianDuKien !== undefined &&
        (thoiGianDuKien < 0 || thoiGianDuKien > 480)
      ) {
        return res.status(400).json({
          success: false,
          message: "Thời gian dự kiến phải từ 0 đến 480 phút",
        });
      }

      const updateData = {};
      if (tenTuyen !== undefined) updateData.tenTuyen = tenTuyen;
      if (moTa !== undefined) updateData.moTa = moTa;
      if (diemBatDau !== undefined) updateData.diemBatDau = diemBatDau;
      if (diemKetThuc !== undefined) updateData.diemKetThuc = diemKetThuc;
      if (khoangCach !== undefined)
        updateData.khoangCach = parseFloat(khoangCach);
      if (thoiGianDuKien !== undefined)
        updateData.thoiGianDuKien = parseInt(thoiGianDuKien);
      if (trangThai !== undefined) updateData.trangThai = trangThai;

      const isUpdated = await TuyenDuongModel.update(id, updateData);

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật tuyến đường",
        });
      }

      const updatedRoute = await TuyenDuongModel.getById(id);

      res.status(200).json({
        success: true,
        data: updatedRoute,
        message: "Cập nhật tuyến đường thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.updateRoute:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật tuyến đường",
        error: error.message,
      });
    }
  }

  // Xóa tuyến đường
  static async deleteRoute(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã tuyến đường là bắt buộc",
        });
      }

      // Kiểm tra tuyến đường có tồn tại không
      const existingRoute = await TuyenDuongModel.getById(id);
      if (!existingRoute) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tuyến đường",
        });
      }

      // Kiểm tra tuyến đường có đang được sử dụng trong lịch trình không
      const schedules = await LichTrinhModel.getByRouteId(id);
      if (schedules.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Không thể xóa tuyến đường đang được sử dụng trong lịch trình",
          data: { schedulesCount: schedules.length },
        });
      }

      const isDeleted = await TuyenDuongModel.delete(id);

      if (!isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa tuyến đường",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa tuyến đường thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.deleteRoute:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa tuyến đường",
        error: error.message,
      });
    }
  }

  // Lấy danh sách điểm dừng của tuyến đường
  static async getRouteStops(req, res) {
    try {
      const { id } = req.params;
      const { sortBy = "thuTu" } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã tuyến đường là bắt buộc",
        });
      }

      // Kiểm tra tuyến đường có tồn tại không
      const route = await TuyenDuongModel.getById(id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tuyến đường",
        });
      }

      let stops = await DiemDungModel.getByRouteId(id);

      // Sắp xếp theo thứ tự
      if (sortBy === "thuTu") {
        stops = stops.sort((a, b) => a.thuTu - b.thuTu);
      } else if (sortBy === "tenDiem") {
        stops = stops.sort((a, b) => a.tenDiem.localeCompare(b.tenDiem));
      }

      res.status(200).json({
        success: true,
        data: stops,
        message: "Lấy danh sách điểm dừng thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.getRouteStops:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách điểm dừng",
        error: error.message,
      });
    }
  }

  // Thêm điểm dừng vào tuyến đường
  static async addStopToRoute(req, res) {
    try {
      const { id } = req.params;
      const { tenDiem, diaChi, viDo, kinhDo, thuTu, thoiGianDung, moTa } =
        req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã tuyến đường là bắt buộc",
        });
      }

      // Validation dữ liệu bắt buộc
      if (!tenDiem || !diaChi || !viDo || !kinhDo || !thuTu) {
        return res.status(400).json({
          success: false,
          message: "Tên điểm, địa chỉ, vĩ độ, kinh độ và thứ tự là bắt buộc",
        });
      }

      // Kiểm tra tuyến đường có tồn tại không
      const route = await TuyenDuongModel.getById(id);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tuyến đường",
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

      // Validation thứ tự
      if (thuTu < 1) {
        return res.status(400).json({
          success: false,
          message: "Thứ tự phải lớn hơn 0",
        });
      }

      // Kiểm tra thứ tự đã tồn tại chưa
      const existingOrder = await DiemDungModel.getByRouteAndOrder(id, thuTu);
      if (existingOrder) {
        return res.status(409).json({
          success: false,
          message: "Thứ tự này đã tồn tại trong tuyến đường",
        });
      }

      const stopData = {
        maTuyen: id,
        tenDiem,
        diaChi,
        viDo: parseFloat(viDo),
        kinhDo: parseFloat(kinhDo),
        thuTu: parseInt(thuTu),
        thoiGianDung: thoiGianDung ? parseInt(thoiGianDung) : 0,
        moTa: moTa || null,
        trangThai: "hoat_dong",
      };

      const newStopId = await DiemDungModel.create(stopData);
      const newStop = await DiemDungModel.getById(newStopId);

      res.status(201).json({
        success: true,
        data: newStop,
        message: "Thêm điểm dừng thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.addStopToRoute:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thêm điểm dừng",
        error: error.message,
      });
    }
  }

  // Cập nhật điểm dừng
  static async updateStop(req, res) {
    try {
      const { id, stopId } = req.params;
      const {
        tenDiem,
        diaChi,
        viDo,
        kinhDo,
        thuTu,
        thoiGianDung,
        moTa,
        trangThai,
      } = req.body;

      if (!id || !stopId) {
        return res.status(400).json({
          success: false,
          message: "Mã tuyến đường và mã điểm dừng là bắt buộc",
        });
      }

      // Kiểm tra điểm dừng có tồn tại không
      const existingStop = await DiemDungModel.getById(stopId);
      if (!existingStop) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy điểm dừng",
        });
      }

      // Kiểm tra điểm dừng có thuộc tuyến đường không
      if (existingStop.maTuyen !== id) {
        return res.status(400).json({
          success: false,
          message: "Điểm dừng không thuộc tuyến đường này",
        });
      }

      // Validation tọa độ nếu có thay đổi
      if (viDo !== undefined && (viDo < -90 || viDo > 90)) {
        return res.status(400).json({
          success: false,
          message: "Vĩ độ phải từ -90 đến 90",
        });
      }

      if (kinhDo !== undefined && (kinhDo < -180 || kinhDo > 180)) {
        return res.status(400).json({
          success: false,
          message: "Kinh độ phải từ -180 đến 180",
        });
      }

      // Validation thứ tự nếu có thay đổi
      if (thuTu !== undefined) {
        if (thuTu < 1) {
          return res.status(400).json({
            success: false,
            message: "Thứ tự phải lớn hơn 0",
          });
        }

        // Kiểm tra thứ tự trùng lặp
        if (thuTu !== existingStop.thuTu) {
          const existingOrder = await DiemDungModel.getByRouteAndOrder(
            id,
            thuTu
          );
          if (existingOrder) {
            return res.status(409).json({
              success: false,
              message: "Thứ tự này đã tồn tại trong tuyến đường",
            });
          }
        }
      }

      const updateData = {};
      if (tenDiem !== undefined) updateData.tenDiem = tenDiem;
      if (diaChi !== undefined) updateData.diaChi = diaChi;
      if (viDo !== undefined) updateData.viDo = parseFloat(viDo);
      if (kinhDo !== undefined) updateData.kinhDo = parseFloat(kinhDo);
      if (thuTu !== undefined) updateData.thuTu = parseInt(thuTu);
      if (thoiGianDung !== undefined)
        updateData.thoiGianDung = parseInt(thoiGianDung);
      if (moTa !== undefined) updateData.moTa = moTa;
      if (trangThai !== undefined) updateData.trangThai = trangThai;

      const isUpdated = await DiemDungModel.update(stopId, updateData);

      if (!isUpdated) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật điểm dừng",
        });
      }

      const updatedStop = await DiemDungModel.getById(stopId);

      res.status(200).json({
        success: true,
        data: updatedStop,
        message: "Cập nhật điểm dừng thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.updateStop:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật điểm dừng",
        error: error.message,
      });
    }
  }

  // Xóa điểm dừng khỏi tuyến đường
  static async removeStopFromRoute(req, res) {
    try {
      const { id, stopId } = req.params;

      if (!id || !stopId) {
        return res.status(400).json({
          success: false,
          message: "Mã tuyến đường và mã điểm dừng là bắt buộc",
        });
      }

      // Kiểm tra điểm dừng có tồn tại không
      const existingStop = await DiemDungModel.getById(stopId);
      if (!existingStop) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy điểm dừng",
        });
      }

      // Kiểm tra điểm dừng có thuộc tuyến đường không
      if (existingStop.maTuyen !== id) {
        return res.status(400).json({
          success: false,
          message: "Điểm dừng không thuộc tuyến đường này",
        });
      }

      const isDeleted = await DiemDungModel.delete(stopId);

      if (!isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa điểm dừng",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa điểm dừng thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.removeStopFromRoute:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa điểm dừng",
        error: error.message,
      });
    }
  }

  // Lấy thống kê tuyến đường
  static async getRouteStats(req, res) {
    try {
      const allRoutes = await TuyenDuongModel.getAll();

      const stats = {
        total: allRoutes.length,
        active: allRoutes.filter((route) => route.trangThai === "hoat_dong")
          .length,
        inactive: allRoutes.filter(
          (route) => route.trangThai === "ngung_hoat_dong"
        ).length,
        totalDistance: allRoutes.reduce(
          (sum, route) => sum + (route.khoangCach || 0),
          0
        ),
        averageDistance: Math.round(
          allRoutes.reduce((sum, route) => sum + (route.khoangCach || 0), 0) /
            allRoutes.length
        ),
        totalStops: 0,
        averageStops: 0,
      };

      // Tính tổng số điểm dừng
      for (const route of allRoutes) {
        const stops = await DiemDungModel.getByRouteId(route.maTuyen);
        stats.totalStops += stops.length;
      }

      stats.averageStops = Math.round(stats.totalStops / allRoutes.length);

      res.status(200).json({
        success: true,
        data: stats,
        message: "Lấy thống kê tuyến đường thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.getRouteStats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê tuyến đường",
        error: error.message,
      });
    }
  }
}

export default RouteController;
