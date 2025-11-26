import BusStopOptimizationService from "../services/BusStopOptimizationService.js";
import VehicleRoutingService from "../services/VehicleRoutingService.js";
import RouteFromOptimizationService from "../services/RouteFromOptimizationService.js";
import ScheduleFromRoutesService from "../services/ScheduleFromRoutesService.js";

/**
 * Controller cho Bus Stop Optimization và Vehicle Routing
 */
class BusStopOptimizationController {
  /**
   * POST /api/v1/bus-stops/optimize
   * Chạy Tầng 1 - Greedy Maximum Coverage
   */
  static async optimizeBusStops(req, res) {
    try {
      const {
        r_walk = 500, // meters
        s_max = 25,
        max_stops = null,
        use_roads_api = true,
        use_places_api = true,
        students = null, // Optional: nếu không có sẽ lấy từ DB
      } = req.body;

      // Validate parameters
      if (r_walk <= 0 || r_walk > 2000) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PARAMETER",
            message: "r_walk phải trong khoảng (0, 2000] mét",
          },
        });
      }

      if (s_max <= 0 || s_max > 100) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PARAMETER",
            message: "s_max phải trong khoảng (0, 100]",
          },
        });
      }

      const result = await BusStopOptimizationService.greedyMaximumCoverage({
        students,
        R_walk: r_walk,
        S_max: s_max,
        MAX_STOPS: max_stops,
        useRoadsAPI: use_roads_api,
        usePlacesAPI: use_places_api,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Tối ưu hóa điểm dừng thành công: ${result.stats.totalStops} điểm dừng, ${result.stats.assignedStudents} học sinh`,
      });
    } catch (error) {
      console.error("Error in BusStopOptimizationController.optimizeBusStops:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Lỗi server khi tối ưu hóa điểm dừng",
        },
      });
    }
  }

  /**
   * POST /api/v1/routes/optimize-vrp
   * Chạy Tầng 2 - Vehicle Routing Problem
   */
  static async optimizeVRP(req, res) {
    try {
      const {
        depot = { lat: 10.77653, lng: 106.700981 }, // Đại học Sài Gòn mặc định
        capacity = 40,
        split_virtual_nodes = true,
      } = req.body;

      // Validate parameters
      if (!depot || typeof depot.lat !== "number" || typeof depot.lng !== "number") {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PARAMETER",
            message: "depot phải là object có lat và lng",
          },
        });
      }

      if (capacity <= 0 || capacity > 100) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PARAMETER",
            message: "capacity phải trong khoảng (0, 100]",
          },
        });
      }

      const result = await VehicleRoutingService.solveVRP({
        depot,
        capacity,
        splitVirtualNodes: split_virtual_nodes,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Tối ưu hóa tuyến xe thành công: ${result.stats.totalRoutes} tuyến, ${result.stats.totalStudents} học sinh`,
      });
    } catch (error) {
      console.error("Error in BusStopOptimizationController.optimizeVRP:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Lỗi server khi tối ưu hóa tuyến xe",
        },
      });
    }
  }

  /**
   * POST /api/v1/bus-stops/optimize-full
   * Chạy cả 2 tầng: Tầng 1 (Greedy Maximum Coverage) + Tầng 2 (VRP)
   */
  static async optimizeFull(req, res) {
    try {
      const {
        school_location = { lat: 10.77653, lng: 106.700981 },
        r_walk = 500,
        s_max = 25,
        c_bus = 40,
        max_stops = null,
        use_roads_api = true,
        use_places_api = true,
        split_virtual_nodes = true,
      } = req.body;

      // Validate parameters
      if (!school_location || typeof school_location.lat !== "number" || typeof school_location.lng !== "number") {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PARAMETER",
            message: "school_location phải là object có lat và lng",
          },
        });
      }

      console.log(`[BusStopOptimization] Starting full optimization pipeline`);

      // Tầng 1: Tối ưu điểm dừng
      console.log(`[BusStopOptimization] Tier 1: Greedy Maximum Coverage`);
      const tier1Result = await BusStopOptimizationService.greedyMaximumCoverage({
        R_walk: r_walk,
        S_max: s_max,
        MAX_STOPS: max_stops,
        useRoadsAPI: use_roads_api,
        usePlacesAPI: use_places_api,
      });

      // Tầng 2: Tối ưu tuyến xe
      console.log(`[BusStopOptimization] Tier 2: Vehicle Routing Problem`);
      const tier2Result = await VehicleRoutingService.solveVRP({
        depot: school_location,
        capacity: c_bus,
        splitVirtualNodes: split_virtual_nodes,
      });

      const result = {
        tier1: tier1Result,
        tier2: tier2Result,
        summary: {
          totalStops: tier1Result.stats.totalStops,
          totalStudents: tier1Result.stats.assignedStudents,
          totalRoutes: tier2Result.stats.totalRoutes,
          averageStudentsPerStop: tier1Result.stats.averageStudentsPerStop,
          averageStopsPerRoute: tier2Result.stats.averageStopsPerRoute,
        },
      };

      res.status(200).json({
        success: true,
        data: result,
        message: `Tối ưu hóa hoàn chỉnh thành công: ${result.summary.totalStops} điểm dừng, ${result.summary.totalRoutes} tuyến xe`,
      });
    } catch (error) {
      console.error("Error in BusStopOptimizationController.optimizeFull:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Lỗi server khi tối ưu hóa hoàn chỉnh",
        },
      });
    }
  }

  /**
   * GET /api/v1/bus-stops/assignments
   * Lấy danh sách assignments hiện tại
   */
  static async getAssignments(req, res) {
    try {
      const assignments = await BusStopOptimizationService.getAssignments();

      res.status(200).json({
        success: true,
        data: assignments,
        message: `Lấy ${assignments.length} assignments thành công`,
      });
    } catch (error) {
      console.error("Error in BusStopOptimizationController.getAssignments:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Lỗi server khi lấy assignments",
        },
      });
    }
  }

  /**
   * GET /api/v1/bus-stops/stats
   * Lấy thống kê về điểm dừng và assignments
   */
  static async getStats(req, res) {
    try {
      const stats = await BusStopOptimizationService.getStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: "Lấy thống kê thành công",
      });
    } catch (error) {
      console.error("Error in BusStopOptimizationController.getStats:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Lỗi server khi lấy thống kê",
        },
      });
    }
  }

  /**
   * POST /api/v1/bus-stops/create-routes
   * Tạo tuyến đường từ kết quả VRP optimization
   */
  static async createRoutes(req, res) {
    try {
      const {
        vrp_result = null, // Optional: kết quả VRP nếu đã có
        depot = { lat: 10.77653, lng: 106.700981, name: "Đại học Sài Gòn" },
        capacity = 40,
        route_name_prefix = "Tuyến Tối Ưu",
        create_return_routes = true,
      } = req.body;

      // Validate depot
      if (!depot || typeof depot.lat !== "number" || typeof depot.lng !== "number") {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PARAMETER",
            message: "depot phải là object có lat và lng",
          },
        });
      }

      console.log(`[BusStopOptimization] Creating routes from VRP optimization`);

      const result = await RouteFromOptimizationService.createRoutesFromVRP({
        vrpResult: vrp_result,
        depot,
        capacity,
        routeNamePrefix: route_name_prefix,
        createReturnRoutes: create_return_routes,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Tạo tuyến đường thành công: ${result.stats.totalRoutes} tuyến`,
      });
    } catch (error) {
      console.error("Error in BusStopOptimizationController.createRoutes:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Lỗi server khi tạo tuyến đường",
        },
      });
    }
  }

  /**
   * POST /api/v1/bus-stops/create-schedules
   * Tự động tạo lịch trình từ tuyến đường đã tạo
   */
  static async createSchedules(req, res) {
    try {
      const {
        route_ids = null,
        default_departure_time = "06:00:00",
        auto_assign_bus = true,
        auto_assign_driver = true,
        ngay_chay = null,
      } = req.body;

      console.log(`[BusStopOptimization] Creating schedules from routes`);

      const result = await ScheduleFromRoutesService.createSchedulesFromRoutes({
        routeIds: route_ids,
        defaultDepartureTime: default_departure_time,
        autoAssignBus: auto_assign_bus,
        autoAssignDriver: auto_assign_driver,
        ngayChay: ngay_chay,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Tạo lịch trình thành công: ${result.stats.totalSchedules} lịch trình`,
      });
    } catch (error) {
      console.error("Error in BusStopOptimizationController.createSchedules:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Lỗi server khi tạo lịch trình",
        },
      });
    }
  }
}

export default BusStopOptimizationController;

