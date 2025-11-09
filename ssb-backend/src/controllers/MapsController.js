// MapsController - Controller cho Google Maps API proxy
import MapsService from "../services/MapsService.js";

class MapsController {
  // Get Directions
  static async getDirections(req, res) {
    try {
      const { origin, destination, waypoints, mode, alternatives, avoid, language, units } = req.body;

      // Validation
      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "origin và destination là bắt buộc",
          },
        });
      }

      const result = await MapsService.getDirections({
        origin,
        destination,
        waypoints,
        mode: mode || "driving",
        alternatives: alternatives || false,
        avoid: avoid || [],
        language: language || "vi",
        units: units || "metric",
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Lấy directions thành công",
      });
    } catch (error) {
      if (error.message.includes("MAPS_API_KEY")) {
        return res.status(503).json({
          success: false,
          error: {
            code: "MAPS_API_NOT_CONFIGURED",
            message: "Maps API key chưa được cấu hình",
          },
        });
      }

      if (error.message.includes("Maps API")) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MAPS_API_ERROR",
            message: error.message,
          },
        });
      }

      console.error("Error in MapsController.getDirections:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi gọi Maps API",
        },
      });
    }
  }

  // Get Distance Matrix
  static async getDistanceMatrix(req, res) {
    try {
      const { origins, destinations, mode, avoid, language, units, departure_time, traffic_model } = req.body;

      // Validation
      if (!origins || !Array.isArray(origins) || origins.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "origins (mảng) là bắt buộc",
          },
        });
      }

      if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "destinations (mảng) là bắt buộc",
          },
        });
      }

      const result = await MapsService.getDistanceMatrix({
        origins,
        destinations,
        mode: mode || "driving",
        avoid: avoid || [],
        language: language || "vi",
        units: units || "metric",
        departure_time,
        traffic_model,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Lấy distance matrix thành công",
      });
    } catch (error) {
      if (error.message.includes("MAPS_API_KEY")) {
        return res.status(503).json({
          success: false,
          error: {
            code: "MAPS_API_NOT_CONFIGURED",
            message: "Maps API key chưa được cấu hình",
          },
        });
      }

      if (error.message.includes("Maps API")) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MAPS_API_ERROR",
            message: error.message,
          },
        });
      }

      console.error("Error in MapsController.getDistanceMatrix:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi gọi Maps API",
        },
      });
    }
  }

  // Geocode
  static async geocode(req, res) {
    try {
      const { address, latlng, language } = req.body;

      // Validation
      if (!address && !latlng) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "address hoặc latlng là bắt buộc",
          },
        });
      }

      const result = await MapsService.geocode({
        address,
        latlng,
        language: language || "vi",
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Geocode thành công",
      });
    } catch (error) {
      if (error.message.includes("MAPS_API_KEY")) {
        return res.status(503).json({
          success: false,
          error: {
            code: "MAPS_API_NOT_CONFIGURED",
            message: "Maps API key chưa được cấu hình",
          },
        });
      }

      if (error.message.includes("Maps API")) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MAPS_API_ERROR",
            message: error.message,
          },
        });
      }

      console.error("Error in MapsController.geocode:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi gọi Maps API",
        },
      });
    }
  }

  // Reverse Geocode
  static async reverseGeocode(req, res) {
    try {
      const { latlng, language } = req.body;

      // Validation
      if (!latlng) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "latlng là bắt buộc",
          },
        });
      }

      const result = await MapsService.reverseGeocode(latlng, language || "vi");

      res.status(200).json({
        success: true,
        data: result,
        message: "Reverse geocode thành công",
      });
    } catch (error) {
      if (error.message.includes("MAPS_API_KEY")) {
        return res.status(503).json({
          success: false,
          error: {
            code: "MAPS_API_NOT_CONFIGURED",
            message: "Maps API key chưa được cấu hình",
          },
        });
      }

      if (error.message.includes("Maps API")) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MAPS_API_ERROR",
            message: error.message,
          },
        });
      }

      console.error("Error in MapsController.reverseGeocode:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi gọi Maps API",
        },
      });
    }
  }

  // Snap to Roads
  static async snapToRoads(req, res) {
    try {
      const { path, interpolate } = req.body;

      // Validation
      if (!path || !Array.isArray(path) || path.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "path (mảng {lat, lng}) là bắt buộc",
          },
        });
      }

      const result = await MapsService.snapToRoads({
        path,
        interpolate: interpolate !== undefined ? interpolate : true,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Snap to roads thành công",
      });
    } catch (error) {
      if (error.message.includes("MAPS_API_KEY")) {
        return res.status(503).json({
          success: false,
          error: {
            code: "MAPS_API_NOT_CONFIGURED",
            message: "Maps API key chưa được cấu hình",
          },
        });
      }

      if (error.message.includes("Maps API")) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MAPS_API_ERROR",
            message: error.message,
          },
        });
      }

      console.error("Error in MapsController.snapToRoads:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server khi gọi Maps API",
        },
      });
    }
  }
}

export default MapsController;

