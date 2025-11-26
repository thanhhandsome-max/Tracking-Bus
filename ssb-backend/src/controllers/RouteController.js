// RouteController - Controller refactored for v1.1 (normalized stops + route_stops)
import RouteService from "../services/RouteService.js";
import RouteAutoCreateService from "../services/RouteAutoCreateService.js";
import TuyenDuongModel from "../models/TuyenDuongModel.js";
import LichTrinhModel from "../models/LichTrinhModel.js";
import MapsService from "../services/MapsService.js";
import StopSuggestionService from "../services/StopSuggestionService.js";
import HocSinhModel from "../models/HocSinhModel.js";
import GeoUtils from "../utils/GeoUtils.js";
import pool from "../config/db.js";
import * as response from "../utils/response.js";

class RouteController {
  // Lấy danh sách tất cả tuyến đường
  static async getAllRoutes(req, res) {
    try {
      const {
        page = 1,
        pageSize = 10,
        q, // search query
        trangThai,
        routeType, // 'di', 've', hoặc undefined (tất cả)
        sortBy = "maTuyen",
        sortOrder = "desc",
      } = req.query;

      // Normalize query params
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limit = Math.max(1, Math.min(200, parseInt(pageSize) || 10));
      const search = q || req.query.search;
      const sortDir = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

      const result = await RouteService.list({ 
        page: pageNum, 
        limit, 
        search, 
        trangThai,
        routeType, // Thêm routeType filter
        sortBy,
        sortDir,
      });

      return response.ok(res, result.data, {
        page: pageNum,
        pageSize: limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        sortBy,
        sortOrder: sortOrder.toLowerCase(),
        q: search || null,
      });
    } catch (error) {
      console.error("Error in RouteController.getAllRoutes:", error);
      return response.serverError(res, "Lỗi server khi lấy danh sách tuyến đường", error);
    }
  }

  // Lấy thông tin chi tiết một tuyến đường
  static async getRouteById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.validationError(res, "Mã tuyến đường là bắt buộc", [
          { field: "id", message: "Mã tuyến đường không được để trống" }
        ]);
      }

      const route = await RouteService.getById(id);

      // Lấy lịch trình của tuyến đường (nếu cần)
      let schedules = [];
      try {
        schedules = await LichTrinhModel.getByRouteId(id);
      } catch (scheduleError) {
        console.error("Error fetching schedules:", scheduleError);
      }

      return response.ok(res, {
        ...route,
        schedules: schedules || [],
      });
    } catch (error) {
      if (error.message === "ROUTE_NOT_FOUND") {
        return response.notFound(res, "Không tìm thấy tuyến đường");
      }

      console.error("Error in RouteController.getRouteById:", error);
      return response.serverError(res, "Lỗi server khi lấy thông tin tuyến đường", error);
    }
  }

  // Tạo tuyến đường mới
  static async createRoute(req, res) {
    try {
      const {
        tenTuyen,
        diemBatDau,
        diemKetThuc,
        thoiGianUocTinh,
        origin_lat,
        origin_lng,
        dest_lat,
        dest_lng,
        polyline,
        trangThai,
        routeType, // 'di' hoặc 've'
        createReturnRoute, // Có tạo tuyến về không (mặc định true)
        stops, // Danh sách stops nếu có
      } = req.body;

      // Validation
      if (!tenTuyen || !diemBatDau || !diemKetThuc) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Tên tuyến, điểm bắt đầu và điểm kết thúc là bắt buộc",
          },
        });
      }

      // Kiểm tra tên tuyến đã tồn tại chưa
      const existingRoute = await TuyenDuongModel.getByName(tenTuyen);
      if (existingRoute) {
        return res.status(409).json({
          success: false,
          error: {
            code: "DUPLICATE_ROUTE_NAME",
            message: "Tên tuyến đường đã tồn tại trong hệ thống",
          },
        });
      }

      const routeData = {
        tenTuyen,
        diemBatDau,
        diemKetThuc,
        thoiGianUocTinh,
        origin_lat,
        origin_lng,
        dest_lat,
        dest_lng,
        polyline,
        trangThai: trangThai !== undefined ? trangThai : true,
        routeType: routeType || 'di', // Mặc định là tuyến đi
        createReturnRoute: createReturnRoute !== false, // Mặc định true
        stops: stops || [], // Danh sách stops nếu có
      };

      const newRoute = await RouteService.create(routeData);

      res.status(201).json({
        success: true,
        data: newRoute,
        message: "Tạo tuyến đường mới thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.createRoute:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi tạo tuyến đường mới",
        },
      });
    }
  }

  // Tạo nhiều tuyến đường cùng lúc (batch) với transaction
  static async createRoutesBatch(req, res) {
    try {
      const { routes } = req.body;

      if (!Array.isArray(routes) || routes.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Danh sách tuyến đường (routes) là bắt buộc và phải là mảng",
          },
        });
      }

      console.log(`[RouteController] createRoutesBatch called with ${routes.length} routes`);

      const RouteService = (await import("../services/RouteService.js")).default;
      const MapsService = (await import("../services/MapsService.js")).default;
      const result = await RouteService.createRoutesBatch(routes);

      if (result.success) {
        // Sau khi tạo thành công, rebuild polyline cho tất cả routes
        // Điều này đảm bảo routes có polyline để hiển thị trên bản đồ
        const rebuildPromises = result.created.map(async (createdRoute) => {
          try {
            console.log(`[RouteController] Rebuilding polyline for route ${createdRoute.routeId}`);
            await RouteService.rebuildPolyline(createdRoute.routeId, MapsService);
            console.log(`[RouteController] ✅ Successfully rebuilt polyline for route ${createdRoute.routeId}`);
            return { routeId: createdRoute.routeId, success: true };
          } catch (rebuildError) {
            console.error(`[RouteController] ⚠️ Failed to rebuild polyline for route ${createdRoute.routeId}:`, rebuildError.message);
            // Không throw error, chỉ log warning - polyline có thể được rebuild sau
            return { routeId: createdRoute.routeId, success: false, error: rebuildError.message };
          }
        });

        // Chờ tất cả rebuild hoàn thành (không block response)
        Promise.all(rebuildPromises).then((rebuildResults) => {
          const successCount = rebuildResults.filter(r => r.success).length;
          const failCount = rebuildResults.filter(r => !r.success).length;
          console.log(`[RouteController] Polyline rebuild completed: ${successCount} success, ${failCount} failed`);
        }).catch((err) => {
          console.error(`[RouteController] Error in polyline rebuild batch:`, err);
        });

        return res.status(201).json({
          success: true,
          data: result,
          message: `Đã tạo thành công ${result.created.length} tuyến đường`,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: "BATCH_CREATE_FAILED",
            message: result.message || "Không thể tạo một số tuyến đường",
          },
          data: result,
        });
      }
    } catch (error) {
      console.error("Error in RouteController.createRoutesBatch:", error);
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi tạo tuyến đường",
        },
      });
    }
  }

  // Cập nhật tuyến đường
  static async updateRoute(req, res) {
    try {
      const { id } = req.params;
      const {
        tenTuyen,
        diemBatDau,
        diemKetThuc,
        thoiGianUocTinh,
        origin_lat,
        origin_lng,
        dest_lat,
        dest_lng,
        polyline,
        trangThai,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_PARAMS",
            message: "Mã tuyến đường là bắt buộc",
          },
        });
      }

      // Kiểm tra tên tuyến trùng lặp (nếu có thay đổi)
      if (tenTuyen) {
        const existingRoute = await TuyenDuongModel.getById(id);
        if (existingRoute && existingRoute.tenTuyen !== tenTuyen) {
          const duplicateRoute = await TuyenDuongModel.getByName(tenTuyen);
          if (duplicateRoute) {
            return res.status(409).json({
              success: false,
              error: {
                code: "DUPLICATE_ROUTE_NAME",
                message: "Tên tuyến đường đã tồn tại trong hệ thống",
              },
            });
          }
        }
      }

      const updateData = {};
      if (tenTuyen !== undefined) updateData.tenTuyen = tenTuyen;
      if (diemBatDau !== undefined) updateData.diemBatDau = diemBatDau;
      if (diemKetThuc !== undefined) updateData.diemKetThuc = diemKetThuc;
      if (thoiGianUocTinh !== undefined) updateData.thoiGianUocTinh = thoiGianUocTinh;
      if (origin_lat !== undefined) updateData.origin_lat = origin_lat;
      if (origin_lng !== undefined) updateData.origin_lng = origin_lng;
      if (dest_lat !== undefined) updateData.dest_lat = dest_lat;
      if (dest_lng !== undefined) updateData.dest_lng = dest_lng;
      if (polyline !== undefined) updateData.polyline = polyline;
      if (trangThai !== undefined) updateData.trangThai = trangThai;

      const updatedRoute = await RouteService.update(id, updateData);

      res.status(200).json({
        success: true,
        data: updatedRoute,
        message: "Cập nhật tuyến đường thành công",
      });
    } catch (error) {
      if (error.message === "ROUTE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          error: {
            code: "ROUTE_NOT_FOUND",
            message: "Không tìm thấy tuyến đường",
          },
        });
      }

      console.error("Error in RouteController.updateRoute:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi cập nhật tuyến đường",
        },
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
          error: {
            code: "MISSING_PARAMS",
            message: "Mã tuyến đường là bắt buộc",
          },
        });
      }

      // Kiểm tra tuyến đường có đang được sử dụng trong lịch trình không
      const schedules = await LichTrinhModel.getByRouteId(id);
      if (schedules.length > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: "ROUTE_IN_USE",
            message: "Không thể xóa tuyến đường đang được sử dụng trong lịch trình",
          },
          data: { schedulesCount: schedules.length },
        });
      }

      await RouteService.delete(id);

      res.status(200).json({
        success: true,
        message: "Xóa tuyến đường thành công",
      });
    } catch (error) {
      if (error.message === "ROUTE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          error: {
            code: "ROUTE_NOT_FOUND",
            message: "Không tìm thấy tuyến đường",
          },
        });
      }

      console.error("Error in RouteController.deleteRoute:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi xóa tuyến đường",
        },
      });
    }
  }

  // Lấy danh sách điểm dừng của tuyến đường
  static async getRouteStops(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_PARAMS",
            message: "Mã tuyến đường là bắt buộc",
          },
        });
      }

      const stops = await RouteService.getStops(id);

      res.status(200).json({
        success: true,
        data: stops,
        message: "Lấy danh sách điểm dừng thành công",
      });
    } catch (error) {
      if (error.message === "ROUTE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          error: {
            code: "ROUTE_NOT_FOUND",
            message: "Không tìm thấy tuyến đường",
          },
        });
      }

      console.error("Error in RouteController.getRouteStops:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi lấy danh sách điểm dừng",
        },
      });
    }
  }

  // Thêm điểm dừng vào tuyến đường
  static async addStopToRoute(req, res) {
    try {
      const { id } = req.params;
      const { stop_id, sequence, dwell_seconds, tenDiem, viDo, kinhDo, address, scheduled_time } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_PARAMS",
            message: "Mã tuyến đường là bắt buộc",
          },
        });
      }

      // Nếu không có stop_id, cần tạo stop mới (cần tenDiem, viDo, kinhDo)
      if (!stop_id) {
        if (!tenDiem || viDo === undefined || kinhDo === undefined) {
          return res.status(400).json({
            success: false,
            error: {
              code: "MISSING_REQUIRED_FIELDS",
              message: "stop_id hoặc (tenDiem, viDo, kinhDo) là bắt buộc",
            },
          });
        }
      }

      const stopData = {
        stop_id,
        sequence,
        dwell_seconds,
        tenDiem,
        viDo,
        kinhDo,
        address,
        scheduled_time,
      };

      const stops = await RouteService.addStopToRoute(id, stopData);

      res.status(201).json({
        success: true,
        data: stops,
        message: "Thêm điểm dừng vào tuyến đường thành công",
      });
    } catch (error) {
      if (error.message === "ROUTE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          error: {
            code: "ROUTE_NOT_FOUND",
            message: "Không tìm thấy tuyến đường",
          },
        });
      }

      if (error.message === "STOP_ALREADY_IN_ROUTE") {
        return res.status(409).json({
          success: false,
          error: {
            code: "STOP_ALREADY_IN_ROUTE",
            message: "Điểm dừng đã tồn tại trong tuyến đường",
          },
        });
      }

      if (error.message === "SEQUENCE_ALREADY_EXISTS") {
        return res.status(409).json({
          success: false,
          error: {
            code: "SEQUENCE_ALREADY_EXISTS",
            message: "Thứ tự này đã tồn tại trong tuyến đường",
          },
        });
      }

      if (error.message === "MISSING_REQUIRED_FIELDS") {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Thiếu các trường bắt buộc: tenDiem, viDo, kinhDo",
          },
        });
      }

      if (error.message === "INVALID_LATITUDE" || error.message === "INVALID_LONGITUDE") {
        return res.status(400).json({
          success: false,
          error: {
            code: error.message,
            message: error.message === "INVALID_LATITUDE" 
              ? "Vĩ độ không hợp lệ (phải từ -90 đến 90)"
              : "Kinh độ không hợp lệ (phải từ -180 đến 180)",
          },
        });
      }

      // Xử lý lỗi duplicate entry từ database
      if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
        return res.status(409).json({
          success: false,
          error: {
            code: "DUPLICATE_STOP",
            message: "Điểm dừng với cùng tên và tọa độ đã tồn tại trong hệ thống",
          },
        });
      }

      console.error("Error in RouteController.addStopToRoute:", error);
      console.error("Error stack:", error.stack);
      console.error("Request body:", req.body);
      console.error("Route ID:", req.params.id);
      
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Lỗi server khi thêm điểm dừng vào tuyến đường",
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      });
    }
  }

  // Cập nhật điểm dừng trong tuyến đường
  static async updateStopInRoute(req, res) {
    try {
      const { id, stopId } = req.params;
      const { sequence, dwell_seconds, tenDiem, viDo, kinhDo, address, scheduled_time } = req.body;

      if (!id || !stopId) {
        return response.validationError(res, "Mã tuyến đường và mã điểm dừng là bắt buộc", [
          { field: "id", message: "Mã tuyến đường không được để trống" },
          { field: "stopId", message: "Mã điểm dừng không được để trống" }
        ]);
      }

      const updateData = {};
      if (sequence !== undefined) updateData.sequence = sequence;
      if (dwell_seconds !== undefined) updateData.dwell_seconds = dwell_seconds;
      if (tenDiem !== undefined) updateData.tenDiem = tenDiem;
      if (viDo !== undefined) updateData.viDo = viDo;
      if (kinhDo !== undefined) updateData.kinhDo = kinhDo;
      if (address !== undefined) updateData.address = address;
      if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time;

      if (Object.keys(updateData).length === 0) {
        return response.validationError(res, "Phải có ít nhất một trường để cập nhật", [
          { field: "body", message: "Cần có sequence, dwell_seconds, tenDiem, viDo, kinhDo, address, hoặc scheduled_time" }
        ]);
      }

      const stops = await RouteService.updateStopInRoute(id, stopId, updateData);

      return response.ok(res, stops, null, "Cập nhật điểm dừng thành công");
    } catch (error) {
      if (error.message === "ROUTE_NOT_FOUND") {
        return response.notFound(res, "Không tìm thấy tuyến đường");
      }

      if (error.message === "STOP_NOT_IN_ROUTE") {
        return response.notFound(res, "Điểm dừng không thuộc tuyến đường này");
      }

      if (error.message === "SEQUENCE_ALREADY_EXISTS") {
        return response.validationError(res, "Thứ tự này đã tồn tại trong tuyến đường", [
          { field: "sequence", message: "Thứ tự đã được sử dụng bởi điểm dừng khác" }
        ]);
      }

      if (error.message === "INVALID_LATITUDE" || error.message === "INVALID_LONGITUDE") {
        return response.validationError(res, "Tọa độ không hợp lệ", [
          { 
            field: error.message === "INVALID_LATITUDE" ? "viDo" : "kinhDo", 
            message: error.message === "INVALID_LATITUDE" 
              ? "Vĩ độ phải từ -90 đến 90" 
              : "Kinh độ phải từ -180 đến 180" 
          }
        ]);
      }

      console.error("Error in RouteController.updateStopInRoute:", error);
      return response.serverError(res, "Lỗi server khi cập nhật điểm dừng", error);
    }
  }

  // Xóa điểm dừng khỏi tuyến đường
  static async removeStopFromRoute(req, res) {
    try {
      const { id, stopId } = req.params;

      if (!id || !stopId) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_PARAMS",
            message: "Mã tuyến đường và mã điểm dừng là bắt buộc",
          },
        });
      }

      await RouteService.removeStopFromRoute(id, stopId);

      res.status(200).json({
        success: true,
        message: "Xóa điểm dừng khỏi tuyến đường thành công",
      });
    } catch (error) {
      if (error.message === "ROUTE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          error: {
            code: "ROUTE_NOT_FOUND",
            message: "Không tìm thấy tuyến đường",
          },
        });
      }

      if (error.message === "STOP_NOT_IN_ROUTE") {
        return res.status(404).json({
          success: false,
          error: {
            code: "STOP_NOT_IN_ROUTE",
            message: "Điểm dừng không thuộc tuyến đường này",
          },
        });
      }

      console.error("Error in RouteController.removeStopFromRoute:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi xóa điểm dừng khỏi tuyến đường",
        },
      });
    }
  }

  // Sắp xếp lại thứ tự stops trong route (M1-M3: Atomic transaction)
  static async reorderStops(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body;

      if (!id) {
        return response.validationError(res, "Mã tuyến đường là bắt buộc", [
          { field: "id", message: "Mã tuyến đường không được để trống" }
        ]);
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return response.validationError(res, "items (mảng {stopId, order}) là bắt buộc", [
          { field: "items", message: "Phải là mảng không rỗng chứa {stopId, order}" }
        ]);
      }

      // Validate items format
      for (const item of items) {
        if (!item.stopId || item.order === undefined) {
          return response.validationError(res, "Mỗi item phải có stopId và order", [
            { field: "items", message: "Format: [{stopId: number, order: number}, ...]" }
          ]);
        }
      }

      const stops = await RouteService.reorderStops(id, items);

      return response.ok(res, stops);
    } catch (error) {
      if (error.message === "ROUTE_NOT_FOUND") {
        return response.notFound(res, "Không tìm thấy tuyến đường");
      }

      if (error.message === "DUPLICATE_SEQUENCE" || error.message === "INVALID_STOP_ID") {
        return response.validationError(res, "Dữ liệu không hợp lệ", [
          { field: "items", message: error.message }
        ]);
      }

      console.error("Error in RouteController.reorderStops:", error);
      return response.serverError(res, "Lỗi server khi sắp xếp lại thứ tự stops", error);
    }
  }

  // Rebuild polyline cho route
  static async rebuildPolyline(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_PARAMS",
            message: "Mã tuyến đường là bắt buộc",
          },
        });
      }

      const result = await RouteService.rebuildPolyline(id, MapsService);

      // P2 Fix: Emit socket event route-updated after successful rebuild
      const io = req.app.get("io");
      if (io && result.polyline) {
        io.to(`route:${id}`).emit("route_updated", {
          routeId: parseInt(id),
          polyline: result.polyline,
          updatedAt: Date.now(),
        });
        console.log(`📡 [RouteController] Emitted route_updated event for route ${id}`);
      }

      res.status(200).json({
        success: true,
        data: result,
        message: "Rebuild polyline thành công",
      });
    } catch (error) {
      if (error.message === "ROUTE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          error: {
            code: "ROUTE_NOT_FOUND",
            message: "Không tìm thấy tuyến đường",
          },
        });
      }

      if (error.message === "INSUFFICIENT_STOPS") {
        return res.status(400).json({
          success: false,
          error: {
            code: "INSUFFICIENT_STOPS",
            message: "Tuyến đường cần ít nhất 2 điểm dừng để rebuild polyline",
          },
        });
      }

      // Handle Maps API errors
      if (error.message === "MAPS_API_KEY not configured" || 
          error.message.includes("Maps API") ||
          error.message.includes("Maps API error") ||
          error.message.includes("Maps API request timeout") ||
          error.message.includes("Maps API HTTP error")) {
        console.error("[RouteController] Maps API error:", {
          message: error.message,
          routeId: id,
        });
        return res.status(503).json({
          success: false,
          error: {
            code: "MAPS_API_ERROR",
            message: error.message || "Lỗi khi gọi Maps API. Vui lòng kiểm tra MAPS_API_KEY và API quota.",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          },
        });
      }

      // Handle MAPS_API_ERROR from RouteService
      if (error.message === "MAPS_API_ERROR") {
        return res.status(503).json({
          success: false,
          error: {
            code: "MAPS_API_ERROR",
            message: "Không thể lấy polyline từ Maps API. Vui lòng thử lại sau.",
          },
        });
      }

      console.error("[RouteController] Error in rebuildPolyline:", {
        message: error.message,
        stack: error.stack,
        routeId: id,
      });
      
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi rebuild polyline",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      });
    }
  }

  // Lấy thống kê tuyến đường
  static async getRouteStats(req, res) {
    try {
      const stats = await TuyenDuongModel.getStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: "Lấy thống kê tuyến đường thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.getRouteStats:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi lấy thống kê tuyến đường",
        },
      });
    }
  }

  // Đề xuất tuyến đường hoàn chỉnh dựa trên học sinh
  static async suggestRoutes(req, res) {
    try {
      const {
        area, // Filter theo khu vực (quận/huyện)
        maxStudentsPerRoute = 35, // Số học sinh tối đa mỗi tuyến (30-40)
        minStudentsPerRoute = 30, // Số học sinh tối thiểu mỗi tuyến
        maxStopsPerRoute = 35, // Số điểm dừng tối đa mỗi tuyến (<40)
        maxDistanceKm = 1.5, // Khoảng cách tối đa để clustering (km) - giảm để gom gần hơn
        minStudentsPerStop = 1, // Số học sinh tối thiểu mỗi điểm dừng
        geocodeAddresses = true, // Có geocode địa chỉ không
        schoolLat, // Vĩ độ trường học (nếu null sẽ dùng SGU)
        schoolLng, // Kinh độ trường học
        createReturnRoutes = true, // Tạo tuyến về tương ứng
      } = req.query;

      console.log(`[RouteController] suggestRoutes called with params:`, {
        area,
        maxStudentsPerRoute,
        minStudentsPerRoute,
        maxStopsPerRoute,
        maxDistanceKm,
        minStudentsPerStop,
        createReturnRoutes,
      });

      // Parse school location
      let schoolLocation = null;
      if (schoolLat && schoolLng) {
        try {
          schoolLocation = {
            lat: parseFloat(schoolLat),
            lng: parseFloat(schoolLng),
          };
        } catch (e) {
          console.warn(`[RouteController] Failed to parse school location:`, e);
        }
      }

      const RouteSuggestionService = (await import("../services/RouteSuggestionService.js")).default;
      
      const result = await RouteSuggestionService.suggestRoutes({
        area: area || null,
        maxStudentsPerRoute: parseInt(maxStudentsPerRoute) || 35,
        minStudentsPerRoute: parseInt(minStudentsPerRoute) || 30,
        maxStopsPerRoute: parseInt(maxStopsPerRoute) || 35,
        maxDistanceKm: parseFloat(maxDistanceKm) || 1.5,
        minStudentsPerStop: parseInt(minStudentsPerStop) || 1,
        geocodeAddresses: geocodeAddresses !== 'false',
        schoolLocation: schoolLocation,
        createReturnRoutes: createReturnRoutes !== 'false',
      });

      console.log(`[RouteController] suggestRoutes result:`, {
        routesCount: result.routes?.length || 0,
        returnRoutesCount: result.returnRoutes?.length || 0,
        totalStudents: result.totalStudents,
        districts: result.districts,
      });

      return response.ok(res, result);
    } catch (error) {
      console.error("Error in RouteController.suggestRoutes:", error);
      console.error("Error stack:", error.stack);
      return response.serverError(
        res,
        "Lỗi server khi đề xuất tuyến đường",
        error
      );
    }
  }

  // Đề xuất điểm dừng dựa trên clustering học sinh
  static async suggestStops(req, res) {
    try {
      const {
        area, // Filter theo khu vực (quận/huyện)
        maxDistanceKm = 2.0, // Khoảng cách tối đa để clustering (km)
        minStudentsPerStop = 1, // Số học sinh tối thiểu mỗi điểm dừng (giảm xuống 1)
        maxStops = 20, // Số điểm dừng tối đa
        geocodeAddresses = true, // Có geocode địa chỉ không
        origin, // Điểm bắt đầu (lat,lng hoặc {lat, lng})
        destination, // Điểm kết thúc (lat,lng hoặc {lat, lng})
        optimizeRoute = true, // Có tối ưu lộ trình không
      } = req.query;

      console.log(`[RouteController] suggestStops called with params:`, {
        area,
        maxDistanceKm,
        minStudentsPerStop,
        maxStops,
        geocodeAddresses,
      });

      // Parse origin và destination
      let parsedOrigin = null;
      let parsedDestination = null;
      
      if (origin) {
        try {
          if (typeof origin === 'string' && origin.includes(',')) {
            const [lat, lng] = origin.split(',').map(Number);
            parsedOrigin = { lat, lng };
          } else if (typeof origin === 'string' && origin.includes('{')) {
            parsedOrigin = JSON.parse(origin);
          } else {
            parsedOrigin = origin;
          }
        } catch (e) {
          console.warn(`[RouteController] Failed to parse origin:`, e);
        }
      }
      
      if (destination) {
        try {
          if (typeof destination === 'string' && destination.includes(',')) {
            const [lat, lng] = destination.split(',').map(Number);
            parsedDestination = { lat, lng };
          } else if (typeof destination === 'string' && destination.includes('{')) {
            parsedDestination = JSON.parse(destination);
          } else {
            parsedDestination = destination;
          }
        } catch (e) {
          console.warn(`[RouteController] Failed to parse destination:`, e);
        }
      }

      const result = await StopSuggestionService.suggestStops({
        area: area || null,
        maxDistanceKm: parseFloat(maxDistanceKm) || 2.0,
        minStudentsPerStop: parseInt(minStudentsPerStop) || 1,
        maxStops: parseInt(maxStops) || 20,
        geocodeAddresses: geocodeAddresses !== 'false', // Default true
        origin: parsedOrigin,
        destination: parsedDestination,
        optimizeRoute: optimizeRoute !== 'false', // Default true
      });

      console.log(`[RouteController] suggestStops result:`, {
        suggestionsCount: result.suggestions?.length || 0,
        totalStudents: result.totalStudents,
        totalClusters: result.totalClusters,
        validClusters: result.validClusters,
      });

      return response.ok(res, result);
    } catch (error) {
      console.error("Error in RouteController.suggestStops:", error);
      console.error("Error stack:", error.stack);
      return response.serverError(
        res,
        "Lỗi server khi đề xuất điểm dừng",
        error
      );
    }
  }

  // Tạo tuyến đường tự động từ start → end với auto suggestion
  static async autoCreateRoute(req, res) {
    try {
      const {
        tenTuyen,
        startPoint,
        endPoint,
        options,
      } = req.body;

      // Validation
      if (!tenTuyen || !startPoint || !endPoint) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Tên tuyến, điểm bắt đầu và điểm kết thúc là bắt buộc",
          },
        });
      }

      if (!startPoint.lat || !startPoint.lng || !endPoint.lat || !endPoint.lng) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_COORDINATES",
            message: "Điểm bắt đầu và điểm kết thúc phải có tọa độ hợp lệ",
          },
        });
      }

      // Kiểm tra tên tuyến đã tồn tại chưa
      const existingRoute = await TuyenDuongModel.getByName(tenTuyen);
      if (existingRoute) {
        return res.status(409).json({
          success: false,
          error: {
            code: "DUPLICATE_ROUTE_NAME",
            message: "Tên tuyến đường đã tồn tại trong hệ thống",
          },
        });
      }

      const result = await RouteAutoCreateService.createAutoRoute({
        tenTuyen,
        startPoint,
        endPoint,
        options,
      });

      return response.ok(res, result, {
        message: "Tạo tuyến đường tự động thành công",
      });
    } catch (error) {
      console.error("Error in RouteController.autoCreateRoute:", error);
      
      if (error.message === "MISSING_REQUIRED_FIELDS" || error.message === "INVALID_COORDINATES") {
        return response.validationError(res, error.message);
      }
      
      if (error.message.includes("DIRECTIONS_API_ERROR")) {
        return response.serverError(res, "Lỗi khi lấy tuyến đường từ Google Maps API", error);
      }

      return response.serverError(res, "Lỗi server khi tạo tuyến đường tự động", error);
    }
  }

  // Lấy stop suggestions cho một route
  static async getStopSuggestions(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.validationError(res, "Mã tuyến đường là bắt buộc", [
          { field: "id", message: "Mã tuyến đường không được để trống" },
        ]);
      }

      // Lấy route info
      const route = await TuyenDuongModel.getById(id);
      if (!route) {
        return response.notFound(res, "Không tìm thấy tuyến đường");
      }

      // Lấy route stops
      const RouteStopModel = (await import("../models/RouteStopModel.js")).default;
      const routeStops = await RouteStopModel.getByRouteId(id);

      // Lấy suggestions
      const StudentStopSuggestionModel = (await import("../models/StudentStopSuggestionModel.js")).default;
      const allSuggestions = await StudentStopSuggestionModel.getByRouteId(id);
      console.log(`[RouteController.getStopSuggestions] Loaded ${allSuggestions.length} total suggestions from DB for route ${id}`);

      // Helper function: Tính khoảng cách giữa 2 điểm (Haversine formula) - trả về km
      const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; // Radius of Earth in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Maximum distance from stop to student (3km - corridor radius)
      const MAX_DISTANCE_KM = 3;

      // Group suggestions theo stop và filter theo khoảng cách
      const stopsWithSuggestions = routeStops.map((stop) => {
        // Filter suggestions cho stop này và kiểm tra khoảng cách
        const stopSuggestions = allSuggestions
          .filter((s) => s.maDiemDung === stop.maDiem)
          .filter((s) => {
            // Kiểm tra khoảng cách từ học sinh đến điểm dừng
            if (!s.studentLat || !s.studentLng || !stop.viDo || !stop.kinhDo) {
              return false; // Bỏ qua nếu thiếu tọa độ
            }
            const distance = calculateDistance(
              s.studentLat,
              s.studentLng,
              stop.viDo,
              stop.kinhDo
            );
            return distance <= MAX_DISTANCE_KM;
          });

        return {
          sequence: stop.sequence,
          maDiem: stop.maDiem,
          tenDiem: stop.tenDiem,
          viDo: stop.viDo,
          kinhDo: stop.kinhDo,
          address: stop.address,
          studentCount: stopSuggestions.length,
          students: stopSuggestions.map((s) => ({
            maHocSinh: s.maHocSinh,
            hoTen: s.tenHocSinh,
            lop: s.lop,
            viDo: s.studentLat,
            kinhDo: s.studentLng,
          })),
        };
      });

      // Tính tổng số học sinh sau khi filter
      const totalFilteredStudents = stopsWithSuggestions.reduce(
        (sum, stop) => sum + stop.studentCount,
        0
      );
      
      console.log(`[RouteController.getStopSuggestions] Filtered to ${totalFilteredStudents} students within ${MAX_DISTANCE_KM}km (from ${allSuggestions.length} total suggestions)`);

      return response.ok(res, {
        route: {
          maTuyen: route.maTuyen,
          tenTuyen: route.tenTuyen,
          diemBatDau: route.diemBatDau,
          diemKetThuc: route.diemKetThuc,
        },
        stops: stopsWithSuggestions,
        totalStudents: totalFilteredStudents, // Chỉ đếm học sinh gần tuyến (≤3km)
        totalStops: stopsWithSuggestions.length,
        note: `Chỉ hiển thị học sinh trong vòng ${MAX_DISTANCE_KM}km từ các điểm dừng`,
      });
    } catch (error) {
      console.error("Error in RouteController.getStopSuggestions:", error);
      return response.serverError(res, "Lỗi server khi lấy gợi ý điểm dừng", error);
    }
  }

  // Tìm học sinh trong bán kính từ một điểm (dùng khi thêm điểm dừng thủ công)
  static async findStudentsNearby(req, res) {
    try {
      const { lat, lng, radiusMeters = 500 } = req.query;

      if (!lat || !lng) {
        return response.validationError(res, "Tọa độ là bắt buộc", [
          { field: "lat", message: "Vĩ độ không được để trống" },
          { field: "lng", message: "Kinh độ không được để trống" },
        ]);
      }

      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      const radiusKm = parseFloat(radiusMeters) / 1000; // Convert meters to km

      if (isNaN(centerLat) || isNaN(centerLng) || isNaN(radiusKm)) {
        return response.validationError(res, "Tọa độ và bán kính không hợp lệ", [
          { field: "lat", message: "Vĩ độ phải là số" },
          { field: "lng", message: "Kinh độ phải là số" },
          { field: "radiusMeters", message: "Bán kính phải là số" },
        ]);
      }

      // Lấy tất cả học sinh có tọa độ
      const allStudents = await HocSinhModel.getAll();
      
      // Filter học sinh có tọa độ hợp lệ và trong bán kính
      const nearbyStudents = allStudents
        .filter((student) => {
          if (!student.viDo || !student.kinhDo) return false;
          
          const studentLat = parseFloat(student.viDo);
          const studentLng = parseFloat(student.kinhDo);
          
          if (isNaN(studentLat) || isNaN(studentLng)) return false;
          
          // Tính khoảng cách
          const distance = GeoUtils.distanceBetweenPoints(
            centerLat,
            centerLng,
            studentLat,
            studentLng
          );
          
          return distance <= radiusKm;
        })
        .map((student) => {
          const studentLat = parseFloat(student.viDo);
          const studentLng = parseFloat(student.kinhDo);
          const distance = GeoUtils.distanceBetweenPoints(
            centerLat,
            centerLng,
            studentLat,
            studentLng
          );
          
          return {
            maHocSinh: student.maHocSinh,
            hoTen: student.hoTen,
            lop: student.lop,
            diaChi: student.diaChi,
            viDo: studentLat,
            kinhDo: studentLng,
            distanceMeters: Math.round(distance * 1000), // Convert to meters
            distanceKm: parseFloat(distance.toFixed(2)),
          };
        })
        .sort((a, b) => a.distanceMeters - b.distanceMeters); // Sắp xếp theo khoảng cách

      return response.ok(res, {
        center: {
          lat: centerLat,
          lng: centerLng,
        },
        radiusMeters: parseFloat(radiusMeters),
        radiusKm: radiusKm,
        students: nearbyStudents,
        count: nearbyStudents.length,
      });
    } catch (error) {
      console.error("Error in RouteController.findStudentsNearby:", error);
      return response.serverError(res, "Lỗi server khi tìm học sinh gần đây", error);
    }
  }

  // Thêm học sinh vào điểm dừng (student_stop_suggestions)
  static async addStudentToStop(req, res) {
    try {
      const { id, stopId } = req.params; // route ID và stop ID
      const { student_id } = req.body;

      if (!id) {
        return response.validationError(res, "Mã tuyến đường là bắt buộc", [
          { field: "id", message: "Mã tuyến đường không được để trống" },
        ]);
      }

      if (!stopId || !student_id) {
        return response.validationError(res, "Thiếu thông tin", [
          { field: "stopId", message: "Mã điểm dừng là bắt buộc" },
          { field: "student_id", message: "Mã học sinh là bắt buộc" },
        ]);
      }

      // Kiểm tra route tồn tại
      const route = await TuyenDuongModel.getById(id);
      if (!route) {
        return response.notFound(res, "Không tìm thấy tuyến đường");
      }

      // Kiểm tra stop có trong route không
      const RouteStopModel = (await import("../models/RouteStopModel.js")).default;
      const routeStops = await RouteStopModel.getByRouteId(id);
      const stopInRoute = routeStops.find((rs) => rs.maDiem === parseInt(stopId));
      
      if (!stopInRoute) {
        return response.validationError(res, "Điểm dừng không thuộc tuyến đường này", [
          { field: "stopId", message: "Điểm dừng không tồn tại trong tuyến đường" },
        ]);
      }

      // Kiểm tra học sinh tồn tại
      const student = await HocSinhModel.getById(student_id);
      if (!student) {
        return response.notFound(res, "Không tìm thấy học sinh");
      }

      // Thêm vào student_stop_suggestions
      const StudentStopSuggestionModel = (await import("../models/StudentStopSuggestionModel.js")).default;
      await StudentStopSuggestionModel.bulkCreate([
        {
          maTuyen: parseInt(id),
          maDiemDung: parseInt(stopId),
          maHocSinh: parseInt(student_id),
        },
      ]);

      return response.ok(res, {
        message: "Đã thêm học sinh vào điểm dừng",
        routeId: parseInt(id),
        stopId: parseInt(stopId),
        studentId: parseInt(student_id),
      });
    } catch (error) {
      console.error("Error in RouteController.addStudentToStop:", error);
      return response.serverError(res, "Lỗi server khi thêm học sinh vào điểm dừng", error);
    }
  }

  // Xóa học sinh khỏi điểm dừng
  static async removeStudentFromStop(req, res) {
    try {
      const { id, stopId, studentId } = req.params; // route ID, stop ID, student ID

      if (!id || !stopId || !studentId) {
        return response.validationError(res, "Thiếu thông tin", [
          { field: "id", message: "Mã tuyến đường là bắt buộc" },
          { field: "stopId", message: "Mã điểm dừng là bắt buộc" },
          { field: "studentId", message: "Mã học sinh là bắt buộc" },
        ]);
      }

      // Xóa suggestion
      const [result] = await pool.query(
        `DELETE FROM student_stop_suggestions 
         WHERE maTuyen = ? AND maDiemDung = ? AND maHocSinh = ?`,
        [id, stopId, studentId]
      );

      if (result.affectedRows === 0) {
        return response.notFound(res, "Không tìm thấy gợi ý học sinh - điểm dừng");
      }

      return response.ok(res, {
        message: "Đã xóa học sinh khỏi điểm dừng",
        routeId: parseInt(id),
        stopId: parseInt(stopId),
        studentId: parseInt(studentId),
      });
    } catch (error) {
      console.error("Error in RouteController.removeStudentFromStop:", error);
      return response.serverError(res, "Lỗi server khi xóa học sinh khỏi điểm dừng", error);
    }
  }

  // Bulk thêm nhiều học sinh vào điểm dừng
  static async bulkAddStudentsToStop(req, res) {
    try {
      const { id } = req.params; // route ID
      const { stop_id, student_ids } = req.body;

      if (!id) {
        return response.validationError(res, "Mã tuyến đường là bắt buộc", [
          { field: "id", message: "Mã tuyến đường không được để trống" },
        ]);
      }

      if (!stop_id || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
        return response.validationError(res, "Thiếu thông tin", [
          { field: "stop_id", message: "Mã điểm dừng là bắt buộc" },
          { field: "student_ids", message: "Danh sách học sinh là bắt buộc và phải là mảng" },
        ]);
      }

      // Kiểm tra route tồn tại
      const route = await TuyenDuongModel.getById(id);
      if (!route) {
        return response.notFound(res, "Không tìm thấy tuyến đường");
      }

      // Kiểm tra stop có trong route không
      const RouteStopModel = (await import("../models/RouteStopModel.js")).default;
      const routeStops = await RouteStopModel.getByRouteId(id);
      const stopInRoute = routeStops.find((rs) => rs.maDiem === parseInt(stop_id));
      
      if (!stopInRoute) {
        return response.validationError(res, "Điểm dừng không thuộc tuyến đường này", [
          { field: "stop_id", message: "Điểm dừng không tồn tại trong tuyến đường" },
        ]);
      }

      // Tạo suggestions
      const suggestions = student_ids.map((studentId) => ({
        maTuyen: parseInt(id),
        maDiemDung: parseInt(stop_id),
        maHocSinh: parseInt(studentId),
      }));

      // Lưu vào database
      const StudentStopSuggestionModel = (await import("../models/StudentStopSuggestionModel.js")).default;
      const affectedRows = await StudentStopSuggestionModel.bulkCreate(suggestions);

      return response.ok(res, {
        message: `Đã thêm ${affectedRows} học sinh vào điểm dừng`,
        routeId: parseInt(id),
        stopId: parseInt(stop_id),
        addedCount: affectedRows,
        totalRequested: student_ids.length,
      });
    } catch (error) {
      console.error("Error in RouteController.bulkAddStudentsToStop:", error);
      return response.serverError(res, "Lỗi server khi thêm học sinh vào điểm dừng", error);
    }
  }
}

export default RouteController;

